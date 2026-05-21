"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateName } from "@/lib/validation/signup";
import {
  validateLinkedInUrl,
  validateWhatsappE164,
} from "@/lib/profile/validators";
import {
  REFERRAL_SOURCES,
  type ReferralSource,
  type SaveResult,
  type WizardFieldError,
} from "@/lib/profile/schema";

const REFERRAL_SET = new Set<string>(REFERRAL_SOURCES);

export async function saveIdentity(
  _: unknown,
  formData: FormData,
): Promise<SaveResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const referralSourceRaw = String(formData.get("referralSource") ?? "").trim();
  const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim();

  const errors: WizardFieldError[] = [];

  const firstErr = validateName(firstName, "firstName", "First name");
  if (firstErr) errors.push({ field: "firstName", message: firstErr.message });
  const lastErr = validateName(lastName, "lastName", "Last name");
  if (lastErr) errors.push({ field: "lastName", message: lastErr.message });

  const waErr = validateWhatsappE164(whatsapp);
  if (waErr) errors.push(waErr);

  if (!referralSourceRaw) {
    errors.push({
      field: "referralSource",
      message: "Please select how you heard about us.",
    });
  } else if (!REFERRAL_SET.has(referralSourceRaw)) {
    errors.push({
      field: "referralSource",
      message: "Invalid referral source.",
    });
  }

  const liErr = validateLinkedInUrl(linkedinUrl);
  if (liErr) errors.push(liErr);

  if (errors.length > 0) return { ok: false, errors };

  const referralSource = referralSourceRaw as ReferralSource;

  const { error: upsertError } = await supabase.from("profile_identity").upsert({
    user_id: user.id,
    first_name: firstName,
    last_name: lastName,
    whatsapp_e164: whatsapp,
    referral_source: referralSource,
    linkedin_url: linkedinUrl,
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    console.error("[saveIdentity] upsert failed:", upsertError);
    return {
      ok: false,
      errors: [{ field: "form", message: "Save failed. Try again." }],
    };
  }

  const displayName = `${firstName} ${lastName}`.trim();
  try {
    const admin = createSupabaseAdminClient();
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: displayName,
        display_name: displayName,
        name: displayName,
        auth_method:
          (user.user_metadata?.auth_method as string | undefined) ?? "password",
      },
    });
  } catch (e) {
    // Profile row saved; name metadata will catch up on next sign-in.
    console.error("[saveIdentity] admin metadata update failed:", e);
  }

  revalidatePath("/home");
  revalidatePath("/profile");
  return { ok: true };
}
