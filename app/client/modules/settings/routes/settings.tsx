import { useMutation } from "@tanstack/react-query";
import { Download, KeyRound, User, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { downloadResticPasswordMutation } from "~/client/api-client/@tanstack/react-query.gen";
import { Button } from "~/client/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "~/client/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/client/components/ui/dialog";
import { Input } from "~/client/components/ui/input";
import { Label } from "~/client/components/ui/label";
import { authClient } from "~/client/lib/auth-client";
import { appContext } from "~/context";
import { TwoFactorSection } from "../components/two-factor-section";
import { AutostartSection } from "../components/autostart-section";
import type { Route } from "./+types/settings";

export const handle = {
	breadcrumb: () => [{ label: "Configuración" }],
};

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "C3i Backup ONE - Configuración" },
		{
			name: "description",
			content: "Gestione la configuración y preferencias de su cuenta.",
		},
	];
}

export async function clientLoader({ context }: Route.LoaderArgs) {
	const ctx = context.get(appContext);
	return ctx;
}

export default function Settings({ loaderData }: Route.ComponentProps) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
	const [downloadPassword, setDownloadPassword] = useState("");
	const [isChangingPassword, setIsChangingPassword] = useState(false);

	const navigate = useNavigate();

	const handleLogout = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					void navigate("/login", { replace: true });
				},
				onError: ({ error }) => {
					console.error(error);
					toast.error("Error al cerrar sesión", { description: error.message });
				},
			},
		});
	};

	const downloadResticPassword = useMutation({
		...downloadResticPasswordMutation(),
		onSuccess: (data) => {
			const blob = new Blob([data], { type: "text/plain" });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "restic.pass";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);

			toast.success("Archivo de contraseña Restic descargado con éxito");
			setDownloadDialogOpen(false);
			setDownloadPassword("");
		},
		onError: (error) => {
			toast.error("Error al descargar la contraseña Restic", {
				description: error.message,
			});
		},
	});

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();

		if (newPassword !== confirmPassword) {
			toast.error("Las contraseñas no coinciden");
			return;
		}

		if (newPassword.length < 8) {
			toast.error("La contraseña debe tener al menos 8 caracteres");
			return;
		}

		await authClient.changePassword({
			newPassword,
			currentPassword: currentPassword,
			revokeOtherSessions: true,
			fetchOptions: {
				onSuccess: () => {
					toast.success("Contraseña cambiada con éxito. Su sesión se cerrará.");
					setTimeout(() => {
						void handleLogout();
					}, 1500);
				},
				onError: ({ error }) => {
					toast.error("Error al cambiar la contraseña", {
						description: error.message,
					});
				},
				onRequest: () => {
					setIsChangingPassword(true);
				},
				onResponse: () => {
					setIsChangingPassword(false);
				},
			},
		});
	};

	const handleDownloadResticPassword = (e: React.FormEvent) => {
		e.preventDefault();

		if (!downloadPassword) {
			toast.error("Se requiere la contraseña");
			return;
		}

		downloadResticPassword.mutate({
			body: {
				password: downloadPassword,
			},
		});
	};

	return (
		<Card className="p-0 gap-0">
			<div className="border-b border-border/50 bg-card-header p-6">
				<CardTitle className="flex items-center gap-2">
					<User className="size-5" />
					Información de la cuenta
				</CardTitle>
				<CardDescription className="mt-1.5">Detalles de su cuenta</CardDescription>
			</div>
			<CardContent className="p-6 space-y-4">
				<div className="space-y-2">
					<Label>Nombre de usuario</Label>
					<Input value={loaderData.user?.username || ""} disabled className="max-w-md" />
				</div>
				{/* <div className="space-y-2"> */}
				{/* 	<Label>Email</Label> */}
				{/* 	<Input value={loaderData.user?.email || ""} disabled className="max-w-md" /> */}
				{/* </div> */}
			</CardContent>

			<div className="border-t border-border/50 bg-card-header p-6">
				<CardTitle className="flex items-center gap-2">
					<KeyRound className="size-5" />
					Cambiar contraseña
				</CardTitle>
				<CardDescription className="mt-1.5">Actualice su contraseña para mantener su cuenta segura</CardDescription>
			</div>
			<CardContent className="p-6">
				<form onSubmit={handleChangePassword} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="current-password">Contraseña actual</Label>
						<Input
							id="current-password"
							type="password"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							className="max-w-md"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="new-password">Nueva contraseña</Label>
						<Input
							id="new-password"
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							className="max-w-md"
							required
							minLength={8}
						/>
						<p className="text-xs text-muted-foreground">Debe tener al menos 8 caracteres</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
						<Input
							id="confirm-password"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className="max-w-md"
							required
							minLength={8}
						/>
					</div>
					<Button type="submit" loading={isChangingPassword} className="mt-4">
						<KeyRound className="h-4 w-4 mr-2" />
						Cambiar contraseña
					</Button>
				</form>
			</CardContent>

			<div className="border-t border-border/50 bg-card-header p-6">
				<CardTitle className="flex items-center gap-2">
					<Download className="size-5" />
					Clave de recuperación de copias de seguridad
				</CardTitle>
				<CardDescription className="mt-1.5">Descargue su clave de recuperación para copias de seguridad Restic</CardDescription>
			</div>
			<CardContent className="p-6 space-y-4">
				<p className="text-sm text-muted-foreground max-w-2xl">
					Este archivo contiene la contraseña de cifrado utilizada por Restic para proteger sus copias de seguridad. Guárdelo en un lugar seguro
					(como un gestor de contraseñas o almacenamiento cifrado). Si pierde el acceso a este servidor, necesitará este archivo para
					recuperar sus datos de copias de seguridad.
				</p>

				<Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
					<DialogTrigger asChild>
						<Button variant="outline">
							<Download size={16} className="mr-2" />
							Descargar clave de recuperación
						</Button>
					</DialogTrigger>
					<DialogContent>
						<form onSubmit={handleDownloadResticPassword}>
							<DialogHeader>
								<DialogTitle>Descargar clave de recuperación</DialogTitle>
								<DialogDescription>
									Por razones de seguridad, introduzca la contraseña de su cuenta para descargar el archivo de clave de recuperación.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="download-password">Su contraseña</Label>
									<Input
										id="download-password"
										type="password"
										value={downloadPassword}
										onChange={(e) => setDownloadPassword(e.target.value)}
										placeholder="Introduzca su contraseña"
										required
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setDownloadDialogOpen(false);
										setDownloadPassword("");
									}}
								>
									<X className="h-4 w-4 mr-2" />
									Cancelar
								</Button>
								<Button type="submit" loading={downloadResticPassword.isPending}>
									<Download className="h-4 w-4 mr-2" />
									Descargar
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</CardContent>

			<TwoFactorSection twoFactorEnabled={loaderData.user?.twoFactorEnabled} />

		<AutostartSection />
		</Card>
	);
}
