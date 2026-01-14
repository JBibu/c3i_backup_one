import { arktypeResolver } from "@hookform/resolvers/arktype";
import { type } from "arktype";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { AuthLayout } from "~/client/components/auth-layout";
import { Button } from "~/client/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/client/components/ui/form";
import { Input } from "~/client/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "~/client/components/ui/input-otp";
import { Label } from "~/client/components/ui/label";
import { authClient } from "~/client/lib/auth-client";
import { authMiddleware } from "~/middleware/auth";
import { ResetPasswordDialog } from "../components/reset-password-dialog";
import type { Route } from "./+types/login";

export const clientMiddleware = [authMiddleware];

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "C3i Backup ONE - Iniciar sesión" },
		{
			name: "description",
			content: "Inicie sesión en su cuenta de C3i Backup ONE.",
		},
	];
}

const loginSchema = type({
	username: "2<=string<=50",
	password: "string>=1",
});

type LoginFormValues = typeof loginSchema.inferIn;

export default function LoginPage() {
	const navigate = useNavigate();
	const [showResetDialog, setShowResetDialog] = useState(false);
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [requires2FA, setRequires2FA] = useState(false);
	const [totpCode, setTotpCode] = useState("");
	const [isVerifying2FA, setIsVerifying2FA] = useState(false);
	const [trustDevice, setTrustDevice] = useState(false);

	const form = useForm<LoginFormValues>({
		resolver: arktypeResolver(loginSchema),
		defaultValues: {
			username: "",
			password: "",
		},
	});

	const onSubmit = async (values: LoginFormValues) => {
		const { data, error } = await authClient.signIn.username({
			username: values.username.toLowerCase().trim(),
			password: values.password,
			fetchOptions: {
				onRequest: () => {
					setIsLoggingIn(true);
				},
				onResponse: () => {
					setIsLoggingIn(false);
				},
			},
		});

		if (error) {
			console.error(error);
			toast.error("Error al iniciar sesión", { description: error.message });
			return;
		}

		if ("twoFactorRedirect" in data && data.twoFactorRedirect) {
			setRequires2FA(true);
			return;
		}

		const d = await authClient.getSession();
		if (data.user && !d.data?.user.hasDownloadedResticPassword) {
			void navigate("/download-recovery-key");
		} else {
			void navigate("/volumes");
		}
	};

	const handleVerify2FA = async () => {
		if (totpCode.length !== 6) {
			toast.error("Por favor, introduzca un código de 6 dígitos");
			return;
		}

		const { data, error } = await authClient.twoFactor.verifyTotp({
			code: totpCode,
			trustDevice,
			fetchOptions: {
				onRequest: () => {
					setIsVerifying2FA(true);
				},
				onResponse: () => {
					setIsVerifying2FA(false);
				},
			},
		});

		if (error) {
			console.error(error);
			toast.error("Error en la verificación", { description: error.message });
			setTotpCode("");
			return;
		}

		if (data) {
			toast.success("Inicio de sesión exitoso");
			const session = await authClient.getSession();
			if (session.data?.user && !session.data.user.hasDownloadedResticPassword) {
				void navigate("/download-recovery-key");
			} else {
				void navigate("/volumes");
			}
		}
	};

	const handleBackToLogin = () => {
		setRequires2FA(false);
		setTotpCode("");
		setTrustDevice(false);
		form.reset();
	};

	if (requires2FA) {
		return (
			<AuthLayout title="Autenticación de dos factores" description="Introduzca el código de 6 dígitos de su aplicación de autenticación">
				<div className="space-y-6">
					<div className="space-y-4 flex flex-col items-center">
						<Label htmlFor="totp-code">Código de autenticación</Label>
						<div>
							<InputOTP
								maxLength={6}
								value={totpCode}
								onChange={setTotpCode}
								onComplete={handleVerify2FA}
								disabled={isVerifying2FA}
							>
								<InputOTPGroup>
									<InputOTPSlot index={0} />
									<InputOTPSlot index={1} />
									<InputOTPSlot index={2} />
								</InputOTPGroup>
								<InputOTPSeparator />
								<InputOTPGroup>
									<InputOTPSlot index={3} />
									<InputOTPSlot index={4} />
									<InputOTPSlot index={5} />
								</InputOTPGroup>
							</InputOTP>
						</div>
					</div>

					<div className="flex items-center space-x-2">
						<input
							type="checkbox"
							id="trust-device"
							checked={trustDevice}
							onChange={(e) => setTrustDevice(e.target.checked)}
							className="h-4 w-4"
						/>
						<label htmlFor="trust-device" className="text-sm text-muted-foreground cursor-pointer">
							Confiar en este dispositivo durante 30 días
						</label>
					</div>

					<div className="space-y-2">
						<Button
							type="button"
							className="w-full"
							loading={isVerifying2FA}
							onClick={handleVerify2FA}
							disabled={totpCode.length !== 6}
						>
							Verificar
						</Button>
						<Button
							type="button"
							variant="outline"
							className="w-full"
							onClick={handleBackToLogin}
							disabled={isVerifying2FA}
						>
							Volver al inicio de sesión
						</Button>
					</div>
				</div>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout title="Iniciar sesión en su cuenta" description="Introduzca sus credenciales a continuación para iniciar sesión">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="username"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nombre de usuario</FormLabel>
								<FormControl>
									<Input {...field} type="text" placeholder="admin" disabled={isLoggingIn} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<div className="flex items-center justify-between">
									<FormLabel>Contraseña</FormLabel>
									<button
										type="button"
										className="text-xs text-muted-foreground hover:underline"
										onClick={() => setShowResetDialog(true)}
									>
										¿Olvidó su contraseña?
									</button>
								</div>
								<FormControl>
									<Input {...field} type="password" disabled={isLoggingIn} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="w-full" loading={isLoggingIn}>
						Iniciar sesión
					</Button>
				</form>
			</Form>

			<ResetPasswordDialog open={showResetDialog} onOpenChange={setShowResetDialog} />
		</AuthLayout>
	);
}
