import type { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../../../components/ui/form";
import { Input } from "../../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { listRcloneRemotesOptions } from "../../../../api-client/@tanstack/react-query.gen";
import type { RepositoryFormValues } from "../create-repository-form";

type Props = {
	form: UseFormReturn<RepositoryFormValues>;
};

export const RcloneRepositoryForm = ({ form }: Props) => {
	const { data: rcloneRemotes, isLoading: isLoadingRemotes } = useQuery(listRcloneRemotesOptions());

	if (!isLoadingRemotes && (!rcloneRemotes || rcloneRemotes.length === 0)) {
		return (
			<Alert>
				<AlertDescription className="space-y-2">
					<p className="font-medium">No hay remotos Rclone configurados</p>
					<p className="text-sm text-muted-foreground">
						Para usar Rclone, necesita configurar remotos en su sistema host
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
						<Select onValueChange={(v) => field.onChange(v)} defaultValue={field.value} value={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Seleccione un remoto Rclone" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{isLoadingRemotes ? (
									<SelectItem value="loading" disabled>
										Cargando remotos...
									</SelectItem>
								) : (
									rcloneRemotes?.map((remote: { name: string; type: string }) => (
										<SelectItem key={remote.name} value={remote.name}>
											{remote.name} ({remote.type})
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
						<FormDescription>Seleccione el remoto Rclone configurado en su sistema host.</FormDescription>
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
							<Input placeholder="backups/c3i-backup-one" {...field} />
						</FormControl>
						<FormDescription>Ruta dentro del remoto donde se almacenarán las copias de seguridad.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
