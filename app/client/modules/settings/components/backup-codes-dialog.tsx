import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "~/client/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/client/components/ui/dialog";
import { Input } from "~/client/components/ui/input";
import { Label } from "~/client/components/ui/label";
import { authClient } from "~/client/lib/auth-client";

type BackupCodesDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export const BackupCodesDialog = ({ open, onOpenChange }: BackupCodesDialogProps) => {
	const [password, setPassword] = useState("");
	const [backupCodes, setBackupCodes] = useState<string[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);

	const handleGenerate = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!password) {
			toast.error("La contraseña es obligatoria");
			return;
		}

		const { data, error } = await authClient.twoFactor.generateBackupCodes({
			password,
			fetchOptions: {
				onRequest: () => {
					setIsGenerating(true);
				},
				onResponse: () => {
					setIsGenerating(false);
				},
			},
		});

		if (error) {
			console.error(error);
			toast.error("Error al generar códigos de recuperación", { description: error.message });
			return;
		}

		setBackupCodes(data.backupCodes);
		setPassword("");
		toast.success("Nuevos códigos de recuperación generados correctamente");
	};

	const handleClose = () => {
		onOpenChange(false);
		setTimeout(() => {
			setBackupCodes([]);
			setPassword("");
		}, 200);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Códigos de recuperación</DialogTitle>
					<DialogDescription>
						Use estos códigos para acceder a su cuenta si pierde el acceso a su aplicación de autenticación. Cada código solo puede
						usarse una vez.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					{backupCodes.length > 0 ? (
						<>
							<div className="p-3 bg-muted rounded-md space-y-1 max-h-48 overflow-y-auto">
								{backupCodes.map((code) => (
									<div key={code} className="text-sm font-mono py-1">
										<span className="select-all block w-full">{code}</span>
									</div>
								))}
							</div>
						</>
					) : (
						<form onSubmit={handleGenerate} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="backup-codes-password">Su contraseña</Label>
								<Input
									id="backup-codes-password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Introduzca su contraseña"
									required
								/>
							</div>
							<Button type="submit" loading={isGenerating} className="w-full">
								<RefreshCw className="h-4 w-4 mr-2" />
								Generar nuevos códigos
							</Button>
						</form>
					)}
				</div>
				<DialogFooter>
					<Button type="button" onClick={handleClose}>
						Cerrar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
