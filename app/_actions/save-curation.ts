"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateExactlyThreeTopics } from "@/lib/profile/validators";
import {
  AI_USAGES,
  CHANNELS,
  CONSUMPTIONS,
  LANGUAGES,
  MAIN_REASONS,
  type AiUsage,
  type Channel,
  type Consumption,
  type Language,
  type MainReason,
  type SaveResult,
  type Topic,
  type WizardField,
  type WizardFieldError,
} from "@/lib/profile/schema";

export async function saveCuration(
  _: unknown,
  formData: FormData,
): Promise<SaveResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const aiUsage = String(formData.get("aiUsage") ?? "");
  const mainReason = String(formData.get("mainReason") ?? "");
  const consumption = String(formData.get("consumption") ?? "");
  const language = String(formData.get("language") ?? "");
  const channel = String(formData.get("channel") ?? "");
  const topicsRaw = String(formData.get("topics") ?? "[]");

  let topics: unknown;
  try {
    topics = JSON.parse(topicsRaw);
  } catch {
    topics = null;
  }

  const errors: WizardFieldError[] = [];
  const requireSelect = (
    value: string,
    allowed: readonly string[],
    field: WizardField,
  ) => {
    if (!value) {
      errors.push({ field, message: "Please make a selection." });
      return;
    }
    if (!allowed.includes(value)) {
      errors.push({ field, message: "Invalid selection." });
    }
  };
  requireSelect(aiUsage, AI_USAGES, "aiUsage");
  requireSelect(mainReason, MAIN_REASONS, "mainReason");
  requireSelect(consumption, CONSUMPTIONS, "consumption");
  requireSelect(language, LANGUAGES, "language");
  requireSelect(channel, CHANNELS, "channel");

  const topicsErr = validateExactlyThreeTopics(topics);
  if (topicsErr) errors.push(topicsErr);

  if (errors.length > 0) return { ok: false, errors };

  const { error: upsertError } = await supabase.from("profile_curation").upsert({
    user_id: user.id,
    ai_usage: aiUsage as AiUsage,
    main_reason: mainReason as MainReason,
    topics: topics as Topic[],
    consumption: consumption as Consumption,
    language: language as Language,
    channel: channel as Channel,
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    console.error("[saveCuration] upsert failed:", upsertError);
    return {
      ok: false,
      errors: [{ field: "form", message: "Save failed. Try again." }],
    };
  }

  revalidatePath("/home");
  revalidatePath("/profile");
  return { ok: true };
}
