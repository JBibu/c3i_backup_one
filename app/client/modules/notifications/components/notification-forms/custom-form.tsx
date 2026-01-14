import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/client/components/ui/form";
import { Input } from "~/client/components/ui/input";
import type { NotificationFormValues } from "../create-notification-form";

type Props = {
	form: UseFormReturn<NotificationFormValues>;
};

export const CustomForm = ({ form }: Props) => {
	return (
		<FormField
			control={form.control}
			name="shoutrrrUrl"
			render={({ field }) => (
				<FormItem>
					<FormLabel>URL de Shoutrrr</FormLabel>
					<FormControl>
						<Input
							{...field}
							placeholder="smtp://user:pass@smtp.gmail.com:587/?from=you@gmail.com&to=recipient@example.com"
						/>
					</FormControl>
					<FormDescription>
						URL directa de Shoutrrr para usuarios avanzados. Consulte la&nbsp;
						<a
							href="https://shoutrrr.nickfedor.com/latest/services/overview/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-strong-accent hover:underline"
						>
							documentación de Shoutrrr
						</a>
						&nbsp;para conocer los servicios compatibles y los formatos de URL.
					</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
