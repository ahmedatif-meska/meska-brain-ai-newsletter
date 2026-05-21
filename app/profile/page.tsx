import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { ProfileWizard } from "./_wizard/ProfileWizard";
import type {
  ProfileIdentityRow,
  ProfileCurationRow,
  ProfileFinalizeRow,
} from "@/lib/profile/schema";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const [identityRes, curationRes, finalizeRes] = await Promise.all([
    supabase.from("profile_identity").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("profile_curation").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("profile_finalize").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const firstNameDefault =
    (user.user_metadata?.first_name as string | undefined) ?? "";
  const lastNameDefault =
    (user.user_metadata?.last_name as string | undefined) ?? "";

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        background: "var(--dashboard-surface)",
        color: "var(--dashboard-text)",
      }}
    >
      <DashboardNav active="profile" />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 sm:pt-12">
        <ProfileWizard
          firstNameDefault={firstNameDefault}
          lastNameDefault={lastNameDefault}
          initial={{
            identity: (identityRes.data ?? null) as ProfileIdentityRow | null,
            curation: (curationRes.data ?? null) as ProfileCurationRow | null,
            finalize: (finalizeRes.data ?? null) as ProfileFinalizeRow | null,
          }}
        />
      </main>
    </div>
  );
}
