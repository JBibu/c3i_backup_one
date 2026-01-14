import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Power } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CardContent, CardDescription, CardTitle } from "~/client/components/ui/card";
import { Label } from "~/client/components/ui/label";
import { Switch } from "~/client/components/ui/switch";
import { isTauri } from "~/client/lib/tauri";

export function AutostartSection() {
	const [isTauriApp, setIsTauriApp] = useState(false);
	const queryClient = useQueryClient();

	useEffect(() => {
		setIsTauriApp(isTauri());
	}, []);

	// Query to get autostart status
	const { data: autostartEnabled, isLoading } = useQuery({
		queryKey: ["autostart-status"],
		queryFn: async () => {
			if (!isTauriApp) return false;

			try {
				const { invoke } = await import("@tauri-apps/api/core");
				return await invoke<boolean>("get_autostart_enabled");
			} catch (error) {
				console.error("Failed to get autostart status:", error);
				return false;
			}
		},
		enabled: isTauriApp,
	});

	// Mutation to toggle autostart
	const toggleAutostart = useMutation({
		mutationFn: async (enable: boolean) => {
			if (!isTauriApp) {
				throw new Error("Autostart is only available in the desktop app");
			}

			const { invoke } = await import("@tauri-apps/api/core");
			await invoke("set_autostart_enabled", { enable });
			return enable;
		},
		onSuccess: (enabled) => {
			queryClient.setQueryData(["autostart-status"], enabled);
			toast.success(
				enabled
					? "Inicio automático habilitado. La aplicación se iniciará al iniciar sesión."
					: "Inicio automático deshabilitado",
			);
		},
		onError: (error) => {
			toast.error("Error al cambiar el inicio automático", {
				description: error instanceof Error ? error.message : "Error desconocido",
			});
		},
	});

	// Don't render if not in Tauri app
	if (!isTauriApp) {
		return null;
	}

	return (
		<>
			<div className="border-t border-border/50 bg-card-header p-6">
				<CardTitle className="flex items-center gap-2">
					<Power className="size-5" />
					Inicio automático
				</CardTitle>
				<CardDescription className="mt-1.5">
					Iniciar la aplicación automáticamente al iniciar sesión en el sistema
				</CardDescription>
			</div>
			<CardContent className="p-6 space-y-4">
				<div className="flex items-center justify-between max-w-md">
					<div className="space-y-0.5">
						<Label htmlFor="autostart-toggle" className="text-base cursor-pointer">
							Habilitar inicio automático
						</Label>
						<p className="text-sm text-muted-foreground">
							La aplicación se iniciará automáticamente cuando inicie sesión en su computadora
						</p>
					</div>
					<Switch
						id="autostart-toggle"
						checked={autostartEnabled ?? false}
						onCheckedChange={(checked) => toggleAutostart.mutate(checked)}
						disabled={isLoading || toggleAutostart.isPending}
					/>
				</div>

				{autostartEnabled && (
					<div className="p-3 bg-muted/50 rounded-md max-w-2xl">
						<p className="text-sm text-muted-foreground">
							💡 <strong>Consejo:</strong> Con el inicio automático habilitado, sus copias de seguridad programadas se ejecutarán
							automáticamente, incluso si olvida abrir la aplicación.
						</p>
					</div>
				)}
			</CardContent>
		</>
	);
}
