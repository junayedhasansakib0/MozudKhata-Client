import { useCurrentUser } from "@/features/auth/hooks";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { ProfileForm } from "@/features/auth/components/profile-form";

export function ProfilePage() {
  const { data: user } = useCurrentUser();

  // RequireAuth guarantees a user before this page renders.
  if (!user) return null;

  return (
    <section className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-muted-foreground">Manage your profile and password.</p>
      </div>

      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <h2 className="mb-4 text-lg font-medium">Profile</h2>
        <ProfileForm user={user} />
      </div>

      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <h2 className="mb-4 text-lg font-medium">Change password</h2>
        <ChangePasswordForm />
      </div>
    </section>
  );
}
