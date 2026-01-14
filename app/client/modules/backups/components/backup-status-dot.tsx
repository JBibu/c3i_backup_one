import { StatusDot } from "~/client/components/status-dot";

export const BackupStatusDot = ({
	enabled,
	hasError,
	isInProgress,
}: {
	enabled: boolean;
	hasError?: boolean;
	isInProgress?: boolean;
}) => {
	let variant: "success" | "neutral" | "error" | "info";
	let label: string;

	if (isInProgress) {
		variant = "info";
		label = "Copia de seguridad en curso";
	} else if (hasError) {
		variant = "error";
		label = "Error";
	} else if (enabled) {
		variant = "success";
		label = "Activo";
	} else {
		variant = "neutral";
		label = "Pausado";
	}

	return <StatusDot variant={variant} label={label} />;
};
