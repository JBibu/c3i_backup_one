import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/client/components/ui/form";
import { Input } from "~/client/components/ui/input";
import { SecretInput } from "~/client/components/ui/secret-input";
import type { NotificationFormValues } from "../create-notification-form";

type Props = {
	form: UseFormReturn<NotificationFormValues>;
};

export const GotifyForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="serverUrl"
				render={({ field }) => (
					<FormItem>
						<FormLabel>URL del servidor</FormLabel>
						<FormControl>
							<Input {...field} placeholder="https://gotify.example.com" />
						</FormControl>
						<FormDescription>URL de su servidor Gotify autoalojado.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="token"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Token de la aplicación</FormLabel>
						<FormControl>
							<SecretInput {...field} placeholder="••••••••" />
						</FormControl>
						<FormDescription>Token de aplicación de Gotify.</FormDescription>
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
						<FormControl>
							<Input
								{...field}
								type="number"
								min={0}
								max={10}
								onChange={(e) => field.onChange(Number(e.target.value))}
							/>
						</FormControl>
						<FormDescription>Nivel de prioridad (0-10, donde 10 es el más alto).</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="path"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Ruta (Opcional)</FormLabel>
						<FormControl>
							<Input {...field} placeholder="/custom/path" />
						</FormControl>
						<FormDescription>Ruta personalizada en el servidor Gotify, si aplica.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
