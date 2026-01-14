import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ChevronDown, FileIcon, FolderOpen, RotateCcw } from "lucide-react";
import { Button } from "~/client/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/client/components/ui/card";
import { Checkbox } from "~/client/components/ui/checkbox";
import { Input } from "~/client/components/ui/input";
import { Label } from "~/client/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/client/components/ui/select";
import { PathSelector } from "~/client/components/path-selector";
import { FileTree } from "~/client/components/file-tree";
import { listSnapshotFilesOptions, restoreSnapshotMutation } from "~/client/api-client/@tanstack/react-query.gen";
import { useFileBrowser } from "~/client/hooks/use-file-browser";
import { OVERWRITE_MODES, type OverwriteMode } from "~/schemas/restic";
import type { Repository, Snapshot } from "~/client/lib/types";

type RestoreLocation = "original" | "custom";

interface RestoreFormProps {
	snapshot: Snapshot;
	repository: Repository;
	snapshotId: string;
	returnPath: string;
}

export function RestoreForm({ snapshot, repository, snapshotId, returnPath }: RestoreFormProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const volumeBasePath = snapshot.paths[0]?.match(/^(.*?_data)(\/|$)/)?.[1] || "/";

	const [restoreLocation, setRestoreLocation] = useState<RestoreLocation>("original");
	const [customTargetPath, setCustomTargetPath] = useState("");
	const [overwriteMode, setOverwriteMode] = useState<OverwriteMode>("always");
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [excludeXattr, setExcludeXattr] = useState("");
	const [deleteExtraFiles, setDeleteExtraFiles] = useState(false);

	const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

	const { data: filesData, isLoading: filesLoading } = useQuery({
		...listSnapshotFilesOptions({
			path: { id: repository.id, snapshotId },
			query: { path: volumeBasePath },
		}),
	});

	const stripBasePath = useCallback(
		(path: string): string => {
			if (!volumeBasePath) return path;
			if (path === volumeBasePath) return "/";
			if (path.startsWith(`${volumeBasePath}/`)) {
				const stripped = path.slice(volumeBasePath.length);
				return stripped;
			}
			return path;
		},
		[volumeBasePath],
	);

	const addBasePath = useCallback(
		(displayPath: string): string => {
			const vbp = volumeBasePath === "/" ? "" : volumeBasePath;

			if (!vbp) return displayPath;
			if (displayPath === "/") return vbp;
			return `${vbp}${displayPath}`;
		},
		[volumeBasePath],
	);

	const fileBrowser = useFileBrowser({
		initialData: filesData,
		isLoading: filesLoading,
		fetchFolder: async (path) => {
			return await queryClient.ensureQueryData(
				listSnapshotFilesOptions({
					path: { id: repository.id, snapshotId },
					query: { path },
				}),
			);
		},
		prefetchFolder: (path) => {
			void queryClient.prefetchQuery(
				listSnapshotFilesOptions({
					path: { id: repository.id, snapshotId },
					query: { path },
				}),
			);
		},
		pathTransform: {
			strip: stripBasePath,
			add: addBasePath,
		},
	});

	const { mutate: restoreSnapshot, isPending: isRestoring } = useMutation({
		...restoreSnapshotMutation(),
		onSuccess: () => {
			toast.success("Restauración completada");
			void navigate(returnPath);
		},
		onError: (error) => {
			toast.error("Restauración fallida", { description: error.message || "Error al restaurar el snapshot" });
		},
	});

	const handleRestore = useCallback(() => {
		const excludeXattrArray = excludeXattr
			?.split(",")
			.map((s) => s.trim())
			.filter(Boolean);

		const isCustomLocation = restoreLocation === "custom";
		const targetPath = isCustomLocation && customTargetPath.trim() ? customTargetPath.trim() : undefined;

		const pathsArray = Array.from(selectedPaths);
		const includePaths = pathsArray.map((path) => addBasePath(path));

		restoreSnapshot({
			path: { id: repository.id },
			body: {
				snapshotId,
				include: includePaths.length > 0 ? includePaths : undefined,
				delete: deleteExtraFiles,
				excludeXattr: excludeXattrArray && excludeXattrArray.length > 0 ? excludeXattrArray : undefined,
				targetPath,
				overwrite: overwriteMode,
			},
		});
	}, [
		repository.id,
		snapshotId,
		excludeXattr,
		restoreLocation,
		customTargetPath,
		selectedPaths,
		addBasePath,
		deleteExtraFiles,
		overwriteMode,
		restoreSnapshot,
	]);

	const canRestore = restoreLocation === "original" || customTargetPath.trim();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Restaurar Snapshot</h1>
					<p className="text-sm text-muted-foreground">
						{repository.name} / {snapshotId}
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => navigate(returnPath)}>
						Cancelar
					</Button>
					<Button variant="primary" onClick={handleRestore} disabled={isRestoring || !canRestore}>
						<RotateCcw className="h-4 w-4 mr-2" />
						{isRestoring
							? "Restaurando..."
							: selectedPaths.size > 0
								? `Restaurar ${selectedPaths.size} ${selectedPaths.size === 1 ? "elemento" : "elementos"}`
								: "Restaurar todo"}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Ubicación de restauración</CardTitle>
							<CardDescription>Elija dónde restaurar los archivos</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 gap-2">
								<Button
									type="button"
									variant={restoreLocation === "original" ? "secondary" : "outline"}
									size="sm"
									className="flex justify-start gap-2"
									onClick={() => setRestoreLocation("original")}
								>
									<RotateCcw size={16} className="mr-1" />
									Ubicación original
								</Button>
								<Button
									type="button"
									variant={restoreLocation === "custom" ? "secondary" : "outline"}
									size="sm"
									className="justify-start gap-2"
									onClick={() => setRestoreLocation("custom")}
								>
									<FolderOpen size={16} className="mr-1" />
									Ubicación personalizada
								</Button>
							</div>
							{restoreLocation === "custom" && (
								<div className="space-y-2">
									<PathSelector value={customTargetPath || "/"} onChange={setCustomTargetPath} />
									<p className="text-xs text-muted-foreground">Los archivos se restaurarán directamente en esta ruta</p>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Modo de sobrescritura</CardTitle>
							<CardDescription>Cómo manejar los archivos existentes</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<Select value={overwriteMode} onValueChange={(value) => setOverwriteMode(value as OverwriteMode)}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Seleccione el comportamiento de sobrescritura" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={OVERWRITE_MODES.always}>Siempre sobrescribir</SelectItem>
									<SelectItem value={OVERWRITE_MODES.ifChanged}>Solo si el contenido cambió</SelectItem>
									<SelectItem value={OVERWRITE_MODES.ifNewer}>Solo si el snapshot es más reciente</SelectItem>
									<SelectItem value={OVERWRITE_MODES.never}>Nunca sobrescribir</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								{overwriteMode === OVERWRITE_MODES.always &&
									"Los archivos existentes siempre serán reemplazados con la versión del snapshot."}
								{overwriteMode === OVERWRITE_MODES.ifChanged &&
									"Los archivos solo se reemplazan si su contenido difiere del snapshot."}
								{overwriteMode === OVERWRITE_MODES.ifNewer &&
									"Los archivos solo se reemplazan si la versión del snapshot tiene una fecha de modificación más reciente."}
								{overwriteMode === OVERWRITE_MODES.never &&
									"Los archivos existentes nunca serán reemplazados, solo se restauran los archivos faltantes."}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
							<div className="flex items-center justify-between">
								<CardTitle className="text-base">Opciones avanzadas</CardTitle>
								<ChevronDown size={16} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
							</div>
						</CardHeader>
						{showAdvanced && (
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="exclude-xattr" className="text-sm">
										Excluir atributos extendidos
									</Label>
									<Input
										id="exclude-xattr"
										placeholder="com.apple.metadata,user.*,nfs4.*"
										value={excludeXattr}
										onChange={(e) => setExcludeXattr(e.target.value)}
									/>
									<p className="text-xs text-muted-foreground">
										Excluir atributos extendidos específicos durante la restauración (separados por comas)
									</p>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="delete-extra"
										checked={deleteExtraFiles}
										onCheckedChange={(checked) => setDeleteExtraFiles(checked === true)}
									/>
									<Label htmlFor="delete-extra" className="text-sm font-normal cursor-pointer">
										Eliminar archivos no presentes en el snapshot
									</Label>
								</div>
							</CardContent>
						)}
					</Card>
				</div>
				<Card className="lg:col-span-2 flex flex-col">
					<CardHeader>
						<CardTitle>Seleccionar archivos a restaurar</CardTitle>
						<CardDescription>
							{selectedPaths.size > 0
								? `${selectedPaths.size} ${selectedPaths.size === 1 ? "elemento" : "elementos"} seleccionado${selectedPaths.size === 1 ? "" : "s"}`
								: "Seleccione archivos o carpetas específicos, o deje vacío para restaurar todo"}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex-1 overflow-hidden flex flex-col p-0">
						{fileBrowser.isLoading && (
							<div className="flex items-center justify-center flex-1">
								<p className="text-muted-foreground">Cargando archivos...</p>
							</div>
						)}

						{fileBrowser.isEmpty && (
							<div className="flex flex-col items-center justify-center flex-1 text-center p-8">
								<FileIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
								<p className="text-muted-foreground">No hay archivos en este snapshot</p>
							</div>
						)}

						{!fileBrowser.isLoading && !fileBrowser.isEmpty && (
							<div className="overflow-auto flex-1 border border-border rounded-md bg-card m-4">
								<FileTree
									files={fileBrowser.fileArray}
									onFolderExpand={fileBrowser.handleFolderExpand}
									onFolderHover={fileBrowser.handleFolderHover}
									expandedFolders={fileBrowser.expandedFolders}
									loadingFolders={fileBrowser.loadingFolders}
									className="px-2 py-2"
									withCheckboxes={true}
									selectedPaths={selectedPaths}
									onSelectionChange={setSelectedPaths}
								/>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
