import { useMutation } from "@tanstack/react-query";
import { Activity, HeartIcon } from "lucide-react";
import { toast } from "sonner";
import { healthCheckVolumeMutation, updateVolumeMutation } from "~/client/api-client/@tanstack/react-query.gen";
import { OnOff } from "~/client/components/onoff";
import { Button } from "~/client/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/client/components/ui/card";
import { formatTimeAgo } from "~/client/lib/datetime";
import type { Volume } from "~/client/lib/types";

type Props = {
	volume: Volume;
};

export const HealthchecksCard = ({ volume }: Props) => {
	const healthcheck = useMutation({
		...healthCheckVolumeMutation(),
		onSuccess: (d) => {
			if (d.error) {
				toast.error("Comprobación de estado fallida", { description: d.error });
				return;
			}
			toast.success("Comprobación de estado completada", { description: "El volume está en buen estado." });
		},
		onError: (error) => {
			toast.error("Comprobación de estado fallida", { description: error.message });
		},
	});

	const toggleAutoRemount = useMutation({
		...updateVolumeMutation(),
		onSuccess: (d) => {
			toast.success("Volume actualizado", {
				description: `El remontado automático está ahora ${d.autoRemount ? "activado" : "pausado"}.`,
			});
		},
		onError: (error) => {
			toast.error("Error en la actualización", { description: error.message });
		},
	});

	return (
		<Card className="flex-1 flex flex-col h-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<HeartIcon className="h-4 w-4" />
					Comprobaciones de estado
				</CardTitle>
				<CardDescription>Monitorice y remonte automáticamente los volumes ante errores para garantizar la disponibilidad.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col flex-1 justify-start">
					{volume.lastError && <span className="text-sm text-red-500 wrap-break-word">{volume.lastError}</span>}
					{volume.status === "mounted" && <span className="text-md text-green-500">En buen estado</span>}
					{volume.status !== "unmounted" && (
						<span className="text-xs text-muted-foreground mb-4">Verificado {formatTimeAgo(volume.lastHealthCheck)}</span>
					)}
					<span className="flex justify-between items-center gap-2">
						<span className="text-sm">Remontar ante error</span>
						<OnOff
							isOn={volume.autoRemount}
							toggle={() =>
								toggleAutoRemount.mutate({ path: { name: volume.name }, body: { autoRemount: !volume.autoRemount } })
							}
							disabled={toggleAutoRemount.isPending}
							enabledLabel="Activado"
							disabledLabel="Pausado"
						/>
					</span>
				</div>
				{volume.status !== "unmounted" && (
					<div className="flex justify-center">
						<Button
							variant="outline"
							className="mt-4"
							loading={healthcheck.isPending}
							onClick={() => healthcheck.mutate({ path: { name: volume.name } })}
						>
							<Activity className="h-4 w-4 mr-2" />
							Ejecutar comprobación de estado
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
