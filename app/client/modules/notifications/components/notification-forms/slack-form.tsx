import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/client/components/ui/form";
import { Input } from "~/client/components/ui/input";
import type { NotificationFormValues } from "../create-notification-form";

type Props = {
	form: UseFormReturn<NotificationFormValues>;
};

export const SlackForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="webhookUrl"
				render={({ field }) => (
					<FormItem>
						<FormLabel>URL del Webhook</FormLabel>
						<FormControl>
							<Input
								{...field}
								placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"
							/>
						</FormControl>
						<FormDescription>Obtenga esto desde la configuración de Webhooks entrantes de su aplicación Slack.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="channel"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Canal (Opcional)</FormLabel>
						<FormControl>
							<Input {...field} placeholder="#backups" />
						</FormControl>
						<FormDescription>Anule el canal predeterminado (use # para canales, @ para usuarios).</FormDescription>
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
				name="iconEmoji"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Emoji del icono (Opcional)</FormLabel>
						<FormControl>
							<Input {...field} placeholder=":floppy_disk:" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
