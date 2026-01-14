use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::io::{BufRead, BufReader};
use tauri::{AppHandle, Manager, State};
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::image::Image;
use tauri_plugin_autostart::ManagerExt;

struct AppState {
    backend_port: Mutex<Option<u16>>,
    sidecar_running: Mutex<bool>,
    sidecar_process: Mutex<Option<Child>>,
}

#[tauri::command]
fn get_backend_url(state: State<AppState>) -> Result<String, String> {
    let port = state.backend_port.lock().map_err(|e| e.to_string())?;
    match *port {
        Some(p) => Ok(format!("http://localhost:{}", p)),
        None => Err("Backend not started yet".to_string()),
    }
}

#[tauri::command]
fn get_data_dir(app: AppHandle) -> Result<String, String> {
    app.path()
        .app_data_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn open_data_dir(app: AppHandle) -> Result<(), String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&data_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&data_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&data_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn open_logs_dir(app: AppHandle) -> Result<(), String> {
    let logs_dir = app.path().app_log_dir().map_err(|e| e.to_string())?;

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&logs_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&logs_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&logs_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn is_backend_ready(state: State<AppState>) -> bool {
    *state.sidecar_running.lock().unwrap_or_else(|e| e.into_inner())
}

#[tauri::command]
async fn get_autostart_enabled(app: tauri::AppHandle) -> Result<bool, String> {
    let autostart_manager = app.autolaunch();
    autostart_manager.is_enabled().map_err(|e| e.to_string())
}

#[tauri::command]
async fn set_autostart_enabled(app: tauri::AppHandle, enable: bool) -> Result<(), String> {
    let autostart_manager = app.autolaunch();

    if enable {
        autostart_manager.enable().map_err(|e| e.to_string())
    } else {
        autostart_manager.disable().map_err(|e| e.to_string())
    }
}

#[tauri::command]
async fn send_notification(app: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;

    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| e.to_string())
}

fn get_sidecar_path(app: &AppHandle) -> Option<std::path::PathBuf> {
    // First check if there's a compiled sidecar in resources
    if let Ok(resource_dir) = app.path().resource_dir() {
        let target = if cfg!(target_os = "windows") {
            "x86_64-pc-windows-msvc"
        } else if cfg!(target_os = "macos") {
            if cfg!(target_arch = "aarch64") {
                "aarch64-apple-darwin"
            } else {
                "x86_64-apple-darwin"
            }
        } else {
            if cfg!(target_arch = "aarch64") {
                "aarch64-unknown-linux-gnu"
            } else {
                "x86_64-unknown-linux-gnu"
            }
        };

        let ext = if cfg!(target_os = "windows") { ".exe" } else { "" };
        let sidecar_name = format!("c3i-backup-one-server-{}{}", target, ext);
        let sidecar_path = resource_dir.join(&sidecar_name);

        if sidecar_path.exists() {
            return Some(sidecar_path);
        }
    }

    None
}

fn get_resources_path(app: &AppHandle) -> Option<std::path::PathBuf> {
    app.path().resource_dir().ok().map(|p| p.join("bin"))
}

fn get_migrations_path(app: &AppHandle) -> Option<std::path::PathBuf> {
    app.path().resource_dir().ok().map(|p| p.join("drizzle"))
}

async fn start_sidecar_async(app: AppHandle) -> Result<(), String> {
    // In debug mode (tauri dev), the Vite server is already running on port 4096
    // No need to spawn a separate sidecar
    if cfg!(debug_assertions) {
        log::info!("Development mode: using Vite dev server on port 4096");
        let state = app.state::<AppState>();
        {
            let mut port_lock = state.backend_port.lock().map_err(|e| e.to_string())?;
            *port_lock = Some(4096);
        }
        {
            let mut running = state.sidecar_running.lock().map_err(|e| e.to_string())?;
            *running = true;
        }
        return Ok(());
    }

    let state = app.state::<AppState>();
    start_sidecar(app.clone(), &state).await
}

async fn start_sidecar(app: AppHandle, state: &AppState) -> Result<(), String> {
    let port = portpicker::pick_unused_port().ok_or("Failed to find available port")?;

    // Get paths
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let resources_path = get_resources_path(&app)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();
    let migrations_path = get_migrations_path(&app)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    // Ensure data directory exists
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;

    let db_path = data_dir.join("c3i-backup-one.db");
    let repos_dir = data_dir.join("repositories");
    let volumes_dir = data_dir.join("volumes");
    let cache_dir = data_dir.join("cache");
    let passfile = data_dir.join("restic-pass");

    // Create subdirectories
    std::fs::create_dir_all(&repos_dir).map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&volumes_dir).map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;

    log::info!("Starting sidecar on port {}", port);
    log::info!("Data directory: {:?}", data_dir);
    log::info!("Resources path: {}", resources_path);
    log::info!("Migrations path: {}", migrations_path);

    // Try to find the sidecar binary
    let sidecar_path = get_sidecar_path(&app);

    let mut child = if let Some(path) = sidecar_path {
        log::info!("Using compiled sidecar: {:?}", path);
        log::info!("Sidecar exists: {}", path.exists());

        // Verify migrations exist
        if let Some(migrations) = get_migrations_path(&app) {
            log::info!("Migrations path: {:?}, exists: {}", migrations, migrations.exists());
        }

        Command::new(&path)
            .env("PORT", port.to_string())
            .env("C3I_BACKUP_ONE_TAURI", "1")
            .env("C3I_BACKUP_ONE_RESOURCES_PATH", &resources_path)
            .env("MIGRATIONS_PATH", &migrations_path)
            .env("DATABASE_URL", db_path.to_string_lossy().to_string())
            .env("C3I_BACKUP_ONE_REPOSITORIES_DIR", repos_dir.to_string_lossy().to_string())
            .env("C3I_BACKUP_ONE_VOLUMES_DIR", volumes_dir.to_string_lossy().to_string())
            .env("RESTIC_CACHE_DIR", cache_dir.to_string_lossy().to_string())
            .env("RESTIC_PASS_FILE", passfile.to_string_lossy().to_string())
            .env("NODE_ENV", "production")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn sidecar at {:?}: {}", path, e))?
    } else {
        // In development, try to run with bun directly
        log::warn!("No compiled sidecar found, trying bun for development...");

        // Get the project root (parent of src-tauri)
        let project_root = app
            .path()
            .resource_dir()
            .map_err(|e| e.to_string())?
            .parent()
            .map(|p| p.to_path_buf())
            .unwrap_or_else(|| std::env::current_dir().unwrap_or_default());

        log::info!("Project root: {:?}", project_root);

        Command::new("bun")
            .arg("run")
            .arg("start")
            .current_dir(&project_root)
            .env("PORT", port.to_string())
            .env("C3I_BACKUP_ONE_TAURI", "1")
            .env("C3I_BACKUP_ONE_RESOURCES_PATH", &resources_path)
            .env("MIGRATIONS_PATH", &migrations_path)
            .env("DATABASE_URL", db_path.to_string_lossy().to_string())
            .env("C3I_BACKUP_ONE_REPOSITORIES_DIR", repos_dir.to_string_lossy().to_string())
            .env("C3I_BACKUP_ONE_VOLUMES_DIR", volumes_dir.to_string_lossy().to_string())
            .env("RESTIC_CACHE_DIR", cache_dir.to_string_lossy().to_string())
            .env("RESTIC_PASS_FILE", passfile.to_string_lossy().to_string())
            .env("NODE_ENV", "production")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn bun server: {}", e))?
    };

    // Capture and log sidecar output
    if let Some(stdout) = child.stdout.take() {
        let reader = BufReader::new(stdout);
        std::thread::spawn(move || {
            for line in reader.lines() {
                if let Ok(line) = line {
                    log::info!("[SIDECAR] {}", line);
                }
            }
        });
    }

    if let Some(stderr) = child.stderr.take() {
        let reader = BufReader::new(stderr);
        std::thread::spawn(move || {
            for line in reader.lines() {
                if let Ok(line) = line {
                    log::error!("[SIDECAR] {}", line);
                }
            }
        });
    }

    // Store the port and process
    {
        let mut port_lock = state.backend_port.lock().map_err(|e| e.to_string())?;
        *port_lock = Some(port);
    }
    {
        let mut process_lock = state.sidecar_process.lock().map_err(|e| e.to_string())?;
        *process_lock = Some(child);
    }

    // Wait for server to be ready
    let backend_url = format!("http://localhost:{}", port);
    let mut attempts = 0;
    let max_attempts = 120; // 60 seconds

    log::info!("Waiting for backend to respond at {}/healthcheck", backend_url);

    while attempts < max_attempts {
        match reqwest::get(format!("{}/healthcheck", backend_url)).await {
            Ok(resp) if resp.status().is_success() => {
                log::info!("Backend is ready on port {}", port);
                let mut running = state.sidecar_running.lock().map_err(|e| e.to_string())?;
                *running = true;
                return Ok(());
            }
            Ok(resp) => {
                log::warn!("Backend responded with status: {} (attempt {}/{})", resp.status(), attempts + 1, max_attempts);
                attempts += 1;
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            }
            Err(e) => {
                if attempts == 0 || attempts % 10 == 0 {
                    log::warn!("Failed to connect to backend: {} (attempt {}/{})", e, attempts + 1, max_attempts);
                }
                attempts += 1;
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            }
        }
    }

    // Check if process is still running
    {
        let mut process_lock = state.sidecar_process.lock().map_err(|e| e.to_string())?;
        if let Some(child) = process_lock.as_mut() {
            match child.try_wait() {
                Ok(Some(status)) => {
                    return Err(format!("Backend process exited with status: {}", status));
                }
                Ok(None) => {
                    log::error!("Backend process is still running but not responding");
                }
                Err(e) => {
                    log::error!("Failed to check backend process status: {}", e);
                }
            }
        }
    }

    Err("Backend failed to start within timeout - check logs directory for details".to_string())
}

fn stop_sidecar(state: &AppState) {
    if let Ok(mut process_lock) = state.sidecar_process.lock() {
        if let Some(mut child) = process_lock.take() {
            let _ = child.kill();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // When another instance tries to start, show and focus the existing window
            log::info!("Another instance attempted to start, focusing existing window");
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .manage(AppState {
            backend_port: Mutex::new(None),
            sidecar_running: Mutex::new(false),
            sidecar_process: Mutex::new(None),
        })
        .setup(|app| {
            // Enable logging in both debug and release builds
            let log_level = if cfg!(debug_assertions) {
                log::LevelFilter::Info
            } else {
                log::LevelFilter::Info
            };

            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log_level)
                    .build(),
            )?;

            // Create system tray (ordered same as sidebar)
            let show = MenuItemBuilder::with_id("show", "Mostrar App").build(app)?;
            let volumes = MenuItemBuilder::with_id("volumes", "Volúmenes").build(app)?;
            let repositories = MenuItemBuilder::with_id("repositories", "Repositorios").build(app)?;
            let backups = MenuItemBuilder::with_id("backups", "Copias de seguridad").build(app)?;
            let notifications = MenuItemBuilder::with_id("notifications", "Notificaciones").build(app)?;
            let settings = MenuItemBuilder::with_id("settings", "Configuración").build(app)?;
            let open_logs = MenuItemBuilder::with_id("open_logs", "Abrir logs").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Salir").build(app)?;

            let menu = MenuBuilder::new(app)
                .item(&show)
                .separator()
                .item(&volumes)
                .item(&repositories)
                .item(&backups)
                .item(&notifications)
                .separator()
                .item(&settings)
                .item(&open_logs)
                .separator()
                .item(&quit)
                .build()?;

            // Load tray icon from embedded bytes (custom zerobyte logo)
            let icon = Image::from_bytes(include_bytes!("../../public/images/zerobyte.png"))
                .expect("Failed to load tray icon");

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| {
                    match event.id().as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "volumes" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.eval("window.location.href = '/volumes'");
                            }
                        }
                        "repositories" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.eval("window.location.href = '/repositories'");
                            }
                        }
                        "backups" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.eval("window.location.href = '/backups'");
                            }
                        }
                        "notifications" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.eval("window.location.href = '/notifications'");
                            }
                        }
                        "settings" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.eval("window.location.href = '/settings'");
                            }
                        }
                        "open_logs" => {
                            let _ = open_logs_dir(app.clone());
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Start sidecar in background
            let app_handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                if let Err(e) = start_sidecar_async(app_handle).await {
                    log::error!("Failed to start sidecar: {}", e);
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    // Hide window instead of closing (minimize to tray)
                    window.hide().unwrap();
                    api.prevent_close();
                }
                tauri::WindowEvent::Destroyed => {
                    // Only stop sidecar when window is actually destroyed
                    let state: State<AppState> = window.state();
                    stop_sidecar(&*state);
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_backend_url,
            get_data_dir,
            open_data_dir,
            open_logs_dir,
            is_backend_ready,
            get_autostart_enabled,
            set_autostart_enabled,
            send_notification,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
