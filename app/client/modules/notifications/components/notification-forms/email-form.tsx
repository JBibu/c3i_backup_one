import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/client/components/ui/form";
import { Input } from "~/client/components/ui/input";
import { SecretInput } from "~/client/components/ui/secret-input";
import { Checkbox } from "~/client/components/ui/checkbox";
import type { NotificationFormValues } from "../create-notification-form";

type Props = {
	form: UseFormReturn<NotificationFormValues>;
};

export const EmailForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="smtpHost"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Servidor SMTP</FormLabel>
						<FormControl>
							<Input {...field} placeholder="smtp.example.com" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="smtpPort"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Puerto SMTP</FormLabel>
						<FormControl>
							<Input
								{...field}
								type="number"
								placeholder="587"
								onChange={(e) => field.onChange(Number(e.target.value))}
							/>
						</FormControl>
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
							<Input {...field} placeholder="user@example.com" />
						</FormControl>
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
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="from"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Dirección de origen</FormLabel>
						<FormControl>
							<Input {...field} placeholder="noreply@example.com" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="to"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Direcciones de destino</FormLabel>
						<FormControl>
							<Input
								{...field}
								placeholder="user@example.com, admin@example.com"
								value={Array.isArray(field.value) ? field.value.join(", ") : ""}
								onChange={(e) =>
									field.onChange(
										e.target.value
											.split(",")
											.map((email) => email.trim())
											.filter(Boolean),
									)
								}
							/>
						</FormControl>
						<FormDescription>Lista de direcciones de correo electrónico de los destinatarios separadas por comas.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="useTLS"
				render={({ field }) => (
					<FormItem className="flex flex-row items-center space-x-3">
						<FormControl>
							<Checkbox checked={field.value} onCheckedChange={field.onChange} />
						</FormControl>
						<div className="space-y-1 leading-none">
							<FormLabel>Usar TLS</FormLabel>
							<FormDescription>Habilitar cifrado TLS para la conexión SMTP.</FormDescription>
						</div>
					</FormItem>
				)}
			/>
		</>
	);
};
