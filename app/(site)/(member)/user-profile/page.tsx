'use client'

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Check, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";
import { Spinner } from "@/components/ui/spinner";
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
import { Separator } from "@/components/ui/separator"

type ProfileFormValues = {
  name: string;
  mobile: string;
  profileImage: string;
};

export default function UserProfilePage() {
  const queryClient = useQueryClient();
  const { appUser, setResolvedAppUser, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
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
      setIsEditing(false);
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

  const onSubmit = async (values: ProfileFormValues) => {
    await updateProfileMutation.mutateAsync({
      name: values.name.trim(),
      ...(values.mobile.trim() ? { mobile: values.mobile.trim() } : {}),
      ...(values.profileImage.trim()
        ? { profileImage: values.profileImage.trim() }
        : {}),
    });
  };

  const handleEditStart = () => {
    reset({
      name: profile?.name ?? "",
      mobile: profile?.mobile ?? "",
      profileImage: profile?.profileImage ?? "",
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    reset({
      name: profile?.name ?? "",
      mobile: profile?.mobile ?? "",
      profileImage: profile?.profileImage ?? "",
    });
    setIsEditing(false);
  };

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
    <main className="mx-auto md:w-100 flex w-full items-center max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
      <PageIntro
        title="Your Profile"
        description="View and update your proifle information, including your name, contact details and profile picture."
      />
      <Card className="md:w-100">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>{isEditing ? "Edit Profile" : "Profile Details"}</CardTitle>
              <CardDescription>
                {isEditing
                  ? "Update your user prifile information and save changes."
                  : "Here are your profile details. Edit them by clicking the edit button."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    size="icon"
                    aria-label="Confirm Changes"
                    title="Confirm Changes"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting || updateProfileMutation.isPending}
                  >
                    {isSubmitting || updateProfileMutation.isPending ? (
                      <Spinner className="size-4" />
                    ) : (
                      <Check />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Cancel Editing"
                    title="Cancel Editing"
                    onClick={handleEditCancel}
                    disabled={isSubmitting || updateProfileMutation.isPending}
                  >
                    <X />
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Edit Profile"
                  title="Edit Profile"
                  onClick={handleEditStart}
                >
                  <Pencil />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                disabled={!isEditing}
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

            <Label htmlFor="name">Mobile Number</Label>
            <Input
              disabled={!isEditing}
              id="mobile"
              placeholder="01700000000"
              {...register("mobile")}
            />

            <div className="space-y-2">
              <Label htmlFor="profileImage">Profile Image URL</Label>
              <Input
                disabled={!isEditing}
                id="profileImage"
                placeholder="https://example.com/photo.jpg"
                {...register("profileImage")}
              />
            </div>
          </form>
          <Separator className="my-6" />
          <div className="space-y-3">
            <div>
              <p className="text-zinc-500">Email</p>
              <p className="font-medium text-sm text-zinc-950">{profile.email}</p>
            </div>

            <div>
              <p className="text-zinc-500">Role</p>
              <p className="font-medium text-sm text-zinc-950">{profile.role}</p>
            </div>

            <div>
              <p className="text-zinc-500">Balance</p>
              <p className="font-medium text-sm text-zinc-950">{String(profile.balance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
