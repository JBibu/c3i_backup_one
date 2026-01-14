import { useMutation } from "@tanstack/react-query";
import { HardDrive, Plus } from "lucide-react";
import { useId } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { createVolumeMutation } from "~/client/api-client/@tanstack/react-query.gen";
import { CreateVolumeForm, type FormValues } from "~/client/modules/volumes/components/create-volume-form";
import { Button } from "~/client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/client/components/ui/card";
import { parseError } from "~/client/lib/errors";
import type { Route } from "./+types/create-volume";
import { Alert, AlertDescription } from "~/client/components/ui/alert";

export const handle = {
	breadcrumb: () => [{ label: "Volúmenes", href: "/volumes" }, { label: "Crear" }],
};

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "C3i Backup ONE - Crear Volume" },
		{
			name: "description",
			content: "Cree un nuevo volume de almacenamiento con montaje automático y comprobaciones de salud.",
		},
	];
}

export default function CreateVolume() {
	const navigate = useNavigate();
	const formId = useId();

	const createVolume = useMutation({
		...createVolumeMutation(),
		onSuccess: (data) => {
			toast.success("Volume creado correctamente");
			void navigate(`/volumes/${data.name}`);
		},
	});

	const handleSubmit = (values: FormValues) => {
		createVolume.mutate({
			body: {
				config: values,
				name: values.name,
			},
		});
	};

	return (
		<div className="container mx-auto space-y-6">
			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
							<HardDrive className="w-5 h-5 text-primary" />
						</div>
						<CardTitle>Crear Volume</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{createVolume.isError && (
						<Alert variant="destructive">
							<AlertDescription>
								<strong>Error al crear el volume:</strong>
								<br />
								{parseError(createVolume.error)?.message}
							</AlertDescription>
						</Alert>
					)}
					<CreateVolumeForm mode="create" formId={formId} onSubmit={handleSubmit} loading={createVolume.isPending} />
					<div className="flex justify-end gap-2 pt-4 border-t">
						<Button type="button" variant="secondary" onClick={() => navigate("/volumes")}>
							Cancelar
						</Button>
						<Button type="submit" form={formId} loading={createVolume.isPending}>
							<Plus className="h-4 w-4 mr-2" />
							Crear Volume
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
