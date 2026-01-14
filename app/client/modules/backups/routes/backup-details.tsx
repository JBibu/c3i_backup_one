import { useId, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { redirect, useNavigate } from "react-router";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import { Button } from "~/client/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/client/components/ui/alert-dialog";
import {
	getBackupScheduleOptions,
	runBackupNowMutation,
	deleteBackupScheduleMutation,
	listSnapshotsOptions,
	updateBackupScheduleMutation,
	stopBackupMutation,
	deleteSnapshotMutation,
} from "~/client/api-client/@tanstack/react-query.gen";
import { parseError } from "~/client/lib/errors";
import { getCronExpression } from "~/utils/utils";
import { CreateScheduleForm, type BackupScheduleFormValues } from "../components/create-schedule-form";
import { ScheduleSummary } from "../components/schedule-summary";
import type { Route } from "./+types/backup-details";
import { SnapshotFileBrowser } from "../components/snapshot-file-browser";
import { SnapshotTimeline } from "../components/snapshot-timeline";
import {
	getBackupSchedule,
	getScheduleMirrors,
	getScheduleNotifications,
	listNotificationDestinations,
	listRepositories,
} from "~/client/api-client";
import { ScheduleNotificationsConfig } from "../components/schedule-notifications-config";
import { ScheduleMirrorsConfig } from "../components/schedule-mirrors-config";
import { cn } from "~/client/lib/utils";

export const handle = {
	breadcrumb: (match: Route.MetaArgs) => {
		const data = match.loaderData;
		return [{ label: "Copias de seguridad", href: "/backups" }, { label: data.schedule.name }];
	},
};

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "C3i Backup ONE - Detalles de copia de seguridad" },
		{
			name: "description",
			content: "Vea y gestione la configuración de copia de seguridad, programación y snapshots.",
		},
	];
}

export const clientLoader = async ({ params }: Route.LoaderArgs) => {
	const [schedule, notifs, repos, scheduleNotifs, mirrors] = await Promise.all([
		getBackupSchedule({ path: { scheduleId: params.id } }),
		listNotificationDestinations(),
		listRepositories(),
		getScheduleNotifications({ path: { scheduleId: params.id } }),
		getScheduleMirrors({ path: { scheduleId: params.id } }),
	]);

	if (!schedule.data) return redirect("/backups");

	return {
		schedule: schedule.data,
		notifs: notifs.data,
		repos: repos.data,
		scheduleNotifs: scheduleNotifs.data,
		scheduleMirrors: mirrors.data,
	};
};

export default function ScheduleDetailsPage({ params, loaderData }: Route.ComponentProps) {
	const navigate = useNavigate();
	const [isEditMode, setIsEditMode] = useState(false);
	const formId = useId();
	const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>();
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [snapshotToDelete, setSnapshotToDelete] = useState<string | null>(null);

	const { data: schedule } = useQuery({
		...getBackupScheduleOptions({ path: { scheduleId: params.id } }),
		initialData: loaderData.schedule,
	});

	const {
		data: snapshots,
		isLoading,
		failureReason,
	} = useQuery({
		...listSnapshotsOptions({ path: { id: schedule.repository.id }, query: { backupId: schedule.shortId } }),
	});

	const updateSchedule = useMutation({
		...updateBackupScheduleMutation(),
		onSuccess: () => {
			toast.success("Programación de copia de seguridad guardada correctamente");
			setIsEditMode(false);
		},
		onError: (error) => {
			toast.error("Error al guardar la programación de copia de seguridad", {
				description: parseError(error)?.message,
			});
		},
	});

	const runBackupNow = useMutation({
		...runBackupNowMutation(),
		onSuccess: () => {
			toast.success("Copia de seguridad iniciada correctamente");
		},
		onError: (error) => {
			toast.error("Error al iniciar la copia de seguridad", { description: parseError(error)?.message });
		},
	});

	const stopBackup = useMutation({
		...stopBackupMutation(),
		onSuccess: () => {
			toast.success("Copia de seguridad detenida correctamente");
		},
		onError: (error) => {
			toast.error("Error al detener la copia de seguridad", { description: parseError(error)?.message });
		},
	});

	const deleteSchedule = useMutation({
		...deleteBackupScheduleMutation(),
		onSuccess: () => {
			toast.success("Programación de copia de seguridad eliminada correctamente");
			void navigate("/backups");
		},
		onError: (error) => {
			toast.error("Error al eliminar la programación de copia de seguridad", { description: parseError(error)?.message });
		},
	});

	const deleteSnapshot = useMutation({
		...deleteSnapshotMutation(),
		onSuccess: () => {
			setShowDeleteConfirm(false);
			setSnapshotToDelete(null);
			if (selectedSnapshotId === snapshotToDelete) {
				setSelectedSnapshotId(undefined);
			}
		},
	});

	const handleSubmit = (formValues: BackupScheduleFormValues) => {
		if (!schedule) return;

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

		updateSchedule.mutate({
			path: { scheduleId: schedule.id.toString() },
			body: {
				name: formValues.name,
				repositoryId: formValues.repositoryId,
				enabled: schedule.enabled,
				cronExpression,
				retentionPolicy: Object.keys(retentionPolicy).length > 0 ? retentionPolicy : undefined,
				includePatterns: formValues.includePatterns,
				excludePatterns: formValues.excludePatterns,
				excludeIfPresent: formValues.excludeIfPresent,
				oneFileSystem: formValues.oneFileSystem,
			},
		});
	};

	const handleToggleEnabled = (enabled: boolean) => {
		updateSchedule.mutate({
			path: { scheduleId: schedule.id.toString() },
			body: {
				repositoryId: schedule.repositoryId,
				enabled,
				cronExpression: schedule.cronExpression,
				retentionPolicy: schedule.retentionPolicy || undefined,
				includePatterns: schedule.includePatterns || [],
				excludePatterns: schedule.excludePatterns || [],
				excludeIfPresent: schedule.excludeIfPresent || [],
				oneFileSystem: schedule.oneFileSystem,
			},
		});
	};

	const handleDeleteSnapshot = (snapshotId: string) => {
		setSnapshotToDelete(snapshotId);
		setShowDeleteConfirm(true);
	};

	const handleConfirmDelete = () => {
		if (snapshotToDelete) {
			toast.promise(
				deleteSnapshot.mutateAsync({
					path: { id: schedule.repository.shortId, snapshotId: snapshotToDelete },
				}),
				{
					loading: "Eliminando snapshot...",
					success: "Snapshot eliminado correctamente",
					error: (error) => parseError(error)?.message || "Error al eliminar el snapshot",
				},
			);
		}
	};

	if (isEditMode) {
		return (
			<div>
				<CreateScheduleForm volume={schedule.volume} initialValues={schedule} onSubmit={handleSubmit} formId={formId} />
				<div className="flex justify-end mt-4 gap-2">
					<Button type="submit" className="ml-auto" variant="primary" form={formId} loading={updateSchedule.isPending}>
						<Save className="h-4 w-4 mr-2" />
						Actualizar programación
					</Button>
					<Button variant="outline" onClick={() => setIsEditMode(false)}>
						<X className="h-4 w-4 mr-2" />
						Cancelar
					</Button>
				</div>
			</div>
		);
	}

	const selectedSnapshot = snapshots?.find((s) => s.short_id === selectedSnapshotId);

	return (
		<div className="flex flex-col gap-6">
			<ScheduleSummary
				handleToggleEnabled={handleToggleEnabled}
				handleRunBackupNow={() => runBackupNow.mutate({ path: { scheduleId: schedule.id.toString() } })}
				handleStopBackup={() => stopBackup.mutate({ path: { scheduleId: schedule.id.toString() } })}
				handleDeleteSchedule={() => deleteSchedule.mutate({ path: { scheduleId: schedule.id.toString() } })}
				setIsEditMode={setIsEditMode}
				schedule={schedule}
			/>
			<div className={cn({ hidden: !loaderData.notifs?.length })}>
				<ScheduleNotificationsConfig
					scheduleId={schedule.id}
					destinations={loaderData.notifs ?? []}
					initialData={loaderData.scheduleNotifs ?? []}
				/>
			</div>
			<div className={cn({ hidden: !loaderData.repos?.length || loaderData.repos.length < 2 })}>
				<ScheduleMirrorsConfig
					scheduleId={schedule.id}
					primaryRepositoryId={schedule.repositoryId}
					repositories={loaderData.repos ?? []}
					initialData={loaderData.scheduleMirrors ?? []}
				/>
			</div>
			<SnapshotTimeline
				loading={isLoading}
				snapshots={snapshots ?? []}
				snapshotId={selectedSnapshot?.short_id}
				error={failureReason?.message}
				onSnapshotSelect={setSelectedSnapshotId}
			/>
			{selectedSnapshot && (
				<SnapshotFileBrowser
					key={selectedSnapshot?.short_id}
					snapshot={selectedSnapshot}
					repositoryId={schedule.repository.shortId}
					backupId={schedule.id.toString()}
					onDeleteSnapshot={handleDeleteSnapshot}
					isDeletingSnapshot={deleteSnapshot.isPending}
				/>
			)}

			<AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar snapshot?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. Esto eliminará permanentemente el snapshot y todos sus datos del
							repository.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							disabled={deleteSnapshot.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Eliminar snapshot
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
