import { arktypeResolver } from "@hookform/resolvers/arktype";
import { type } from "arktype";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import { cn } from "~/client/lib/utils";
import { deepClean } from "~/utils/object";
import { Button } from "../../../components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { SecretInput } from "../../../components/ui/secret-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../components/ui/tooltip";
import { useSystemInfo } from "~/client/hooks/use-system-info";
import { COMPRESSION_MODES, repositoryConfigSchemaBase } from "~/schemas/restic";
import { Checkbox } from "../../../components/ui/checkbox";
import {
	LocalRepositoryForm,
	S3RepositoryForm,
	R2RepositoryForm,
	GCSRepositoryForm,
	AzureRepositoryForm,
	RcloneRepositoryForm,
	RestRepositoryForm,
	SftpRepositoryForm,
	AdvancedForm,
} from "./repository-forms";

export const formSchema = type({
	name: "2<=string<=32",
	compressionMode: type.valueOf(COMPRESSION_MODES).optional(),
}).and(repositoryConfigSchemaBase);
const cleanSchema = type.pipe((d) => formSchema(deepClean(d)));

export type RepositoryFormValues = typeof formSchema.inferIn;

type Props = {
	onSubmit: (values: RepositoryFormValues) => void;
	mode?: "create" | "update";
	initialValues?: Partial<RepositoryFormValues>;
	formId?: string;
	loading?: boolean;
	className?: string;
};

const defaultValuesForType = {
	local: { backend: "local" as const, compressionMode: "auto" as const },
	s3: { backend: "s3" as const, compressionMode: "auto" as const },
	r2: { backend: "r2" as const, compressionMode: "auto" as const },
	gcs: { backend: "gcs" as const, compressionMode: "auto" as const },
	azure: { backend: "azure" as const, compressionMode: "auto" as const },
	rclone: { backend: "rclone" as const, compressionMode: "auto" as const },
	rest: { backend: "rest" as const, compressionMode: "auto" as const },
	sftp: { backend: "sftp" as const, compressionMode: "auto" as const, port: 22, skipHostKeyCheck: false },
};

export const CreateRepositoryForm = ({
	onSubmit,
	mode = "create",
	initialValues,
	formId,
	loading,
	className,
}: Props) => {
	const form = useForm<RepositoryFormValues>({
		resolver: arktypeResolver(cleanSchema as unknown as typeof formSchema),
		defaultValues: initialValues,
		resetOptions: {
			keepDefaultValues: true,
			keepDirtyValues: false,
		},
	});

	const { watch, setValue } = form;

	const watchedBackend = watch("backend");
	const watchedIsExistingRepository = watch("isExistingRepository");

	const [passwordMode, setPasswordMode] = useState<"default" | "custom">("default");

	const { capabilities } = useSystemInfo();

	useEffect(() => {
		form.reset({
			name: form.getValues().name,
			isExistingRepository: form.getValues().isExistingRepository,
			customPassword: form.getValues().customPassword,
			...defaultValuesForType[watchedBackend as keyof typeof defaultValuesForType],
		});
	}, [watchedBackend, form]);

	return (
		<Form {...form}>
			<form id={formId} onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder="Nombre del repository"
									onChange={(e) => field.onChange(e.target.value)}
									maxLength={32}
									minLength={2}
								/>
							</FormControl>
							<FormDescription>Identificador único para el repository.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="backend"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Backend</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Seleccione un backend" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="local">Local</SelectItem>
									<SelectItem value="s3">S3</SelectItem>
									<SelectItem value="r2">Cloudflare R2</SelectItem>
									<SelectItem value="gcs">Google Cloud Storage</SelectItem>
									<SelectItem value="azure">Azure Blob Storage</SelectItem>
									<SelectItem value="rest">REST Server</SelectItem>
									<SelectItem value="sftp">SFTP</SelectItem>
									<Tooltip>
										<TooltipTrigger>
											<SelectItem disabled={!capabilities.rclone} value="rclone">
												rclone (40+ proveedores cloud)
											</SelectItem>
										</TooltipTrigger>
										<TooltipContent className={cn({ hidden: capabilities.rclone })}>
											<p>Configure rclone para usar este backend</p>
										</TooltipContent>
									</Tooltip>
								</SelectContent>
							</Select>
							<FormDescription>Elija el backend de almacenamiento para este repository.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="compressionMode"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Modo de Compresión</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Seleccione modo de compresión" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="off">Desactivado</SelectItem>
									<SelectItem value="auto">Auto (rápido)</SelectItem>
									<SelectItem value="max">Máximo (más lento, mejor compresión)</SelectItem>
								</SelectContent>
							</Select>
							<FormDescription>Modo de compresión para las copias de seguridad almacenadas en este repository.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="isExistingRepository"
					render={({ field }) => (
						<FormItem className="flex flex-row items-center space-x-3">
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={(checked) => {
										field.onChange(checked);
										if (!checked) {
											setPasswordMode("default");
											setValue("customPassword", undefined);
										}
									}}
								/>
							</FormControl>
							<div className="space-y-1">
								<FormLabel>Importar repository existente</FormLabel>
								<FormDescription>Marque esto si el repository ya existe en la ubicación especificada</FormDescription>
							</div>
						</FormItem>
					)}
				/>
				{watchedIsExistingRepository && (
					<>
						<FormItem>
							<FormLabel>Contraseña del Repository</FormLabel>
							<Select
								onValueChange={(value) => {
									setPasswordMode(value as "default" | "custom");
									if (value === "default") {
										setValue("customPassword", undefined);
									}
								}}
								defaultValue={passwordMode}
								value={passwordMode}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Seleccione opción de contraseña" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="default">Usar la clave de recuperación existente</SelectItem>
									<SelectItem value="custom">Introducir contraseña manualmente</SelectItem>
								</SelectContent>
							</Select>
							<FormDescription>
								Elija si desea usar la clave de recuperación de C3i Backup ONE (que descargó al crear su cuenta) o introducir
								una contraseña personalizada para el repository existente.
							</FormDescription>
						</FormItem>

						{passwordMode === "custom" && (
							<FormField
								control={form.control}
								name="customPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Contraseña del Repository</FormLabel>
										<FormControl>
											<SecretInput
												placeholder="Introduzca la contraseña del repository"
												value={field.value ?? ""}
												onChange={field.onChange}
											/>
										</FormControl>
										<FormDescription>
											La contraseña utilizada para cifrar este repository. Se almacenará de forma segura.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
					</>
				)}

				{watchedBackend === "local" && <LocalRepositoryForm form={form} />}
				{watchedBackend === "s3" && <S3RepositoryForm form={form} />}
				{watchedBackend === "r2" && <R2RepositoryForm form={form} />}
				{watchedBackend === "gcs" && <GCSRepositoryForm form={form} />}
				{watchedBackend === "azure" && <AzureRepositoryForm form={form} />}
				{watchedBackend === "rclone" && <RcloneRepositoryForm form={form} />}
				{watchedBackend === "rest" && <RestRepositoryForm form={form} />}
				{watchedBackend === "sftp" && <SftpRepositoryForm form={form} />}

				{watchedBackend && watchedBackend !== "local" && <AdvancedForm form={form} />}

				{mode === "update" && (
					<Button type="submit" className="w-full" loading={loading}>
						<Save className="h-4 w-4 mr-2" />
						Guardar cambios
					</Button>
				)}
			</form>
		</Form>
	);
};
