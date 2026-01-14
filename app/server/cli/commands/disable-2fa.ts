import { select } from "@inquirer/prompts";
import { Command } from "commander";
import { eq } from "drizzle-orm";
import { toMessage } from "~/server/utils/errors";
import { db } from "../../db/db";
import { twoFactor, usersTable } from "../../db/schema";

const listUsers = () => {
	return db.select({ id: usersTable.id, username: usersTable.username }).from(usersTable);
};

const disable2FA = async (username: string) => {
	const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));

	if (!user) {
		throw new Error(`Usuario "${username}" no encontrado`);
	}

	if (!user.twoFactorEnabled) {
		throw new Error(`El usuario "${username}" no tiene 2FA habilitado`);
	}

	await db.transaction(async (tx) => {
		await tx.update(usersTable).set({ twoFactorEnabled: false }).where(eq(usersTable.id, user.id));
		await tx.delete(twoFactor).where(eq(twoFactor.userId, user.id));
	});
};

export const disable2FACommand = new Command("disable-2fa")
	.description("Deshabilitar autenticación de dos factores para un usuario")
	.option("-u, --username <username>", "Nombre de usuario de la cuenta")
	.action(async (options) => {
		console.info("\n🔐 C3i Backup ONE Deshabilitar 2FA\n");

		let username = options.username;

		if (!username) {
			const users = await listUsers();

			if (users.length === 0) {
				console.error("❌ No se encontraron usuarios en la base de datos.");
				console.info("   Por favor, cree un usuario primero iniciando la aplicación.");
				process.exit(1);
			}

			username = await select({
				message: "Seleccione el usuario para deshabilitar 2FA:",
				choices: users.map((u) => ({ name: u.username, value: u.username })),
			});
		}

		try {
			await disable2FA(username);
			console.info(`\n✅ La autenticación de dos factores ha sido deshabilitada para el usuario "${username}".`);
			console.info("   El usuario puede volver a habilitar 2FA desde la configuración de su cuenta.");
		} catch (error) {
			console.error(`\n❌ Error al deshabilitar 2FA: ${toMessage(error)}`);
			process.exit(1);
		}

		process.exit(0);
	});
