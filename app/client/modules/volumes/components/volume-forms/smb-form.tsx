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
import { SecretInput } from "../../../../components/ui/secret-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";

type Props = {
	form: UseFormReturn<FormValues>;
};

export const SMBForm = ({ form }: Props) => {
	return (
		<>
			<FormField
				control={form.control}
				name="server"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Servidor</FormLabel>
						<FormControl>
							<Input placeholder="192.168.1.100" value={field.value} onChange={field.onChange} />
						</FormControl>
						<FormDescription>Dirección IP o nombre del host del servidor SMB.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="share"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Share</FormLabel>
						<FormControl>
							<Input placeholder="myshare" value={field.value} onChange={field.onChange} />
						</FormControl>
						<FormDescription>Nombre del recurso compartido SMB en el servidor.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="username"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Nombre de usuario</FormLabel>
						<FormControl>
							<Input placeholder="admin" value={field.value} onChange={field.onChange} />
						</FormControl>
						<FormDescription>Nombre de usuario para la autenticación SMB.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="password"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Contraseña</FormLabel>
						<FormControl>
							<SecretInput placeholder="••••••••" value={field.value ?? ""} onChange={field.onChange} />
						</FormControl>
						<FormDescription>Contraseña para la autenticación SMB.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="vers"
				defaultValue="3.0"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Versión de SMB</FormLabel>
						<Select onValueChange={field.onChange} value={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Seleccione la versión de SMB" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="1.0">SMB v1.0</SelectItem>
								<SelectItem value="2.0">SMB v2.0</SelectItem>
								<SelectItem value="2.1">SMB v2.1</SelectItem>
								<SelectItem value="3.0">SMB v3.0</SelectItem>
							</SelectContent>
						</Select>
						<FormDescription>Versión del protocolo SMB a utilizar (predeterminada: 3.0).</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="domain"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Dominio (Opcional)</FormLabel>
						<FormControl>
							<Input placeholder="WORKGROUP" value={field.value} onChange={field.onChange} />
						</FormControl>
						<FormDescription>Dominio o grupo de trabajo para la autenticación (opcional).</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="port"
				defaultValue={445}
				render={({ field }) => (
					<FormItem>
						<FormLabel>Port</FormLabel>
						<FormControl>
							<Input
								type="number"
								placeholder="445"
								value={field.value}
								onChange={(e) => field.onChange(parseInt(e.target.value, 10) || undefined)}
							/>
						</FormControl>
						<FormDescription>Puerto del servidor SMB (predeterminado: 445).</FormDescription>
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
