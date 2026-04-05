'use client'

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useAuth } from "@/providers/AuthProvider";

type RegisterFormValues = {
  name: string;
  email: string;
  mobile: string;
  password: string;
};

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
    },
  });
  const nextPath = searchParams.get("next");

  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  async function onSubmit(values: RegisterFormValues) {
    try {
      await createUser(values);
      toast.success("Account created successfully.");
      router.replace("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed.");
    }
  }

  return (
    <main className="bg-shell flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-lg border-white/60 bg-muted">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Sign up with your details to get started. After registering, you can use the same credentials to log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register("name", {
                    required: "Name is required.",
                  })}
                />
                {errors.name ? (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input id="mobile" placeholder="01700000000" {...register("mobile")} />
              </div>
            </div>

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
                placeholder="At least 6 characters"
                {...register("password", {
                  required: "Password is required.",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters.",
                  },
                })}
              />
              {errors.password ? (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              ) : null}
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href={loginHref}>Go To Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function RegisterPageFallback() {
  return (
    <main className="bg-shell flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-lg border-white/60 bg-muted">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Sign up with your details to get started. After registering, you can use the same credentials to log in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 rounded-md bg-background/70" />
          <div className="h-10 rounded-md bg-background/70" />
          <div className="h-10 rounded-md bg-background/70" />
          <div className="h-10 rounded-md bg-background/70" />
          <div className="h-10 rounded-full bg-primary/15" />
        </CardContent>
      </Card>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
