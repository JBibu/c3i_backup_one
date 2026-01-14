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

export const S3RepositoryForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="endpoint"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Endpoint</FormLabel>
						<FormControl>
							<Input placeholder="s3.amazonaws.com" {...field} />
						</FormControl>
						<FormDescription>URL del endpoint compatible con S3.</FormDescription>
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
						<FormDescription>Nombre del bucket S3 para almacenar las copias de seguridad.</FormDescription>
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
							<Input placeholder="AKIAIOSFODNN7EXAMPLE" {...field} />
						</FormControl>
						<FormDescription>ID de clave de acceso S3 para autenticación.</FormDescription>
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
						<FormDescription>Clave de acceso secreta S3 para autenticación.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
