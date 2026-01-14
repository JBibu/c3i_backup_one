import { ConflictError, NotFoundError } from "http-errors-enhanced";
import { sanitizeSensitiveData } from "./sanitize";

export const handleServiceError = (error: unknown) => {
	if (error instanceof ConflictError) {
		return { message: sanitizeSensitiveData(error.message), status: 409 as const };
	}

	if (error instanceof NotFoundError) {
		return { message: sanitizeSensitiveData(error.message), status: 404 as const };
	}

	return { message: sanitizeSensitiveData(toMessage(error)), status: 500 as const };
};

export const toMessage = (err: unknown): string => {
	const message = err instanceof Error ? err.message : String(err);
	return sanitizeSensitiveData(message);
};

const resticErrorCodes: Record<number, string> = {
	1: "Comando fallido: Se produjo un error al ejecutar el comando.",
	2: "Error de ejecución de Go: Se produjo un error de ejecución en el programa Go.",
	3: "La copia de seguridad no pudo leer todos los archivos: No se pudieron leer algunos archivos durante la copia de seguridad.",
	10: "Repositorio no encontrado: No se pudo encontrar el repositorio especificado.",
	11: "Error al bloquear el repositorio: No se pudo adquirir un bloqueo en el repositorio. Intente ejecutar el doctor en el repositorio.",
	12: "Contraseña de repositorio incorrecta: La contraseña proporcionada para el repositorio es incorrecta.",
	130: "Copia de seguridad interrumpida: El proceso de copia de seguridad fue interrumpido.",
};

export class ResticError extends Error {
	code: number;

	constructor(code: number, stderr: string) {
		const message = resticErrorCodes[code] || `Error de restic desconocido con código ${code}`;
		super(`${message}\n${stderr}`);

		this.code = code;
		this.name = "ResticError";
	}
}
