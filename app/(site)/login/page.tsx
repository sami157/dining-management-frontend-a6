'use client'

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, LogIn, ShieldCheck, UserRound } from "lucide-react";
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

const demoCredentials = [
  {
    label: "Demo User",
    email: "user@dining.com",
    password: "621082aA",
    icon: UserRound,
  },
  {
    label: "Demo Admin",
    email: "manager@dining.com",
    password: "621082aA",
    icon: ShieldCheck,
  },
];

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithGoogle, refreshAppUser } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoadingEmail, setDemoLoadingEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const nextPath = searchParams.get("next");

  const registerHref = nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register";

  function fillDemoCredentials(email: string, password: string) {
    setValue("email", email, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("password", password, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  async function handleSuccess() {
    const resolvedAppUser = await refreshAppUser();
    router.replace(nextPath || getDashboardRoute(resolvedAppUser?.role));
  }

  async function loginWithDemoCredentials(email: string, password: string) {
    fillDemoCredentials(email, password);
    setDemoLoadingEmail(email);

    try {
      await signIn(email, password);
      toast.success("Signed in with demo account.");
      await handleSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Demo login failed.");
    } finally {
      setDemoLoadingEmail(null);
    }
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
      <Card className="w-full max-w-md border-white/60 bg-muted">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Sign in with your email and password or continue with Google.
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

          <div className="rounded-lg border border-dashed border-primary/35 bg-background/70 p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground">Demo Access</p>
              <p className="text-xs leading-5 text-muted-foreground">
                Fill the form and sign in with a sample account.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {demoCredentials.map((credential) => {
                const Icon = credential.icon;

                return (
                  <Button
                    key={credential.email}
                    type="button"
                    variant="outline"
                    className="cursor-pointer justify-start gap-2 bg-card hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    onClick={() => loginWithDemoCredentials(credential.email, credential.password)}
                    disabled={isSubmitting || googleLoading || Boolean(demoLoadingEmail)}
                  >
                    <Icon className="size-4" />
                    {demoLoadingEmail === credential.email ? "Signing In..." : credential.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-center text-sm text-muted-foreground">
              Need an account?
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href={registerHref}>Go To Registration</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function LoginPageFallback() {
  return (
    <main className="bg-shell flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md border-white/60 bg-muted">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Sign in with your email and password or continue with Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 rounded-md bg-background/70" />
          <div className="h-10 rounded-md bg-background/70" />
          <div className="h-10 rounded-full bg-primary/15" />
          <div className="h-10 rounded-full bg-secondary/80" />
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
