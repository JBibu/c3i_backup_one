import type { UseFormReturn } from "react-hook-form";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../../../components/ui/form";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import type { RepositoryFormValues } from "../create-repository-form";

type Props = {
	form: UseFormReturn<RepositoryFormValues>;
};

export const GCSRepositoryForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="bucket"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Bucket</FormLabel>
						<FormControl>
							<Input placeholder="my-backup-bucket" {...field} />
						</FormControl>
						<FormDescription>Nombre del bucket GCS para almacenar las copias de seguridad.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="projectId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>ID de Proyecto</FormLabel>
						<FormControl>
							<Input placeholder="my-gcp-project-123" {...field} />
						</FormControl>
						<FormDescription>ID del proyecto de Google Cloud.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="credentialsJson"
				render={({ field }) => (
					<FormItem>
						<FormLabel>JSON de Cuenta de Servicio</FormLabel>
						<FormControl>
							<Textarea placeholder="Pegue la clave JSON de la cuenta de servicio..." {...field} />
						</FormControl>
						<FormDescription>Credenciales JSON de la cuenta de servicio para autenticación.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
