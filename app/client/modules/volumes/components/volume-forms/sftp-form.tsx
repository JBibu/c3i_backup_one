import type { UseFormReturn } from "react-hook-form";
import type { FormValues } from "../create-volume-form";
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
import { Textarea } from "../../../../components/ui/textarea";
import { Switch } from "../../../../components/ui/switch";

type Props = {
	form: UseFormReturn<FormValues>;
};

export const SFTPForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="host"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Host</FormLabel>
						<FormControl>
							<Input placeholder="example.com" {...field} />
						</FormControl>
						<FormDescription>Nombre del host o dirección IP del servidor SFTP.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="port"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Port</FormLabel>
						<FormControl>
							<Input
								type="number"
								placeholder="22"
								{...field}
								onChange={(e) => field.onChange(parseInt(e.target.value, 10) || undefined)}
							/>
						</FormControl>
						<FormDescription>Puerto del servidor SFTP (predeterminado: 22).</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="username"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Nombre de usuario</FormLabel>
						<FormControl>
							<Input placeholder="root" {...field} />
						</FormControl>
						<FormDescription>Nombre de usuario para la autenticación SFTP.</FormDescription>
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
						<FormDescription>Contraseña para la autenticación SFTP (opcional si utiliza clave privada).</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="privateKey"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Clave Privada (Opcional)</FormLabel>
						<FormControl>
							<Textarea
								placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
								className="font-mono text-xs"
								rows={5}
								{...field}
								value={field.value ?? ""}
							/>
						</FormControl>
						<FormDescription>Clave privada SSH para la autenticación (opcional si utiliza contraseña).</FormDescription>
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
							<Input placeholder="/backups" {...field} />
						</FormControl>
						<FormDescription>Ruta al directorio en el servidor SFTP.</FormDescription>
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
							<FormLabel>Omitir Verificación de Clave del Host</FormLabel>
							<FormDescription>
								Desactiva la verificación de clave del host SSH. Útil para servidores con IPs dinámicas o claves autofirmadas.
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
