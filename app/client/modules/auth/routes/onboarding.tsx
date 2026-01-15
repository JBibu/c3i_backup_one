import { arktypeResolver } from "@hookform/resolvers/arktype";
import { type } from "arktype";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/client/components/ui/form";
import { authMiddleware } from "~/middleware/auth";
import type { Route } from "./+types/onboarding";
import { AuthLayout } from "~/client/components/auth-layout";
import { Input } from "~/client/components/ui/input";
import { Button } from "~/client/components/ui/button";
import { authClient } from "~/client/lib/auth-client";
import { useState } from "react";

export const clientMiddleware = [authMiddleware];

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "C3i Backup ONE - Onboarding" },
		{
			name: "description",
			content: "Welcome to C3i Backup ONE. Create your administrator account to get started.",
		},
	];
}

const onboardingSchema = type({
	username: type("2<=string<=30").pipe((str) => str.trim().toLowerCase()),
	email: type("string.email").pipe((str) => str.trim().toLowerCase()),
	password: "string>=8",
	confirmPassword: "string>=1",
});

type OnboardingFormValues = typeof onboardingSchema.inferIn;

export default function OnboardingPage() {
	const navigate = useNavigate();
	const [submitting, setSubmitting] = useState(false);

	const form = useForm<OnboardingFormValues>({
		resolver: arktypeResolver(onboardingSchema),
		defaultValues: {
			username: "",
			password: "",
			confirmPassword: "",
			email: "",
		},
	});

	const onSubmit = async (values: OnboardingFormValues) => {
		if (values.password !== values.confirmPassword) {
			form.setError("confirmPassword", {
				type: "manual",
				message: "Passwords do not match",
			});
			return;
		}

		console.info("[Auth] Starting account creation for:", values.username);
		console.info("[Auth] Email:", values.email);

		try {
			const { data, error } = await authClient.signUp.email({
				username: values.username.toLowerCase().trim(),
				password: values.password,
				email: values.email.toLowerCase().trim(),
				name: values.username,
				displayUsername: values.username,
				hasDownloadedResticPassword: false,
				fetchOptions: {
					onRequest: () => {
						console.info("[Auth] Sending signup request...");
						setSubmitting(true);
					},
					onResponse: () => {
						console.info("[Auth] Received response");
						setSubmitting(false);
					},
				},
			});

			console.info("[Auth] Response data:", data);
			console.info("[Auth] Response error:", error);

			if (data?.token) {
				console.info("[Auth] Account created successfully!");
				toast.success("Administrator account created successfully!");
				void navigate("/download-recovery-key");
			} else if (error) {
				console.error("[Auth] Signup error:", error);
				toast.error("Error creating administrator account", { description: error.message });
			} else {
				console.error("[Auth] Unknown error - no data and no error");
				toast.error("Unknown error creating administrator account");
			}
		} catch (err) {
			console.error("[Auth] Exception during signup:", err);
			toast.error("Network error creating account", {
				description: err instanceof Error ? err.message : String(err)
			});
			setSubmitting(false);
		}
	};

	return (
		<AuthLayout title="Welcome to C3i Backup ONE" description="Create the administrator account to get started">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input {...field} type="email" placeholder="you@example.com" disabled={submitting} />
								</FormControl>
								<FormDescription>Enter your email address</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="username"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Username</FormLabel>
								<FormControl>
									<Input {...field} type="text" placeholder="admin" disabled={submitting} />
								</FormControl>
								<FormDescription>Choose a username for the administrator account</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input {...field} type="password" placeholder="Enter a secure password" disabled={submitting} />
								</FormControl>
								<FormDescription>Password must be at least 8 characters.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="confirmPassword"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Confirm Password</FormLabel>
								<FormControl>
									<Input {...field} type="password" placeholder="Re-enter your password" disabled={submitting} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="w-full" loading={submitting}>
						Create admin user
					</Button>
				</form>
			</Form>
		</AuthLayout>
	);
}
