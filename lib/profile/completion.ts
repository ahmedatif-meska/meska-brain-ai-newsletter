import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FormKey = "identity" | "bioLink" | "finalize";

export type ProfileCompletion = {
  percent: 0 | 33 | 66 | 100;
  formsCompleted: Record<FormKey, boolean>;
};

const TIERS = [0, 33, 66, 100] as const;

export async function getProfileCompletion(
  userId: string,
): Promise<ProfileCompletion> {
  const supabase = await createSupabaseServerClient();
  const [identity, curation, finalize] = await Promise.all([
    supabase
      .from("profile_identity")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("profile_curation")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("profile_finalize")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const formsCompleted = {
    identity: Boolean(identity.data),
    bioLink: Boolean(curation.data),
    finalize: Boolean(finalize.data),
  };
  const count =
    Number(formsCompleted.identity) +
    Number(formsCompleted.bioLink) +
    Number(formsCompleted.finalize);
  return {
    percent: TIERS[count] as ProfileCompletion["percent"],
    formsCompleted,
  };
}
