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
import { Input } from "../../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";

type Props = {
	form: UseFormReturn<FormValues>;
};

export const NFSForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="server"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Servidor</FormLabel>
						<FormControl>
							<Input placeholder="192.168.1.100" {...field} />
						</FormControl>
						<FormDescription>Dirección IP o nombre del host del servidor NFS.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="exportPath"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Ruta de Exportación</FormLabel>
						<FormControl>
							<Input placeholder="/export/data" {...field} />
						</FormControl>
						<FormDescription>Ruta a la exportación NFS en el servidor.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="port"
				defaultValue={2049}
				render={({ field }) => (
					<FormItem>
						<FormLabel>Port</FormLabel>
						<FormControl>
							<Input
								type="number"
								placeholder="2049"
								{...field}
								onChange={(e) => field.onChange(parseInt(e.target.value, 10) || undefined)}
							/>
						</FormControl>
						<FormDescription>Puerto del servidor NFS (predeterminado: 2049).</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="version"
				defaultValue="4.1"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Versión</FormLabel>
						<Select onValueChange={field.onChange} value={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Seleccione la versión de NFS" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="3">NFS v3</SelectItem>
								<SelectItem value="4">NFS v4</SelectItem>
								<SelectItem value="4.1">NFS v4.1</SelectItem>
							</SelectContent>
						</Select>
						<FormDescription>Versión del protocolo NFS a utilizar.</FormDescription>
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
