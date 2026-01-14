import { useState } from "react";
import { toast } from "sonner";
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

type TwoFactorDisableDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
};

export const TwoFactorDisableDialog = ({ open, onOpenChange, onSuccess }: TwoFactorDisableDialogProps) => {
	const [password, setPassword] = useState("");
	const [isDisabling, setIsDisabling] = useState(false);

	const handleDisable = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!password) {
			toast.error("La contraseña es obligatoria");
			return;
		}

		const { error } = await authClient.twoFactor.disable({
			password,
			fetchOptions: {
				onRequest: () => {
					setIsDisabling(true);
				},
				onResponse: () => {
					setIsDisabling(false);
				},
			},
		});

		if (error) {
			console.error(error);
			toast.error("Error al deshabilitar 2FA", { description: error.message });
			return;
		}

		toast.success("Autenticación de dos factores deshabilitada correctamente");
		handleClose();
		onSuccess();
	};

	const handleClose = () => {
		onOpenChange(false);
		setPassword("");
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent>
				<form onSubmit={handleDisable}>
					<DialogHeader>
						<DialogTitle>Deshabilitar autenticación de dos factores</DialogTitle>
						<DialogDescription>
							¿Está seguro de que desea deshabilitar 2FA? Su cuenta será menos segura. Introduzca su contraseña para confirmar.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="disable-password">Su contraseña</Label>
							<Input
								id="disable-password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Introduzca su contraseña"
								required
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={handleClose}>
							Cancelar
						</Button>
						<Button type="submit" variant="destructive" loading={isDisabling}>
							Deshabilitar 2FA
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
