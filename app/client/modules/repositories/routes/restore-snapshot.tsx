import { redirect } from "react-router";
import { getRepository, getSnapshotDetails } from "~/client/api-client";
import { RestoreForm } from "~/client/components/restore-form";
import type { Route } from "./+types/restore-snapshot";

export const handle = {
	breadcrumb: (match: Route.MetaArgs) => [
		{ label: "Repositorios", href: "/repositories" },
		{ label: match.loaderData?.repository.name || match.params.id, href: `/repositories/${match.params.id}` },
		{ label: match.params.snapshotId, href: `/repositories/${match.params.id}/${match.params.snapshotId}` },
		{ label: "Restaurar" },
	],
};

export function meta({ params }: Route.MetaArgs) {
	return [
		{ title: `C3i Backup ONE - Restaurar Snapshot ${params.snapshotId}` },
		{
			name: "description",
			content: "Restaurar archivos de un snapshot de backup.",
		},
	];
}

export const clientLoader = async ({ params }: Route.ClientLoaderArgs) => {
	const [snapshot, repository] = await Promise.all([
		getSnapshotDetails({ path: { id: params.id, snapshotId: params.snapshotId } }),
		getRepository({ path: { id: params.id } }),
	]);

	if (!snapshot.data) return redirect("/repositories");
	if (!repository.data) return redirect(`/repositories`);

	return { snapshot: snapshot.data, id: params.id, repository: repository.data, snapshotId: params.snapshotId };
};

export default function RestoreSnapshotPage({ loaderData }: Route.ComponentProps) {
	const { snapshot, id, snapshotId, repository } = loaderData;

	return (
		<RestoreForm
			snapshot={snapshot}
			repository={repository}
			snapshotId={snapshotId}
			returnPath={`/repositories/${id}/${snapshotId}`}
		/>
	);
}
