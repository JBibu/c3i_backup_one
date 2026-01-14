import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useState } from "react";
import { Plug, Unplug } from "lucide-react";
import { StatusDot } from "~/client/components/status-dot";
import { Button } from "~/client/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/client/components/ui/tabs";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/client/components/ui/alert-dialog";
import { VolumeIcon } from "~/client/components/volume-icon";
import { parseError } from "~/client/lib/errors";
import { cn } from "~/client/lib/utils";
import type { Route } from "./+types/volume-details";
import { VolumeInfoTabContent } from "../tabs/info";
import { FilesTabContent } from "../tabs/files";
import { getVolume } from "~/client/api-client";
import type { VolumeStatus } from "~/client/lib/types";
import {
	deleteVolumeMutation,
	getVolumeOptions,
	mountVolumeMutation,
	unmountVolumeMutation,
} from "~/client/api-client/@tanstack/react-query.gen";

const getVolumeStatusVariant = (status: VolumeStatus): "success" | "neutral" | "error" | "warning" => {
	const statusMap = {
		mounted: "success" as const,
		unmounted: "neutral" as const,
		error: "error" as const,
		unknown: "warning" as const,
	};
	return statusMap[status];
};

const getVolumeStatusLabel = (status: VolumeStatus): string => {
	const labelMap = {
		mounted: "Montado",
		unmounted: "Desmontado",
		error: "Error",
		unknown: "Desconocido",
	};
	return labelMap[status];
};

export const handle = {
	breadcrumb: (match: Route.MetaArgs) => [{ label: "Volúmenes", href: "/volumes" }, { label: match.params.name }],
};

export function meta({ params }: Route.MetaArgs) {
	return [
		{ title: `C3i Backup ONE - ${params.name}` },
		{
			name: "description",
			content: "Vea y gestione los detalles del volume, configuración y archivos.",
		},
	];
}

export const clientLoader = async ({ params }: Route.ClientLoaderArgs) => {
	const volume = await getVolume({ path: { name: params.name } });
	if (volume.data) return volume.data;
};

export default function VolumeDetails({ loaderData }: Route.ComponentProps) {
	const { name } = useParams<{ name: string }>();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get("tab") || "info";
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const { data } = useQuery({
		...getVolumeOptions({ path: { name: name ?? "" } }),
		initialData: loaderData,
	});

	const deleteVol = useMutation({
		...deleteVolumeMutation(),
		onSuccess: () => {
			toast.success("Volume eliminado correctamente");
			void navigate("/volumes");
		},
		onError: (error) => {
			toast.error("Error al eliminar el volume", {
				description: parseError(error)?.message,
			});
		},
	});

	const mountVol = useMutation({
		...mountVolumeMutation(),
		onSuccess: () => {
			toast.success("Volume montado correctamente");
		},
		onError: (error) => {
			toast.error("Error al montar el volume", {
				description: parseError(error)?.message,
			});
		},
	});

	const unmountVol = useMutation({
		...unmountVolumeMutation(),
		onSuccess: () => {
			toast.success("Volume desmontado correctamente");
		},
		onError: (error) => {
			toast.error("Error al desmontar el volume", {
				description: parseError(error)?.message,
			});
		},
	});

	const handleConfirmDelete = () => {
		setShowDeleteConfirm(false);
		deleteVol.mutate({ path: { name: name ?? "" } });
	};

	if (!name) {
		return <div>Volume no encontrado</div>;
	}

	if (!data) {
		return <div>Cargando...</div>;
	}

	const { volume, statfs } = data;

	return (
		<>
			<div className="flex flex-col items-start xs:items-center xs:flex-row xs:justify-between">
				<div className="text-sm font-semibold mb-2 xs:mb-0 text-muted-foreground flex items-center gap-2">
					<span className="flex items-center gap-2">
						<StatusDot
							variant={getVolumeStatusVariant(volume.status)}
							label={getVolumeStatusLabel(volume.status)}
						/>
						&nbsp;
						{getVolumeStatusLabel(volume.status)}
					</span>
					<VolumeIcon backend={volume?.config.backend} />
				</div>
				<div className="flex gap-4">
					<Button
						onClick={() => mountVol.mutate({ path: { name } })}
						loading={mountVol.isPending}
						className={cn({ hidden: volume.status === "mounted" })}
					>
						<Plug className="h-4 w-4 mr-2" />
						Montar
					</Button>
					<Button
						variant="secondary"
						onClick={() => unmountVol.mutate({ path: { name } })}
						loading={unmountVol.isPending}
						className={cn({ hidden: volume.status !== "mounted" })}
					>
						<Unplug className="h-4 w-4 mr-2" />
						Desmontar
					</Button>
					<Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={deleteVol.isPending}>
						Eliminar
					</Button>
				</div>
			</div>
			<Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })} className="mt-4">
				<TabsList className="mb-2">
					<TabsTrigger value="info">Configuración</TabsTrigger>
					<TabsTrigger value="files">Archivos</TabsTrigger>
				</TabsList>
				<TabsContent value="info">
					<VolumeInfoTabContent volume={volume} statfs={statfs} />
				</TabsContent>
				<TabsContent value="files">
					<FilesTabContent volume={volume} />
				</TabsContent>
			</Tabs>

			<AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar volume?</AlertDialogTitle>
						<AlertDialogDescription>
							¿Está seguro de que desea eliminar el volume <strong>{name}</strong>? Esta acción no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="flex gap-3 justify-end">
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Eliminar volume
						</AlertDialogAction>
					</div>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
