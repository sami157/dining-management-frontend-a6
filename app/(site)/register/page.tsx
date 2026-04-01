'use client'

import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function RegisterPage() {
  const router = useRouter();
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

  async function onSubmit(values: RegisterFormValues) {
    try {
      await createUser(values);
      toast.success("Account created and synced with backend.");
      router.replace("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed.");
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-100 px-6 py-16">
      <Card className="w-full max-w-lg border-white/70 bg-white/95 shadow-xl shadow-zinc-300/35">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            This registers the Firebase user first, then syncs the app user profile to the backend.
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
                  <p className="text-sm text-rose-600">{errors.name.message}</p>
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
                <p className="text-sm text-rose-600">{errors.email.message}</p>
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
                <p className="text-sm text-rose-600">{errors.password.message}</p>
              ) : null}
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-zinc-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-zinc-950 underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
