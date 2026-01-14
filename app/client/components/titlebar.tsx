/**
 * Custom window titlebar with drag region and window controls
 */

import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Maximize, X } from "lucide-react";

export function Titlebar() {
	const handleMinimize = async () => {
		try {
			const win = getCurrentWindow();
			await win.minimize();
		} catch (error) {
			console.error("Failed to minimize window:", error);
		}
	};

	const handleMaximize = async () => {
		try {
			const win = getCurrentWindow();
			await win.toggleMaximize();
		} catch (error) {
			console.error("Failed to maximize window:", error);
		}
	};

	const handleClose = async () => {
		try {
			const win = getCurrentWindow();
			await win.close();
		} catch (error) {
			console.error("Failed to close window:", error);
		}
	};

	return (
		<div
			data-tauri-drag-region
			onDoubleClick={handleMaximize}
			className="fixed top-0 left-0 right-0 h-8 bg-background border-b border-border flex items-center justify-between px-3 select-none z-[100]"
		>
			{/* Left side - Company name */}
			<div className="flex items-center gap-2 text-sm font-medium" data-tauri-drag-region>
				<span className="text-muted-foreground font-medium">C3i Servicios Informáticos</span>
			</div>

			{/* Right side - Window controls */}
			<div className="flex items-center">
				<button
					type="button"
					onClick={handleMinimize}
					className="h-8 w-10 inline-flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
					title="Minimizar"
					aria-label="Minimizar ventana"
				>
					<Minus className="h-4 w-4" />
				</button>
				<button
					type="button"
					onClick={handleMaximize}
					className="h-8 w-10 inline-flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
					title="Maximizar"
					aria-label="Maximizar ventana"
				>
					<Maximize className="h-4 w-4" />
				</button>
				<button
					type="button"
					onClick={handleClose}
					className="h-8 w-10 inline-flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
					title="Cerrar"
					aria-label="Cerrar ventana"
				>
					<X className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}
