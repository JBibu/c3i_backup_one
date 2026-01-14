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
import { Switch } from "../../../../components/ui/switch";
import type { RepositoryFormValues } from "../create-repository-form";

type Props = {
	form: UseFormReturn<RepositoryFormValues>;
};

export const SftpRepositoryForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="host"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Host</FormLabel>
						<FormControl>
							<Input placeholder="192.168.1.100" {...field} />
						</FormControl>
						<FormDescription>Nombre de host o dirección IP del servidor SFTP.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="port"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Puerto</FormLabel>
						<FormControl>
							<Input
								type="number"
								placeholder="22"
								{...field}
								onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
							/>
						</FormControl>
						<FormDescription>Puerto SSH (predeterminado: 22).</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="user"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Usuario</FormLabel>
						<FormControl>
							<Input placeholder="backup-user" {...field} />
						</FormControl>
						<FormDescription>Nombre de usuario SSH para autenticación.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="path"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Ruta</FormLabel>
						<FormControl>
							<Input placeholder="backups/c3i-backup-one" {...field} />
						</FormControl>
						<FormDescription>Ruta del repositorio en el servidor SFTP. </FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="privateKey"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Clave Privada SSH</FormLabel>
						<FormControl>
							<Textarea
								{...field}
								placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
							/>
						</FormControl>
						<FormDescription>Pegue el contenido de su clave privada SSH.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="skipHostKeyCheck"
				render={({ field }) => (
					<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
						<div className="space-y-0.5">
							<FormLabel>Omitir Verificación de Clave de Host</FormLabel>
							<FormDescription>
								Deshabilitar la verificación de clave de host SSH. Útil para servidores con IPs dinámicas o claves autofirmadas.
							</FormDescription>
						</div>
						<FormControl>
							<Switch checked={field.value} onCheckedChange={field.onChange} />
						</FormControl>
					</FormItem>
				)}
			/>
			{!form.watch("skipHostKeyCheck") && (
				<FormField
					control={form.control}
					name="knownHosts"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Hosts Conocidos</FormLabel>
							<FormControl>
								<Textarea
									placeholder="example.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ..."
									className="font-mono text-xs"
									rows={3}
									{...field}
									value={field.value ?? ""}
								/>
							</FormControl>
							<FormDescription>
								El contenido del archivo <code>known_hosts</code> para este servidor.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}
		</>
	);
};
