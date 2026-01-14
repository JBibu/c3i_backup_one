import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Database, HardDrive, Tag, Trash2, X } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { ByteSize } from "~/client/components/bytes-size";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/client/components/ui/table";
import { Button } from "~/client/components/ui/button";
import { Checkbox } from "~/client/components/ui/checkbox";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/client/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/client/components/ui/select";
import { formatDuration } from "~/utils/utils";
import { formatDateTime } from "~/client/lib/datetime";
import { deleteSnapshotsMutation, tagSnapshotsMutation } from "~/client/api-client/@tanstack/react-query.gen";
import { parseError } from "~/client/lib/errors";
import type { BackupSchedule, Snapshot } from "../lib/types";
import { cn } from "../lib/utils";

type Props = {
	snapshots: Snapshot[];
	backups: BackupSchedule[];
	repositoryId: string;
};

export const SnapshotsTable = ({ snapshots, repositoryId, backups }: Props) => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
	const [showReTagDialog, setShowReTagDialog] = useState(false);
	const [targetScheduleId, setTargetScheduleId] = useState<string>("");

	const deleteSnapshots = useMutation({
		...deleteSnapshotsMutation(),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["listSnapshots"] });
			setShowBulkDeleteConfirm(false);
			setSelectedIds(new Set());
		},
	});

	const tagSnapshots = useMutation({
		...tagSnapshotsMutation(),
		onMutate: () => {
			setShowReTagDialog(false);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["listSnapshots"] });
			setShowReTagDialog(false);
			setSelectedIds(new Set());
			setTargetScheduleId("");
		},
	});

	const handleRowClick = (snapshotId: string) => {
		void navigate(`/repositories/${repositoryId}/${snapshotId}`);
	};

	const toggleSelectAll = () => {
		if (selectedIds.size === snapshots.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(snapshots.map((s) => s.short_id)));
		}
	};

	const handleBulkDelete = () => {
		toast.promise(
			deleteSnapshots.mutateAsync({
				path: { id: repositoryId },
				body: { snapshotIds: Array.from(selectedIds) },
			}),
			{
				loading: `Eliminando ${selectedIds.size} snapshots...`,
				success: "Snapshots eliminados correctamente",
				error: (error) => parseError(error)?.message || "Error al eliminar snapshots",
			},
		);
	};

	const handleBulkReTag = () => {
		const schedule = backups.find((b) => String(b.id) === targetScheduleId);
		if (!schedule) return;

		toast.promise(
			tagSnapshots.mutateAsync({
				path: { id: repositoryId },
				body: {
					snapshotIds: Array.from(selectedIds),
					set: [schedule.shortId],
				},
			}),
			{
				loading: `Reetiquetando ${selectedIds.size} snapshots...`,
				success: `Snapshots reetiquetados a ${schedule.name}`,
				error: (error) => parseError(error)?.message || "Error al reetiquetar snapshots",
			},
		);
	};

	return (
		<>
			<div className="overflow-x-auto relative">
				<Table className="border-t">
					<TableHeader className="bg-card-header">
						<TableRow>
							<TableHead className="w-10">
								<Checkbox
									checked={selectedIds.size === snapshots.length && snapshots.length > 0}
									onCheckedChange={toggleSelectAll}
									aria-label="Seleccionar todo"
								/>
							</TableHead>
							<TableHead className="uppercase">ID Snapshot</TableHead>
							<TableHead className="uppercase">Programación</TableHead>
							<TableHead className="uppercase">Fecha y hora</TableHead>
							<TableHead className="uppercase">Tamaño</TableHead>
							<TableHead className="uppercase hidden md:table-cell text-right">Duración</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{snapshots.map((snapshot) => {
							const backup = backups.find((b) => snapshot.tags.includes(b.shortId));
							const isSelected = selectedIds.has(snapshot.short_id);

							return (
								<TableRow
									key={snapshot.short_id}
									className={cn("hover:bg-accent/50 cursor-pointer", isSelected && "bg-accent/30")}
									onClick={() => handleRowClick(snapshot.short_id)}
								>
									<TableCell onClick={(e) => e.stopPropagation()}>
										<Checkbox
											checked={isSelected}
											onCheckedChange={() => {
												const newSelected = new Set(selectedIds);
												if (newSelected.has(snapshot.short_id)) {
													newSelected.delete(snapshot.short_id);
												} else {
													newSelected.add(snapshot.short_id);
												}
												setSelectedIds(newSelected);
											}}
											aria-label={`Seleccionar snapshot ${snapshot.short_id}` as string}
										/>
									</TableCell>
									<TableCell className="font-mono text-sm">
										<div className="flex items-center gap-2">
											<HardDrive className="h-4 w-4 text-muted-foreground" />
											<span className="text-strong-accent">{snapshot.short_id}</span>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Link
												hidden={!backup}
												to={backup ? `/backups/${backup.id}` : "#"}
												onClick={(e) => e.stopPropagation()}
												className="hover:underline"
											>
												<span className="text-sm">{backup ? backup.name : "-"}</span>
											</Link>
											<span hidden={!!backup} className="text-sm text-muted-foreground">
												-
											</span>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Calendar className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm">{formatDateTime(snapshot.time)}</span>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Database className="h-4 w-4 text-muted-foreground" />
											<span className="font-medium">
												<ByteSize bytes={snapshot.size} base={1024} />
											</span>
										</div>
									</TableCell>
									<TableCell className="hidden md:table-cell">
										<div className="flex items-center justify-end gap-2">
											<Clock className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm text-muted-foreground">{formatDuration(snapshot.duration / 1000)}</span>
										</div>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{selectedIds.size > 0 && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
					<div className="bg-card border shadow-2xl rounded-full px-4 py-2 flex items-center gap-4 min-w-75 justify-between">
						<div className="flex items-center gap-3 border-r pr-4">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 rounded-full"
								onClick={() => setSelectedIds(new Set())}
							>
								<X className="h-4 w-4" />
							</Button>
							<span className="text-sm font-medium">{selectedIds.size} seleccionado{selectedIds.size === 1 ? "" : "s"}</span>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className="rounded-full gap-2"
								onClick={() => setShowReTagDialog(true)}
							>
								<Tag className="h-4 w-4 mr-2" />
								Reetiquetar
							</Button>
							<Button
								variant="destructive"
								size="sm"
								className="rounded-full gap-2"
								onClick={() => setShowBulkDeleteConfirm(true)}
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Eliminar
							</Button>
						</div>
					</div>
				</div>
			)}

			<AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar {selectedIds.size} snapshots?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. Esto eliminará permanentemente los snapshots seleccionados y todos sus datos del
							repository.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleBulkDelete}
							disabled={deleteSnapshots.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Eliminar {selectedIds.size} snapshots
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog open={showReTagDialog} onOpenChange={setShowReTagDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reetiquetar snapshots</DialogTitle>
						<DialogDescription>
							Seleccione una programación de copia de seguridad para reetiquetar los {selectedIds.size} snapshots seleccionados. Todos los {selectedIds.size}{" "}
							snapshots seleccionados se asociarán con la programación elegida.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Select value={targetScheduleId} onValueChange={setTargetScheduleId}>
							<SelectTrigger>
								<SelectValue placeholder="Seleccione una programación" />
							</SelectTrigger>
							<SelectContent>
								{backups.map((backup) => (
									<SelectItem key={backup.id} value={String(backup.id)}>
										{backup.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowReTagDialog(false)}>
							Cancelar
						</Button>
						<Button onClick={handleBulkReTag} disabled={!targetScheduleId}>
							Aplicar etiquetas
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
