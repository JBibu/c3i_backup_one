import { arktypeResolver } from "@hookform/resolvers/arktype";

import { useQuery } from "@tanstack/react-query";
import { type } from "arktype";
import { X } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { listRepositoriesOptions } from "~/client/api-client/@tanstack/react-query.gen";
import { CronInput } from "~/client/components/cron-input";
import { RepositoryIcon } from "~/client/components/repository-icon";
import { Button } from "~/client/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/client/components/ui/card";
import { Checkbox } from "~/client/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/client/components/ui/form";
import { Input } from "~/client/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/client/components/ui/select";
import { Textarea } from "~/client/components/ui/textarea";
import { VolumeFileBrowser } from "~/client/components/volume-file-browser";
import type { BackupSchedule, Volume } from "~/client/lib/types";
import { deepClean } from "~/utils/object";
import { cronToFormValues } from "../lib/cron-utils";

const internalFormSchema = type({
	name: "1 <= string <= 128",
	repositoryId: "string",
	excludePatternsText: "string?",
	excludeIfPresentText: "string?",
	includePatternsText: "string?",
	includePatterns: "string[]?",
	frequency: "string",
	dailyTime: "string?",
	weeklyDay: "string?",
	monthlyDays: "string[]?",
	cronExpression: "string?",
	keepLast: "number?",
	keepHourly: "number?",
	keepDaily: "number?",
	keepWeekly: "number?",
	keepMonthly: "number?",
	keepYearly: "number?",
	oneFileSystem: "boolean?",
});
const cleanSchema = type.pipe((d) => internalFormSchema(deepClean(d)));

export const weeklyDays = [
	{ label: "Lunes", value: "1" },
	{ label: "Martes", value: "2" },
	{ label: "Miércoles", value: "3" },
	{ label: "Jueves", value: "4" },
	{ label: "Viernes", value: "5" },
	{ label: "Sábado", value: "6" },
	{ label: "Domingo", value: "0" },
];

type InternalFormValues = typeof internalFormSchema.infer;

export type BackupScheduleFormValues = Omit<
	InternalFormValues,
	"excludePatternsText" | "excludeIfPresentText" | "includePatternsText"
> & {
	excludePatterns?: string[];
	excludeIfPresent?: string[];
};

type Props = {
	volume: Volume;
	initialValues?: BackupSchedule;
	onSubmit: (data: BackupScheduleFormValues) => void;
	loading?: boolean;
	summaryContent?: React.ReactNode;
	formId: string;
};

const backupScheduleToFormValues = (schedule?: BackupSchedule): InternalFormValues | undefined => {
	if (!schedule) {
		return undefined;
	}

	const cronValues = cronToFormValues(schedule.cronExpression ?? "0 * * * *");

	const patterns = schedule.includePatterns || [];
	const isGlobPattern = (p: string) => /[*?[\]]/.test(p);
	const fileBrowserPaths = patterns.filter((p) => !isGlobPattern(p));
	const textPatterns = patterns.filter(isGlobPattern);

	return {
		name: schedule.name,
		repositoryId: schedule.repositoryId,
		includePatterns: fileBrowserPaths.length > 0 ? fileBrowserPaths : undefined,
		includePatternsText: textPatterns.length > 0 ? textPatterns.join("\n") : undefined,
		excludePatternsText: schedule.excludePatterns?.join("\n") || undefined,
		excludeIfPresentText: schedule.excludeIfPresent?.join("\n") || undefined,
		oneFileSystem: schedule.oneFileSystem ?? false,
		...cronValues,
		...schedule.retentionPolicy,
	};
};

export const CreateScheduleForm = ({ initialValues, formId, onSubmit, volume }: Props) => {
	const form = useForm<InternalFormValues>({
		resolver: arktypeResolver(cleanSchema as unknown as typeof internalFormSchema),
		defaultValues: backupScheduleToFormValues(initialValues),
	});

	const handleSubmit = useCallback(
		(data: InternalFormValues) => {
			const {
				excludePatternsText,
				excludeIfPresentText,
				includePatternsText,
				includePatterns: fileBrowserPatterns,
				cronExpression,
				...rest
			} = data;
			const excludePatterns = excludePatternsText
				? excludePatternsText
						.split("\n")
						.map((p) => p.trim())
						.filter(Boolean)
				: [];

			const excludeIfPresent = excludeIfPresentText
				? excludeIfPresentText
						.split("\n")
						.map((p) => p.trim())
						.filter(Boolean)
				: [];

			const textPatterns = includePatternsText
				? includePatternsText
						.split("\n")
						.map((p) => p.trim())
						.filter(Boolean)
				: [];
			const includePatterns = [...(fileBrowserPatterns || []), ...textPatterns];

			onSubmit({
				...rest,
				cronExpression,
				includePatterns: includePatterns.length > 0 ? includePatterns : [],
				excludePatterns,
				excludeIfPresent,
			});
		},
		[onSubmit],
	);

	const { data: repositoriesData } = useQuery({
		...listRepositoriesOptions(),
	});

	const frequency = form.watch("frequency");
	const formValues = form.watch();

	const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set(initialValues?.includePatterns || []));

	const handleSelectionChange = useCallback(
		(paths: Set<string>) => {
			setSelectedPaths(paths);
			form.setValue("includePatterns", Array.from(paths));
		},
		[form],
	);

	const handleRemovePath = useCallback(
		(pathToRemove: string) => {
			const newPaths = new Set(selectedPaths);
			newPaths.delete(pathToRemove);
			setSelectedPaths(newPaths);
			form.setValue("includePatterns", Array.from(newPaths));
		},
		[selectedPaths, form],
	);

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className="grid gap-4 xl:grid-cols-[minmax(0,2.3fr)_minmax(320px,1fr)]"
				id={formId}
			>
				<div className="grid gap-4">
					<Card>
						<CardHeader>
							<CardTitle>Automatización de copia de seguridad</CardTitle>
							<CardDescription className="mt-1">
								Programe copias de seguridad automatizadas de <strong>{volume.name}</strong> a un repository seguro.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-6 @md:grid-cols-2">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem className="@md:col-span-2">
										<FormLabel>Nombre de la copia de seguridad</FormLabel>
										<FormControl>
											<Input placeholder="Mi copia de seguridad" {...field} />
										</FormControl>
										<FormDescription>Un nombre único para identificar esta programación de copia de seguridad.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="repositoryId"
								render={({ field }) => (
									<FormItem className="@md:col-span-2">
										<FormLabel>Repository de copia de seguridad</FormLabel>
										<FormControl>
											<Select {...field} onValueChange={field.onChange}>
												<SelectTrigger>
													<SelectValue placeholder="Seleccione un repository" />
												</SelectTrigger>
												<SelectContent>
													{repositoriesData?.map((repo) => (
														<SelectItem key={repo.id} value={repo.id}>
															<span className="flex items-center gap-2">
																<RepositoryIcon backend={repo.type} />
																{repo.name}
															</span>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormDescription>
											Elija dónde se almacenarán las copias de seguridad cifradas de <strong>{volume.name}</strong>.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="frequency"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Frecuencia de copia de seguridad</FormLabel>
										<FormControl>
											<Select {...field} onValueChange={field.onChange}>
												<SelectTrigger>
													<SelectValue placeholder="Seleccione la frecuencia" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="hourly">Cada hora</SelectItem>
													<SelectItem value="daily">Diaria</SelectItem>
													<SelectItem value="weekly">Semanal</SelectItem>
													<SelectItem value="monthly">Días específicos</SelectItem>
													<SelectItem value="cron">Personalizada (Cron)</SelectItem>
												</SelectContent>
											</Select>
										</FormControl>
										<FormDescription>Defina con qué frecuencia se deben tomar los snapshots.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							{frequency === "cron" && (
								<FormField
									control={form.control}
									name="cronExpression"
									render={({ field, fieldState }) => (
										<CronInput value={field.value || ""} onChange={field.onChange} error={fieldState.error?.message} />
									)}
								/>
							)}

							{frequency !== "hourly" && frequency !== "cron" && (
								<FormField
									control={form.control}
									name="dailyTime"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Hora de ejecución</FormLabel>
											<FormControl>
												<Input type="time" {...field} />
											</FormControl>
											<FormDescription>Hora del día en que se ejecutará la copia de seguridad.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							{frequency === "weekly" && (
								<FormField
									control={form.control}
									name="weeklyDay"
									render={({ field }) => (
										<FormItem className="@md:col-span-2">
											<FormLabel>Día de ejecución</FormLabel>
											<FormControl>
												<Select {...field} onValueChange={field.onChange}>
													<SelectTrigger>
														<SelectValue placeholder="Seleccione un día" />
													</SelectTrigger>
													<SelectContent>
														{weeklyDays.map((day) => (
															<SelectItem key={day.value} value={day.value}>
																{day.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormDescription>Elija qué día de la semana se ejecutará la copia de seguridad.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
							{frequency === "monthly" && (
								<FormField
									control={form.control}
									name="monthlyDays"
									render={({ field }) => (
										<FormItem className="@md:col-span-2">
											<FormLabel>Días del mes</FormLabel>
											<FormControl>
												<div className="grid grid-cols-7 gap-4 w-max">
													{Array.from({ length: 31 }, (_, i) => {
														const day = (i + 1).toString();
														const isSelected = field.value?.includes(day);
														return (
															<Button
																type="button"
																key={day}
																variant={isSelected ? "primary" : "secondary"}
																size="icon"
																onClick={() => {
																	const current = field.value || [];
																	const next = isSelected ? current.filter((d) => d !== day) : [...current, day];
																	field.onChange(next);
																}}
															>
																{day}
															</Button>
														);
													})}
												</div>
											</FormControl>
											<FormDescription>Seleccione uno o más días en los que se ejecutará la copia de seguridad.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Rutas de copia de seguridad</CardTitle>
							<CardDescription>
								Seleccione qué carpetas o archivos incluir en la copia de seguridad. Si no se selecciona ninguna ruta, se respaldará todo el volume.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<VolumeFileBrowser
								key={volume.id}
								volumeName={volume.name}
								selectedPaths={selectedPaths}
								onSelectionChange={handleSelectionChange}
								withCheckboxes={true}
								foldersOnly={false}
								className="relative border rounded-md bg-card p-2 h-100 overflow-y-auto"
							/>
							{selectedPaths.size > 0 && (
								<div className="mt-4">
									<p className="text-xs text-muted-foreground mb-2">Rutas seleccionadas:</p>
									<div className="flex flex-wrap gap-2">
										{Array.from(selectedPaths).map((path) => (
											<span
												key={path}
												className="text-xs bg-accent px-2 py-1 rounded-md font-mono inline-flex items-center gap-1"
											>
												{path}
												<button
													type="button"
													onClick={() => handleRemovePath(path)}
													className="ml-1 hover:bg-destructive/20 rounded p-0.5 transition-colors"
													aria-label={`Eliminar ${path}` as string}
												>
													<X className="h-3 w-3" />
												</button>
											</span>
										))}
									</div>
								</div>
							)}
							<FormField
								control={form.control}
								name="includePatternsText"
								render={({ field }) => (
									<FormItem className="mt-6">
										<FormLabel>Patrones de inclusión adicionales</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												placeholder="/data/**&#10;/config/*.json&#10;*.db"
												className="font-mono text-sm min-h-25"
											/>
										</FormControl>
										<FormDescription>
											Opcionalmente añada patrones de inclusión personalizados usando sintaxis glob. Introduzca un patrón por línea. Estos se
											combinarán con las rutas seleccionadas arriba.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Patrones de exclusión</CardTitle>
							<CardDescription>
								Opcionalmente especifique patrones para excluir de las copias de seguridad. Introduzca un patrón por línea (ej., *.tmp,
								node_modules/**, .cache/).
							</CardDescription>
						</CardHeader>
						<CardContent>
							<FormField
								control={form.control}
								name="excludePatternsText"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Patrones de exclusión</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												placeholder="*.tmp&#10;node_modules/**&#10;.cache/&#10;*.log"
												className="font-mono text-sm min-h-30"
											/>
										</FormControl>
										<FormDescription>
											Los patrones admiten sintaxis glob. Consulte la&nbsp;
											<a
												href="https://restic.readthedocs.io/en/stable/040_backup.html#excluding-files"
												target="_blank"
												rel="noopener noreferrer"
												className="underline hover:text-foreground"
											>
												documentación de Restic
											</a>
											&nbsp;para más detalles.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="excludeIfPresentText"
								render={({ field }) => (
									<FormItem className="mt-6">
										<FormLabel>Excluir si el archivo está presente</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												placeholder=".nobackup&#10;.exclude-from-backup&#10;CACHEDIR.TAG"
												className="font-mono text-sm min-h-20"
											/>
										</FormControl>
										<FormDescription>
											Excluya carpetas que contengan un archivo con el nombre especificado. Introduzca un nombre de archivo por línea. Por
											ejemplo, use <code className="bg-muted px-1 rounded">.nobackup</code> para omitir cualquier carpeta
											que contenga un archivo <code className="bg-muted px-1 rounded">.nobackup</code>.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="oneFileSystem"
								render={({ field }) => (
									<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-6">
										<FormControl>
											<Checkbox checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>Permanecer en un sistema de archivos</FormLabel>
											<FormDescription>
												Evite que Restic cruce los límites del sistema de archivos. Esto es útil para evitar respaldar montajes
												de red u otras particiones que puedan estar montadas dentro de su origen de copia de seguridad.
											</FormDescription>
										</div>
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Política de retención</CardTitle>
							<CardDescription>Defina cuántos snapshots conservar. Déjelo vacío para conservar todos.</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 @md:grid-cols-2">
							<FormField
								control={form.control}
								name="keepLast"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Conservar últimos N snapshots</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="number"
												min={0}
												placeholder="Opcional"
												onChange={(v) => field.onChange(Number(v.target.value))}
											/>
										</FormControl>
										<FormDescription>Conserve los N snapshots más recientes.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="keepHourly"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Conservar por hora</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												placeholder="Opcional"
												{...field}
												onChange={(v) => field.onChange(Number(v.target.value))}
											/>
										</FormControl>
										<FormDescription>Conserve los últimos N snapshots por hora.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="keepDaily"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Conservar diarios</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												placeholder="ej., 7"
												{...field}
												onChange={(v) => field.onChange(Number(v.target.value))}
											/>
										</FormControl>
										<FormDescription>Conserve los últimos N snapshots diarios.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="keepWeekly"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Conservar semanales</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												placeholder="ej., 4"
												{...field}
												onChange={(v) => field.onChange(Number(v.target.value))}
											/>
										</FormControl>
										<FormDescription>Conserve los últimos N snapshots semanales.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="keepMonthly"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Conservar mensuales</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												placeholder="ej., 6"
												{...field}
												onChange={(v) => field.onChange(Number(v.target.value))}
											/>
										</FormControl>
										<FormDescription>Conserve los últimos N snapshots mensuales.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="keepYearly"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Conservar anuales</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												placeholder="Opcional"
												{...field}
												onChange={(v) => field.onChange(Number(v.target.value))}
											/>
										</FormControl>
										<FormDescription>Conserve los últimos N snapshots anuales.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>
				</div>
				<div className="xl:sticky xl:top-6 xl:self-start">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between gap-4">
							<div>
								<CardTitle>Resumen de programación</CardTitle>
								<CardDescription>Revise la configuración de la copia de seguridad.</CardDescription>
							</div>
						</CardHeader>
						<CardContent className="flex flex-col gap-4 text-sm">
							<div>
								<p className="text-xs uppercase text-muted-foreground">Volume</p>
								<p className="font-medium">{volume.name}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">Programación</p>
								<p className="font-medium">
									{frequency ? frequency.charAt(0).toUpperCase() + frequency.slice(1) : "-"}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">Repository</p>
								<p className="font-medium">
									{repositoriesData?.find((r) => r.id === formValues.repositoryId)?.name || "—"}
								</p>
							</div>
							{(formValues.includePatterns && formValues.includePatterns.length > 0) ||
							formValues.includePatternsText ? (
								<div>
									<p className="text-xs uppercase text-muted-foreground">Rutas/patrones de inclusión</p>
									<div className="flex flex-col gap-1">
										{formValues.includePatterns?.map((path) => (
											<span key={path} className="text-xs font-mono bg-accent px-1.5 py-0.5 rounded">
												{path}
											</span>
										))}
										{formValues.includePatternsText
											?.split("\n")
											.filter(Boolean)
											.map((pattern) => (
												<span key={pattern} className="text-xs font-mono bg-accent px-1.5 py-0.5 rounded">
													{pattern.trim()}
												</span>
											))}
									</div>
								</div>
							) : null}
							{formValues.excludePatternsText && (
								<div>
									<p className="text-xs uppercase text-muted-foreground">Patrones de exclusión</p>
									<div className="flex flex-col gap-1">
										{formValues.excludePatternsText
											.split("\n")
											.filter(Boolean)
											.map((pattern) => (
												<span key={pattern} className="text-xs font-mono bg-accent px-1.5 py-0.5 rounded">
													{pattern.trim()}
												</span>
											))}
									</div>
								</div>
							)}
							{formValues.excludeIfPresentText && (
								<div>
									<p className="text-xs uppercase text-muted-foreground">Excluir si está presente</p>
									<div className="flex flex-col gap-1">
										{formValues.excludeIfPresentText
											.split("\n")
											.filter(Boolean)
											.map((filename) => (
												<span key={filename} className="text-xs font-mono bg-accent px-1.5 py-0.5 rounded">
													{filename.trim()}
												</span>
											))}
									</div>
								</div>
							)}
							<div>
								<p className="text-xs uppercase text-muted-foreground">Un sistema de archivos</p>
								<p className="font-medium">{formValues.oneFileSystem ? "Habilitado" : "Deshabilitado"}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">Retención</p>
								<p className="font-medium">
									{Object.entries(formValues)
										.filter(([key, value]) => key.startsWith("keep") && Boolean(value))
										.map(([key, value]) => {
											const label = key.replace("keep", "").toLowerCase();
											return `${value.toString()} ${label}`;
										})
										.join(", ") || "-"}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</form>
		</Form>
	);
};
