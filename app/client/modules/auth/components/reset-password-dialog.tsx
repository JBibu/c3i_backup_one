import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/client/components/ui/dialog";

const RESET_PASSWORD_COMMAND = "docker exec -it c3i-backup-one bun run cli reset-password";

type ResetPasswordDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export const ResetPasswordDialog = ({ open, onOpenChange }: ResetPasswordDialogProps) => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Restablecer su contraseña</DialogTitle>
					<DialogDescription>
						Para restablecer su contraseña, ejecute el siguiente comando en el servidor donde está instalado C3i Backup ONE.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="rounded-md bg-muted p-4 font-mono text-sm break-all select-all">{RESET_PASSWORD_COMMAND}</div>
					<p className="text-sm text-muted-foreground">
						Este comando iniciará una sesión interactiva donde podrá introducir una nueva contraseña para su cuenta.
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
};
