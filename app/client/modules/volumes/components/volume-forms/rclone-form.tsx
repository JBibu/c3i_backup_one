import { ExternalLink } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { Input } from "../../../../components/ui/input";
import { listRcloneRemotesOptions } from "~/client/api-client/@tanstack/react-query.gen";
import { useSystemInfo } from "~/client/hooks/use-system-info";
import { useQuery } from "@tanstack/react-query";

type Props = {
	form: UseFormReturn<FormValues>;
};

export const RcloneForm = ({ form }: Props) => {
	const { capabilities } = useSystemInfo();

	const { data: rcloneRemotes, isPending } = useQuery({
		...listRcloneRemotesOptions(),
		enabled: capabilities.rclone,
	});

	if (!isPending && !rcloneRemotes?.length) {
		return (
			<Alert>
				<AlertDescription className="space-y-2">
					<p className="font-medium">No hay remotos de Rclone configurados</p>
					<p className="text-sm text-muted-foreground">
						Para utilizar Rclone, necesita configurar remotos en su sistema host
					</p>
					<a
						href="https://rclone.org/docs/"
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm text-strong-accent inline-flex items-center gap-1"
					>
						Ver documentación de Rclone
						<ExternalLink className="w-3 h-3" />
					</a>
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<>
			<FormField
				control={form.control}
				name="remote"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Remoto</FormLabel>
						<Select onValueChange={(v) => field.onChange(v)} value={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Seleccione un remoto de Rclone" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{isPending ? (
									<SelectItem value="loading" disabled>
										Cargando remotos...
									</SelectItem>
								) : (
									rcloneRemotes?.map((remote) => (
										<SelectItem key={remote.name} value={remote.name}>
											{remote.name} ({remote.type})
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
						<FormDescription>Seleccione el remoto de Rclone configurado en su sistema host.</FormDescription>
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
							<Input placeholder="/" {...field} />
						</FormControl>
						<FormDescription>Ruta en el remoto a montar. Utilice "/" para la raíz.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="readOnly"
				defaultValue={false}
				render={({ field }) => (
					<FormItem>
						<FormLabel>Modo de Solo Lectura</FormLabel>
						<FormControl>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									checked={field.value ?? false}
									onChange={(e) => field.onChange(e.target.checked)}
									className="rounded border-gray-300"
								/>
								<span className="text-sm">Montar volumen como solo lectura</span>
							</div>
						</FormControl>
						<FormDescription>
							Evita cualquier modificación al volumen. Recomendado para orígenes de copias de seguridad y datos sensibles.
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
