"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SaveResult } from "@/lib/profile/schema";

export async function saveFinalize(
  _: unknown,
  formData: FormData,
): Promise<SaveResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // FR-038 — no validation on responseText; empty is valid.
  const responseText = String(formData.get("responseText") ?? "");

  const { error: upsertError } = await supabase.from("profile_finalize").upsert({
    user_id: user.id,
    response_text: responseText,
    submitted_at: new Date().toISOString(),
  });

  if (upsertError) {
    console.error("[saveFinalize] upsert failed:", upsertError);
    return {
      ok: false,
      errors: [{ field: "form", message: "Submission failed. Try again." }],
    };
  }

  revalidatePath("/home");
  revalidatePath("/profile");
  return { ok: true };
}
