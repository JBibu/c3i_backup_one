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

export const AzureRepositoryForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="container"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Container</FormLabel>
						<FormControl>
							<Input placeholder="my-backup-container" {...field} />
						</FormControl>
						<FormDescription>Nombre del container de Azure Blob Storage para almacenar las copias de seguridad.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="accountName"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Nombre de Cuenta</FormLabel>
						<FormControl>
							<Input placeholder="mystorageaccount" {...field} />
						</FormControl>
						<FormDescription>Nombre de la cuenta de Azure Storage.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="accountKey"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Clave de Cuenta</FormLabel>
						<FormControl>
							<SecretInput placeholder="••••••••" value={field.value ?? ""} onChange={field.onChange} />
						</FormControl>
						<FormDescription>Clave de la cuenta de Azure Storage para autenticación.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="endpointSuffix"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Sufijo de Endpoint (Opcional)</FormLabel>
						<FormControl>
							<Input placeholder="core.windows.net" {...field} />
						</FormControl>
						<FormDescription>Sufijo de endpoint Azure personalizado (predeterminado: core.windows.net).</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
