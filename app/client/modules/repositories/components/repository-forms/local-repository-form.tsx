import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Check, Pencil, X, AlertTriangle } from "lucide-react";
import { REPOSITORY_BASE } from "~/client/lib/constants";
import { Button } from "../../../../components/ui/button";
import { FormItem, FormLabel, FormDescription } from "../../../../components/ui/form";
import { DirectoryBrowser } from "../../../../components/directory-browser";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";
import type { RepositoryFormValues } from "../create-repository-form";

type Props = {
	form: UseFormReturn<RepositoryFormValues>;
};

export const LocalRepositoryForm = ({ form }: Props) => {
	const [showPathBrowser, setShowPathBrowser] = useState(false);
	const [showPathWarning, setShowPathWarning] = useState(false);

	return (
		<>
			<FormItem>
				<FormLabel>Directorio del Repositorio</FormLabel>
				<div className="flex items-center gap-2">
					<div className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded-md border">
						{form.watch("path") || REPOSITORY_BASE}
					</div>
					<Button type="button" variant="outline" onClick={() => setShowPathWarning(true)} size="sm">
						<Pencil className="h-4 w-4 mr-2" />
						Cambiar
					</Button>
				</div>
				<FormDescription>El directorio donde se almacenará el repositorio.</FormDescription>
			</FormItem>

			<AlertDialog open={showPathWarning} onOpenChange={setShowPathWarning}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-yellow-500" />
							Importante: Se requiere montaje del host
						</AlertDialogTitle>
						<AlertDialogDescription className="space-y-3">
							<p>Al seleccionar una ruta personalizada, asegúrese de que esté montada desde la máquina host en el contenedor.</p>
							<p className="font-medium">
								Si la ruta no es un montaje del host, perderá los datos de su repositorio cuando el contenedor se reinicie.
							</p>
							<p className="text-sm text-muted-foreground">
								La ruta predeterminada <code className="bg-muted px-1 rounded">{REPOSITORY_BASE}</code> es segura de usar si siguió la configuración recomendada de Docker Compose.
							</p>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setShowPathBrowser(true);
								setShowPathWarning(false);
							}}
						>
							Entiendo, Continuar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={showPathBrowser} onOpenChange={setShowPathBrowser}>
				<AlertDialogContent className="max-w-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>Seleccionar Directorio del Repositorio</AlertDialogTitle>
						<AlertDialogDescription>
							Elija un directorio del sistema de archivos para almacenar el repositorio.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="py-4">
						<DirectoryBrowser
							onSelectPath={(path) => form.setValue("path", path)}
							selectedPath={form.watch("path") || REPOSITORY_BASE}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>
							<X className="h-4 w-4 mr-2" />
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction onClick={() => setShowPathBrowser(false)}>
							<Check className="h-4 w-4 mr-2" />
							Hecho
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};
