'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDashboardRoute } from "@/lib/auth/routes";
import { useAuth } from "@/providers/AuthProvider";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setNextPath(search.get("next"));
  }, []);

  async function handleSuccess() {
    router.replace(nextPath || getDashboardRoute());
  }

  async function onSubmit(values: LoginFormValues) {
    try {
      await signIn(values.email, values.password);
      toast.success("Signed in successfully.");
      await handleSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed.");
    }
  }

  async function onGoogleLogin() {
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      toast.success("Signed in with Google.");
      await handleSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google login failed.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <main className="bg-shell flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md border-white/60 bg-card/94">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Sign in with Firebase, then hydrate the matching app user from the backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email", {
                  required: "Email is required.",
                })}
              />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password", {
                  required: "Password is required.",
                })}
              />
              {errors.password ? (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              ) : null}
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting || googleLoading}>
              <LogIn className="size-4" />
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <Button
            className="w-full"
            variant="secondary"
            type="button"
            onClick={onGoogleLogin}
            disabled={isSubmitting || googleLoading}
          >
            <Compass className="size-4" />
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </Button>

          <p className="text-sm text-muted-foreground">
            Need an account?{" "}
            <Link href="/register" className="font-medium text-primary-foreground underline">
              Register here
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
