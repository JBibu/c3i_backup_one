import type { UseFormReturn } from "react-hook-form";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../../../components/ui/form";
import { Textarea } from "../../../../components/ui/textarea";
import { Checkbox } from "../../../../components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../../components/ui/collapsible";
import type { RepositoryFormValues } from "../create-repository-form";
import { cn } from "~/client/lib/utils";

type Props = {
	form: UseFormReturn<RepositoryFormValues>;
};

export const AdvancedForm = ({ form }: Props) => {
	const insecureTls = form.watch("insecureTls");
	const cacert = form.watch("cacert");

	return (
		<Collapsible>
			<CollapsibleTrigger className="">Configuración Avanzada</CollapsibleTrigger>
			<CollapsibleContent className="pb-4 space-y-4">
				<FormField
					control={form.control}
					name="insecureTls"
					render={({ field }) => (
						<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
							<FormControl>
								<Tooltip delayDuration={500}>
									<TooltipTrigger asChild>
										<div>
											<Checkbox
												checked={field.value ?? false}
												disabled={!!cacert}
												onCheckedChange={(checked) => {
													field.onChange(checked);
												}}
											/>
										</div>
									</TooltipTrigger>
									<TooltipContent className={cn({ hidden: !cacert })}>
										<p className="max-w-xs">
											Esta opción está deshabilitada porque se proporcionó un certificado CA. Elimine el certificado CA para omitir la validación TLS en su lugar.
										</p>
									</TooltipContent>
								</Tooltip>
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>Omitir verificación de certificado TLS</FormLabel>
								<FormDescription>
									Deshabilitar la verificación de certificado TLS para conexiones HTTPS con certificados autofirmados. Esto es inseguro y solo debe usarse para pruebas.
								</FormDescription>
							</div>
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="cacert"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Certificado CA (Opcional)</FormLabel>
							<FormControl>
								<Tooltip delayDuration={500}>
									<TooltipTrigger asChild>
										<div>
											<Textarea
												placeholder={"-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"}
												rows={6}
												disabled={insecureTls}
												{...field}
											/>
										</div>
									</TooltipTrigger>
									<TooltipContent className={cn({ hidden: !insecureTls })}>
										<p className="max-w-xs">
											El certificado CA está deshabilitado porque se está omitiendo la validación TLS. Desmarque "Omitir verificación de certificado TLS" para proporcionar un certificado CA personalizado.
										</p>
									</TooltipContent>
								</Tooltip>
							</FormControl>
							<FormDescription>
								Certificado CA personalizado para certificados autofirmados (formato PEM). Esto se aplica a conexiones HTTPS.&nbsp;
								<a
									href="https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html#rest-server"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									Más información
								</a>
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CollapsibleContent>
		</Collapsible>
	);
};
