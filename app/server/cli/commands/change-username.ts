import { input, select } from "@inquirer/prompts";
import { Command } from "commander";
import { eq } from "drizzle-orm";
import { toMessage } from "~/server/utils/errors";
import { db } from "../../db/db";
import { sessionsTable, usersTable } from "../../db/schema";

const listUsers = () => {
	return db.select({ id: usersTable.id, username: usersTable.username }).from(usersTable);
};

const changeUsername = async (oldUsername: string, newUsername: string) => {
	const [user] = await db.select().from(usersTable).where(eq(usersTable.username, oldUsername));

	if (!user) {
		throw new Error(`Usuario "${oldUsername}" no encontrado`);
	}

	const normalizedUsername = newUsername.toLowerCase().trim();

	const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.username, normalizedUsername));
	if (existingUser) {
		throw new Error(`El nombre de usuario "${newUsername}" ya está en uso`);
	}

	const usernameRegex = /^[a-z0-9_]{3,30}$/;
	if (!usernameRegex.test(normalizedUsername)) {
		throw new Error(
			`Nombre de usuario "${newUsername}" no válido. Los nombres de usuario deben tener entre 3 y 30 caracteres y solo pueden contener letras minúsculas, números y guiones bajos.`,
		);
	}

	await db.transaction(async (tx) => {
		await tx.update(usersTable).set({ username: normalizedUsername }).where(eq(usersTable.id, user.id));
		await tx.delete(sessionsTable).where(eq(sessionsTable.userId, user.id));
	});
};

export const changeUsernameCommand = new Command("change-username")
	.description("Cambiar nombre de usuario de una cuenta")
	.option("-u, --username <username>", "Nombre de usuario actual de la cuenta")
	.option("-n, --new-username <new-username>", "Nuevo nombre de usuario para la cuenta")
	.action(async (options) => {
		console.info("\n👤 C3i Backup ONE Cambio de Nombre de Usuario\n");

		let username = options.username;
		let newUsername = options.newUsername;

		try {
			if (!username) {
				const users = await listUsers();

				if (users.length === 0) {
					console.error("No se encontraron usuarios en la base de datos.");
					return;
				}

				username = await select({
					message: "Seleccione el usuario para cambiar el nombre de usuario:",
					choices: users.map((u) => ({
						name: u.username,
						value: u.username,
					})),
				});
			}

			if (!newUsername) {
				newUsername = await input({
					message: "Introduzca el nuevo nombre de usuario:",
					validate: (val) => {
						const usernameRegex = /^[a-z0-9_]{3,30}$/;
						return usernameRegex.test(val)
							? true
							: "El nombre de usuario debe tener entre 3 y 30 caracteres y contener solo letras minúsculas, números o guiones bajos";
					},
				});
				newUsername = newUsername.toLowerCase().trim();
			}

			await changeUsername(username, newUsername);
			console.info(`\n✅ El nombre de usuario de "${username}" ha sido cambiado a "${newUsername}" exitosamente.`);
		} catch (error) {
			console.error(`\n❌ Error: ${toMessage(error)}`);
			process.exit(1);
		}
	});
