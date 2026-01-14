import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Download } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { AuthLayout } from "~/client/components/auth-layout";
import { Alert, AlertDescription, AlertTitle } from "~/client/components/ui/alert";
import { Button } from "~/client/components/ui/button";
import { Input } from "~/client/components/ui/input";
import { Label } from "~/client/components/ui/label";
import { authMiddleware } from "~/middleware/auth";
import type { Route } from "./+types/download-recovery-key";
import { downloadResticPasswordMutation } from "~/client/api-client/@tanstack/react-query.gen";

export const clientMiddleware = [authMiddleware];

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "C3i Backup ONE - Descargar Clave de Recuperación" },
		{
			name: "description",
			content: "Descargue su clave de recuperación de respaldo para asegurar que pueda restaurar sus datos.",
		},
	];
}

export default function DownloadRecoveryKeyPage() {
	const navigate = useNavigate();
	const [password, setPassword] = useState("");

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

			toast.success("Clave de recuperación descargada correctamente");
			void navigate("/volumes", { replace: true });
		},
		onError: (error) => {
			toast.error("Error al descargar la clave de recuperación", { description: error.message });
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!password) {
			toast.error("La contraseña es obligatoria");
			return;
		}

		downloadResticPassword.mutate({
			body: {
				password,
			},
		});
	};

	return (
		<AuthLayout
			title="Descargue su Clave de Recuperación"
			description="Este es un paso crítico para asegurar que pueda recuperar sus respaldos"
		>
			<Alert variant="warning" className="mb-6">
				<AlertTriangle className="size-5" />
				<AlertTitle>Importante: Guarde este archivo de forma segura</AlertTitle>
				<AlertDescription>
					Su contraseña de Restic es esencial para recuperar los datos de sus respaldos. Si pierde el acceso a este servidor sin
					este archivo, sus respaldos serán irrecuperables. Guárdelo en un gestor de contraseñas o almacenamiento cifrado.
				</AlertDescription>
			</Alert>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="password">Confirme su contraseña</Label>
					<Input
						id="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Introduzca su contraseña"
						required
						disabled={downloadResticPassword.isPending}
					/>
					<p className="text-xs text-muted-foreground">Introduzca la contraseña de su cuenta para descargar la clave de recuperación</p>
				</div>

				<div className="flex flex-col gap-2">
					<Button type="submit" loading={downloadResticPassword.isPending} className="w-full">
						<Download size={16} className="mr-2" />
						Descargar clave de recuperación
					</Button>
				</div>
			</form>
		</AuthLayout>
	);
}
