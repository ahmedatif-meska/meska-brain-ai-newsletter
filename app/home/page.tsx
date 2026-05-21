import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfileCompletion } from "@/lib/profile/completion";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { ProfileProgressCard } from "@/components/dashboard/ProfileProgressCard";

export const dynamic = "force-dynamic";

function formatName(first?: string, last?: string): string {
  return [first, last]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  let completion;
  try {
    completion = await getProfileCompletion(user.id);
  } catch (e) {
    console.error("[home] getProfileCompletion failed:", e);
    completion = {
      percent: 0 as const,
      formsCompleted: { identity: false, bioLink: false, finalize: false },
    };
  }

  const first = (user.user_metadata?.first_name as string | undefined) ?? "";
  const last = (user.user_metadata?.last_name as string | undefined) ?? "";
  const fullName = formatName(first, last);

  return (
    <div
      className="flex w-full min-w-0 max-w-full flex-1 flex-col overflow-x-hidden"
      style={{ background: "var(--dashboard-surface)", color: "var(--dashboard-text)" }}
    >
      <DashboardNav active="home" />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center overflow-x-hidden px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <h1
          className="w-full font-display font-semibold tracking-tight"
          style={{
            fontSize: "clamp(1.25rem, 3.2vw, 1.875rem)",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            overflowWrap: "anywhere",
          }}
        >
          Welcome back,{" "}
          {fullName ? (
            <span
              className="inline-block max-w-full align-bottom"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                verticalAlign: "bottom",
              }}
              title={fullName}
            >
              {fullName}
            </span>
          ) : null}{" "}
          <span aria-hidden>👋</span>
        </h1>

        <div className="mt-8 w-full max-w-md">
          <ProfileProgressCard completion={completion} />
        </div>

        <p
          className="mt-8 text-center text-sm sm:text-base"
          style={{ color: "var(--dashboard-muted)" }}
        >
          News built for you. Not for the feed.
        </p>
      </main>
    </div>
  );
}
