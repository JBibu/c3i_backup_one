import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/client/components/ui/form";
import { Input } from "~/client/components/ui/input";
import type { NotificationFormValues } from "../create-notification-form";

type Props = {
	form: UseFormReturn<NotificationFormValues>;
};

export const DiscordForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="webhookUrl"
				render={({ field }) => (
					<FormItem>
						<FormLabel>URL del Webhook</FormLabel>
						<FormControl>
							<Input {...field} placeholder="https://discord.com/api/webhooks/WEBHOOK_ID/WEBHOOK_TOKEN" />
						</FormControl>
						<FormDescription>Obtenga esto desde la configuración de Integraciones de su servidor Discord.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="username"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Nombre de usuario del bot (Opcional)</FormLabel>
						<FormControl>
							<Input {...field} placeholder="C3i Backup ONE" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="avatarUrl"
				render={({ field }) => (
					<FormItem>
						<FormLabel>URL del avatar (Opcional)</FormLabel>
						<FormControl>
							<Input {...field} placeholder="https://example.com/avatar.png" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="threadId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>ID del hilo (Opcional)</FormLabel>
						<FormControl>
							<Input {...field} />
						</FormControl>
						<FormDescription>
							ID del hilo en el que publicar mensajes. Déjelo vacío para publicar en el canal principal.
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
