import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { useUpdateProfile } from "../hooks";
import { profileSchema, type ProfileValues } from "../schema";
import type { User } from "../types";

export function ProfileForm({ user }: { user: User }) {
  const updateProfile = useUpdateProfile();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name ?? "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const name = values.name.trim();
    await updateProfile.mutateAsync({ name: name === "" ? null : name });
  });

  const rootError =
    updateProfile.error instanceof ApiError ? updateProfile.error.message : null;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="profile-email">Email</Label>
        <Input
          id="profile-email"
          value={user.email}
          readOnly
          aria-readonly="true"
          className="bg-muted text-muted-foreground"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Name</Label>
        <Input
          id="profile-name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "profile-name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="profile-name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      {rootError && (
        <p role="alert" className="text-sm text-destructive">
          {rootError}
        </p>
      )}
      {updateProfile.isSuccess && !isDirty && (
        <p className="text-sm text-primary">Profile saved.</p>
      )}

      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
