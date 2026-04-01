'use client'

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { PageIntro } from "@/components/layout/page-intro";
import { LoadingState } from "@/components/shared/loading-state";
import { getCurrentAppUser } from "@/lib/api/auth";
import { updateCurrentUserProfile } from "@/lib/api/users";
import { queryKeys } from "@/lib/query/keys";
import { useAuth } from "@/providers/AuthProvider";

type ProfileFormValues = {
  name: string;
  mobile: string;
  profileImage: string;
};

export default function UserProfilePage() {
  const queryClient = useQueryClient();
  const { appUser, setResolvedAppUser, user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name: "",
      mobile: "",
      profileImage: "",
    },
  });

  const currentUserQuery = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => getCurrentAppUser(),
    initialData: appUser ?? undefined,
    enabled: Boolean(user),
  });

  const profile = currentUserQuery.data ?? null;

  useEffect(() => {
    if (!profile) {
      return;
    }

    setResolvedAppUser(profile);
    reset({
      name: profile.name ?? "",
      mobile: profile.mobile ?? "",
      profileImage: profile.profileImage ?? "",
    });
  }, [profile, reset, setResolvedAppUser]);

  const updateProfileMutation = useMutation({
    mutationFn: updateCurrentUserProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(queryKeys.currentUser, updatedProfile);
      setResolvedAppUser(updatedProfile);
      reset({
        name: updatedProfile.name ?? "",
        mobile: updatedProfile.mobile ?? "",
        profileImage: updatedProfile.profileImage ?? "",
      });
      toast.success("Profile updated.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    await updateProfileMutation.mutateAsync({
        name: values.name.trim(),
        ...(values.mobile.trim() ? { mobile: values.mobile.trim() } : {}),
        ...(values.profileImage.trim()
          ? { profileImage: values.profileImage.trim() }
          : {}),
      });
  }

  if (currentUserQuery.isPending) {
    return <LoadingState label="Loading your profile..." />;
  }

  if (currentUserQuery.isError) {
    return <LoadingState label="We couldn't load your profile." />;
  }

  if (!profile) {
    return <LoadingState label="We couldn't load your profile." />;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <PageIntro
        eyebrow="Profile"
        title="Your profile"
        description="This page reads and updates your backend profile through `/users/me`."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
            <CardDescription>
              Update the fields managed by the backend profile record.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
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
                <Input
                  id="mobile"
                  placeholder="01700000000"
                  {...register("mobile")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileImage">Profile image URL</Label>
                <Input
                  id="profileImage"
                  placeholder="https://example.com/photo.jpg"
                  {...register("profileImage")}
                />
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting || updateProfileMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
            <CardDescription>
              Read-only values resolved from Firebase and the backend profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-700">
            <div className="space-y-1">
              <p className="text-zinc-500">Email</p>
              <p className="font-medium text-zinc-950">{profile.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-500">Role</p>
              <p className="font-medium text-zinc-950">{profile.role}</p>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-500">Firebase UID</p>
              <p className="break-all font-medium text-zinc-950">{profile.firebaseUid}</p>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-500">Balance</p>
              <p className="font-medium text-zinc-950">{String(profile.balance)}</p>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-500">Auth email</p>
              <p className="font-medium text-zinc-950">{user?.email ?? profile.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
