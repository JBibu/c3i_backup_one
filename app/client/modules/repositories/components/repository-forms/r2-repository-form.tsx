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
import { SecretInput } from "../../../../components/ui/secret-input";
import type { RepositoryFormValues } from "../create-repository-form";

type Props = {
	form: UseFormReturn<RepositoryFormValues>;
};

export const R2RepositoryForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="endpoint"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Endpoint</FormLabel>
						<FormControl>
							<Input placeholder="<account-id>.r2.cloudflarestorage.com" {...field} />
						</FormControl>
						<FormDescription>
							Endpoint R2 (sin https://). Encuéntrelo en el panel de R2 en la configuración del bucket.
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="bucket"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Bucket</FormLabel>
						<FormControl>
							<Input placeholder="my-backup-bucket" {...field} />
						</FormControl>
						<FormDescription>Nombre del bucket R2 para almacenar las copias de seguridad.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="accessKeyId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>ID de Clave de Acceso</FormLabel>
						<FormControl>
							<Input placeholder="ID de clave de acceso de tokens de API R2" {...field} />
						</FormControl>
						<FormDescription>ID de clave de acceso del token de API R2 (crear en el panel de Cloudflare R2).</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="secretAccessKey"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Clave de Acceso Secreta</FormLabel>
						<FormControl>
							<SecretInput placeholder="••••••••" value={field.value ?? ""} onChange={field.onChange} />
						</FormControl>
						<FormDescription>Clave de acceso secreta del token de API R2 (se muestra una sola vez al crear el token).</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
