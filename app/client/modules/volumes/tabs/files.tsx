import { FolderOpen } from "lucide-react";
import { VolumeFileBrowser } from "~/client/components/volume-file-browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/client/components/ui/card";
import type { Volume } from "~/client/lib/types";

type Props = {
	volume: Volume;
};

export const FilesTabContent = ({ volume }: Props) => {
	if (volume.status !== "mounted") {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center text-center py-12">
					<FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
					<p className="text-muted-foreground">El volume debe estar montado para explorar los archivos.</p>
					<p className="text-sm text-muted-foreground mt-2">Monte el volume para explorar su contenido.</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-[600px] flex flex-col">
			<CardHeader>
				<CardTitle>Explorador de archivos</CardTitle>
				<CardDescription>Explore los archivos y carpetas de este volume.</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 overflow-hidden flex flex-col">
				<VolumeFileBrowser
					volumeName={volume.name}
					enabled={volume.status === "mounted"}
					className="overflow-auto flex-1 border rounded-md bg-card p-2"
					emptyMessage="Este volume está vacío."
					emptyDescription="Los archivos y carpetas aparecerán aquí una vez que los agregue."
				/>
			</CardContent>
		</Card>
	);
};
