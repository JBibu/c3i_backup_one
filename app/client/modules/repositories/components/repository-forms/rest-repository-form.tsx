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

export const RestRepositoryForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="url"
				render={({ field }) => (
					<FormItem>
						<FormLabel>URL del Servidor REST</FormLabel>
						<FormControl>
							<Input placeholder="http://192.168.1.30:8000" {...field} />
						</FormControl>
						<FormDescription>URL del servidor REST.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="path"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Ruta del Repositorio (Opcional)</FormLabel>
						<FormControl>
							<Input placeholder="my-backup-repo" {...field} />
						</FormControl>
						<FormDescription>Ruta del repositorio en el servidor REST (deje vacío para raíz).</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="username"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Nombre de Usuario (Opcional)</FormLabel>
						<FormControl>
							<Input placeholder="nombre-de-usuario" {...field} />
						</FormControl>
						<FormDescription>Nombre de usuario para autenticación en el servidor REST.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="password"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Contraseña (Opcional)</FormLabel>
						<FormControl>
							<SecretInput placeholder="••••••••" value={field.value ?? ""} onChange={field.onChange} />
						</FormControl>
						<FormDescription>Contraseña para autenticación en el servidor REST.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
