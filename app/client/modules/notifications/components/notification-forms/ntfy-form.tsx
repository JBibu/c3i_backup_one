import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/client/components/ui/form";
import { Input } from "~/client/components/ui/input";
import { SecretInput } from "~/client/components/ui/secret-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/client/components/ui/select";
import type { NotificationFormValues } from "../create-notification-form";

type Props = {
	form: UseFormReturn<NotificationFormValues>;
};

export const NtfyForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="serverUrl"
				render={({ field }) => (
					<FormItem>
						<FormLabel>URL del servidor (Opcional)</FormLabel>
						<FormControl>
							<Input {...field} placeholder="https://ntfy.example.com" />
						</FormControl>
						<FormDescription>Déjelo vacío para usar el servicio público ntfy.sh.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="topic"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Tema</FormLabel>
						<FormControl>
							<Input {...field} placeholder="c3i-backup-one-backups" />
						</FormControl>
						<FormDescription>El nombre del tema de ntfy en el que publicar.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="username"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Nombre de usuario (Opcional)</FormLabel>
						<FormControl>
							<Input {...field} placeholder="username" />
						</FormControl>
						<FormDescription>Nombre de usuario para la autenticación del servidor, si es necesario.</FormDescription>
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
							<SecretInput {...field} placeholder="••••••••" />
						</FormControl>
						<FormDescription>Contraseña para la autenticación del servidor, si es necesario.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="accessToken"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Token de acceso (Opcional)</FormLabel>
						<FormControl>
							<SecretInput {...field} placeholder="••••••••" />
						</FormControl>
						<FormDescription>
							Token de acceso para la autenticación del servidor. Tendrá prioridad sobre el nombre de usuario/contraseña si está establecido.
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="priority"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Prioridad</FormLabel>
						<Select onValueChange={field.onChange} defaultValue={String(field.value)} value={String(field.value)}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Seleccione la prioridad" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="max">Máxima (5)</SelectItem>
								<SelectItem value="high">Alta (4)</SelectItem>
								<SelectItem value="default">Predeterminada (3)</SelectItem>
								<SelectItem value="low">Baja (2)</SelectItem>
								<SelectItem value="min">Mínima (1)</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
