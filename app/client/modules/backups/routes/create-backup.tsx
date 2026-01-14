import { useId, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Database, HardDrive, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
	createBackupScheduleMutation,
	listRepositoriesOptions,
	listVolumesOptions,
} from "~/client/api-client/@tanstack/react-query.gen";
import { Button } from "~/client/components/ui/button";
import { Card, CardContent } from "~/client/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/client/components/ui/select";
import { parseError } from "~/client/lib/errors";
import { EmptyState } from "~/client/components/empty-state";
import { getCronExpression } from "~/utils/utils";
import { CreateScheduleForm, type BackupScheduleFormValues } from "../components/create-schedule-form";
import type { Route } from "./+types/create-backup";
import { listRepositories, listVolumes } from "~/client/api-client";

export const handle = {
	breadcrumb: () => [{ label: "Copias de seguridad", href: "/backups" }, { label: "Crear" }],
};

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "C3i Backup ONE - Crear copia de seguridad" },
		{
			name: "description",
			content: "Cree un nuevo trabajo de copia de seguridad automatizado para sus volumes.",
		},
	];
}

export const clientLoader = async () => {
	try {
		const [volumes, repositories] = await Promise.all([listVolumes(), listRepositories()]);

		if (volumes.data && repositories.data) return { volumes: volumes.data, repositories: repositories.data };
		return { volumes: [], repositories: [] };
	} catch (error) {
		console.error("Failed to load create backup data:", error);
		return { volumes: [], repositories: [] };
	}
};

export default function CreateBackup({ loaderData }: Route.ComponentProps) {
	const navigate = useNavigate();
	const formId = useId();
	const [selectedVolumeId, setSelectedVolumeId] = useState<number | undefined>();

	const initialVolumes = loaderData?.volumes ?? [];
	const initialRepositories = loaderData?.repositories ?? [];

	const { data: volumesData = [], isLoading: loadingVolumes } = useQuery({
		...listVolumesOptions(),
		initialData: initialVolumes,
	});

	const { data: repositoriesData = [] } = useQuery({
		...listRepositoriesOptions(),
		initialData: initialRepositories,
	});

	const createSchedule = useMutation({
		...createBackupScheduleMutation(),
		onSuccess: (data) => {
			toast.success("Copia de seguridad creada correctamente");
			void navigate(`/backups/${data.id}`);
		},
		onError: (error) => {
			toast.error("Error al crear la copia de seguridad", {
				description: parseError(error)?.message,
			});
		},
	});

	const handleSubmit = (formValues: BackupScheduleFormValues) => {
		if (!selectedVolumeId) return;

		const cronExpression = getCronExpression(
			formValues.frequency,
			formValues.dailyTime,
			formValues.weeklyDay,
			formValues.monthlyDays,
			formValues.cronExpression,
		);

		const retentionPolicy: Record<string, number> = {};
		if (formValues.keepLast) retentionPolicy.keepLast = formValues.keepLast;
		if (formValues.keepHourly) retentionPolicy.keepHourly = formValues.keepHourly;
		if (formValues.keepDaily) retentionPolicy.keepDaily = formValues.keepDaily;
		if (formValues.keepWeekly) retentionPolicy.keepWeekly = formValues.keepWeekly;
		if (formValues.keepMonthly) retentionPolicy.keepMonthly = formValues.keepMonthly;
		if (formValues.keepYearly) retentionPolicy.keepYearly = formValues.keepYearly;

		createSchedule.mutate({
			body: {
				name: formValues.name,
				volumeId: selectedVolumeId,
				repositoryId: formValues.repositoryId,
				enabled: true,
				cronExpression,
				retentionPolicy: Object.keys(retentionPolicy).length > 0 ? retentionPolicy : undefined,
				includePatterns: formValues.includePatterns,
				excludePatterns: formValues.excludePatterns,
				excludeIfPresent: formValues.excludeIfPresent,
				oneFileSystem: formValues.oneFileSystem,
			},
		});
	};

	const selectedVolume = volumesData.find((v) => v.id === selectedVolumeId);

	if (loadingVolumes) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Cargando...</p>
			</div>
		);
	}

	if (!volumesData.length) {
		return (
			<EmptyState
				icon={HardDrive}
				title="No hay ningún volume para respaldar"
				description="Para crear una copia de seguridad, necesita crear un volume primero. Los volumes son las fuentes de datos que se respaldarán."
				button={
					<Button>
						<Link to="/volumes">Ir a volumes</Link>
					</Button>
				}
			/>
		);
	}

	if (!repositoriesData.length) {
		return (
			<EmptyState
				icon={Database}
				title="No hay ningún repository"
				description="Para crear una copia de seguridad, necesita configurar un repository primero. Los repositories son los destinos donde se almacenarán sus copias de seguridad."
				button={
					<Button>
						<Link to="/repositories">Ir a repositories</Link>
					</Button>
				}
			/>
		);
	}

	return (
		<div className="container mx-auto space-y-6">
			<Card>
				<CardContent>
					<Select value={selectedVolumeId?.toString()} onValueChange={(v) => setSelectedVolumeId(Number(v))}>
						<SelectTrigger id="volume-select">
							<SelectValue placeholder="Elija un volume para respaldar" />
						</SelectTrigger>
						<SelectContent>
							{volumesData.map((volume) => (
								<SelectItem key={volume.id} value={volume.id.toString()}>
									<span className="flex items-center gap-2">
										<HardDrive className="h-4 w-4" />
										{volume.name}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</CardContent>
			</Card>
			{selectedVolume ? (
				<>
					<CreateScheduleForm volume={selectedVolume} onSubmit={handleSubmit} formId={formId} />
					<div className="flex justify-end mt-4 gap-2">
						<Button type="submit" variant="primary" form={formId} loading={createSchedule.isPending}>
							<Plus className="h-4 w-4 mr-2" />
							Crear
						</Button>
					</div>
				</>
			) : (
				<Card>
					<CardContent className="py-16">
						<div className="flex flex-col items-center justify-center text-center">
							<div className="relative mb-6">
								<div className="absolute inset-0 animate-pulse">
									<div className="w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
								</div>
								<div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-linear-to-br from-primary/20 to-primary/5 border-2 border-primary/20">
									<Database className="w-12 h-12 text-primary/70" strokeWidth={1.5} />
								</div>
							</div>
							<h3 className="text-xl font-semibold mb-2">Seleccione un volume</h3>
							<p className="text-muted-foreground text-sm max-w-md">
								Elija un volume del menú desplegable superior para configurar su programación de copia de seguridad.
							</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
