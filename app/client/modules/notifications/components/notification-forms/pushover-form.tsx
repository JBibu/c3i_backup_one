import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/client/components/ui/form";
import { Input } from "~/client/components/ui/input";
import { SecretInput } from "~/client/components/ui/secret-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/client/components/ui/select";
import type { NotificationFormValues } from "../create-notification-form";

type Props = {
	form: UseFormReturn<NotificationFormValues>;
};

export const PushoverForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="userKey"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Clave de usuario</FormLabel>
						<FormControl>
							<Input {...field} placeholder="uQiRzpo4DXghDmr9QzzfQu27cmVRsG" />
						</FormControl>
						<FormDescription>Su clave de usuario de Pushover desde el panel de control.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="apiToken"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Token API</FormLabel>
						<FormControl>
							<SecretInput {...field} placeholder="••••••••" />
						</FormControl>
						<FormDescription>Token API de la aplicación desde su aplicación Pushover.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="devices"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Dispositivos (Opcional)</FormLabel>
						<FormControl>
							<Input {...field} placeholder="iphone,android" />
						</FormControl>
						<FormDescription>Lista de nombres de dispositivos separados por comas. Déjelo vacío para todos los dispositivos.</FormDescription>
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
						<Select
							onValueChange={(value) => field.onChange(Number(value))}
							defaultValue={String(field.value)}
							value={String(field.value)}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Seleccione la prioridad" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="-1">Baja (-1)</SelectItem>
								<SelectItem value="0">Normal (0)</SelectItem>
								<SelectItem value="1">Alta (1)</SelectItem>
							</SelectContent>
						</Select>
						<FormDescription>Nivel de prioridad del mensaje.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
