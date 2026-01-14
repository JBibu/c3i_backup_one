import { useQuery } from "@tanstack/react-query";
import { HardDrive, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { EmptyState } from "~/client/components/empty-state";
import { StatusDot } from "~/client/components/status-dot";
import { Button } from "~/client/components/ui/button";
import { Card } from "~/client/components/ui/card";
import { Input } from "~/client/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/client/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/client/components/ui/table";
import { VolumeIcon } from "~/client/components/volume-icon";
import type { Route } from "./+types/volumes";
import { listVolumes } from "~/client/api-client";
import { listVolumesOptions } from "~/client/api-client/@tanstack/react-query.gen";
import type { VolumeStatus } from "~/client/lib/types";

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
	breadcrumb: () => [{ label: "Volúmenes" }],
};

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "C3i Backup ONE - Volúmenes" },
		{
			name: "description",
			content: "Cree, gestione, supervise y automatice sus volúmenes Docker con facilidad.",
		},
	];
}

export const clientLoader = async () => {
	const volumes = await listVolumes();
	if (volumes.data) return volumes.data;
	return [];
};

export default function Volumes({ loaderData }: Route.ComponentProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [backendFilter, setBackendFilter] = useState("");

	const clearFilters = () => {
		setSearchQuery("");
		setStatusFilter("");
		setBackendFilter("");
	};

	const navigate = useNavigate();

	const { data } = useQuery({
		...listVolumesOptions(),
		initialData: loaderData,
	});

	const filteredVolumes =
		data.filter((volume) => {
			const matchesSearch = volume.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus = !statusFilter || volume.status === statusFilter;
			const matchesBackend = !backendFilter || volume.type === backendFilter;
			return matchesSearch && matchesStatus && matchesBackend;
		}) || [];

	const hasNoVolumes = data.length === 0;
	const hasNoFilteredVolumes = filteredVolumes.length === 0 && !hasNoVolumes;

	if (hasNoVolumes) {
		return (
			<EmptyState
				icon={HardDrive}
				title="Sin volúmenes"
				description="Gestione y supervise todos sus backends de almacenamiento en un solo lugar con características avanzadas como montaje automático y comprobaciones de estado."
				button={
					<Button onClick={() => navigate("/volumes/create")}>
						<Plus size={16} className="mr-2" />
						Crear volumen
					</Button>
				}
			/>
		);
	}

	return (
		<Card className="p-0 gap-0">
			<div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 md:justify-between p-4 bg-card-header py-4">
				<span className="flex flex-col sm:flex-row items-stretch md:items-center gap-0 flex-wrap ">
					<Input
						className="w-full lg:w-[180px] min-w-[180px] -mr-px -mt-px"
						placeholder="Buscar volúmenes…"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-full lg:w-[180px] min-w-[180px] -mr-px -mt-px">
							<SelectValue placeholder="Todos los estados" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="mounted">Montado</SelectItem>
							<SelectItem value="unmounted">Desmontado</SelectItem>
							<SelectItem value="error">Error</SelectItem>
						</SelectContent>
					</Select>
					<Select value={backendFilter} onValueChange={setBackendFilter}>
						<SelectTrigger className="w-full lg:w-[180px] min-w-[180px] -mt-px">
							<SelectValue placeholder="Todos los backends" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="directory">Directorio</SelectItem>
							<SelectItem value="nfs">NFS</SelectItem>
							<SelectItem value="smb">SMB</SelectItem>
						</SelectContent>
					</Select>
					{(searchQuery || statusFilter || backendFilter) && (
						<Button onClick={clearFilters} className="w-full lg:w-auto mt-2 lg:mt-0 lg:ml-2">
							<RotateCcw className="h-4 w-4 mr-2" />
							Limpiar filtros
						</Button>
					)}
				</span>
				<Button onClick={() => navigate("/volumes/create")}>
					<Plus size={16} className="mr-2" />
					Crear volumen
				</Button>
			</div>
			<div className="overflow-x-auto">
				<Table className="border-t">
					<TableHeader className="bg-card-header">
						<TableRow>
							<TableHead className="w-[100px] uppercase">Nombre</TableHead>
							<TableHead className="uppercase text-left">Backend</TableHead>
							<TableHead className="uppercase text-center">Estado</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{hasNoFilteredVolumes ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center py-12">
									<div className="flex flex-col items-center gap-3">
										<p className="text-muted-foreground">Ningún volumen coincide con sus filtros.</p>
										<Button onClick={clearFilters} variant="outline" size="sm">
											<RotateCcw className="h-4 w-4 mr-2" />
											Limpiar filtros
										</Button>
									</div>
								</TableCell>
							</TableRow>
						) : (
							filteredVolumes.map((volume) => (
								<TableRow
									key={volume.name}
									className="hover:bg-accent/50 hover:cursor-pointer"
									onClick={() => navigate(`/volumes/${volume.name}`)}
								>
									<TableCell className="font-medium text-strong-accent">{volume.name}</TableCell>
									<TableCell>
										<VolumeIcon backend={volume.type} />
									</TableCell>
									<TableCell className="text-center">
										<StatusDot
											variant={getVolumeStatusVariant(volume.status)}
											label={getVolumeStatusLabel(volume.status)}
										/>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
			<div className="px-4 py-2 text-sm text-muted-foreground bg-card-header flex justify-end border-t">
				{hasNoFilteredVolumes ? (
					"Ningún volumen coincide con los filtros."
				) : (
					<span>
						<span className="text-strong-accent">{filteredVolumes.length}</span> volúmen
						{filteredVolumes.length > 1 ? "es" : ""}
					</span>
				)}
			</div>
		</Card>
	);
}
