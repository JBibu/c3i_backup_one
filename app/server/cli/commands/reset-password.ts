import { password, select } from "@inquirer/prompts";
import { hashPassword } from "better-auth/crypto";
import { Command } from "commander";
import { and, eq } from "drizzle-orm";
import { toMessage } from "~/server/utils/errors";
import { db } from "../../db/db";
import { account, sessionsTable, usersTable } from "../../db/schema";

const listUsers = () => {
	return db.select({ id: usersTable.id, username: usersTable.username }).from(usersTable);
};

const resetPassword = async (username: string, newPassword: string) => {
	const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));

	if (!user) {
		throw new Error(`Usuario "${username}" no encontrado`);
	}

	const newPasswordHash = await hashPassword(newPassword);

	await db.transaction(async (tx) => {
		await tx
			.update(account)
			.set({ password: newPasswordHash })
			.where(and(eq(account.userId, user.id), eq(account.providerId, "credential")));

		if (user.passwordHash) {
			const legacyHash = await Bun.password.hash(newPassword);
			await tx.update(usersTable).set({ passwordHash: legacyHash }).where(eq(usersTable.id, user.id));
		}

		await tx.delete(sessionsTable).where(eq(sessionsTable.userId, user.id));
	});
};

export const resetPasswordCommand = new Command("reset-password")
	.description("Restablecer contraseña de un usuario")
	.option("-u, --username <username>", "Nombre de usuario de la cuenta")
	.option("-p, --password <password>", "Nueva contraseña para la cuenta")
	.action(async (options) => {
		console.info("\n🔐 C3i Backup ONE Restablecimiento de Contraseña\n");

		let username = options.username;
		let newPassword = options.password;

		if (!username) {
			const users = await listUsers();

			if (users.length === 0) {
				console.error("❌ No se encontraron usuarios en la base de datos.");
				console.info("   Por favor, cree un usuario primero iniciando la aplicación.");
				process.exit(1);
			}

			username = await select({
				message: "Seleccione el usuario para restablecer la contraseña:",
				choices: users.map((u) => ({ name: u.username, value: u.username })),
			});
		}

		if (!newPassword) {
			newPassword = await password({
				message: "Introduzca la nueva contraseña:",
				mask: "*",
				validate: (value) => {
					if (value.length < 8) {
						return "La contraseña debe tener al menos 8 caracteres";
					}
					return true;
				},
			});

			const confirmPassword = await password({
				message: "Confirme la nueva contraseña:",
				mask: "*",
			});

			if (newPassword !== confirmPassword) {
				console.error("\n❌ Las contraseñas no coinciden.");
				process.exit(1);
			}
		} else if (newPassword.length < 8) {
			console.error("\n❌ La contraseña debe tener al menos 8 caracteres.");
			process.exit(1);
		}

		try {
			await resetPassword(username, newPassword);
			console.info(`\n✅ La contraseña del usuario "${username}" ha sido restablecida exitosamente.`);
			console.info("   Todas las sesiones existentes han sido invalidadas.");
		} catch (error) {
			console.error(`\n❌ Error al restablecer la contraseña: ${toMessage(error)}`);
			process.exit(1);
		}

		process.exit(0);
	});
