"use server";

import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  validateSignupInput,
  type FieldError,
  type SignupInput,
} from "@/lib/validation/signup";

export type SignupResult =
  | { ok: true; redirect: "/signin?signedup=1" }
  | { ok: false; errors: FieldError[] };

export async function signupWithPassword(_: unknown, formData: FormData): Promise<SignupResult> {
  const input: SignupInput = {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };

  const errors = validateSignupInput(input);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const displayName = `${input.firstName} ${input.lastName}`.trim();

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (e) {
    console.error("[signup] admin client init failed:", e);
    return {
      ok: false,
      errors: [{ field: "form", message: "Server is not configured. Try again later." }],
    };
  }

  const { error } = await supabase.auth.admin.createUser({
    email: input.email.toLowerCase(),
    password: input.password,
    email_confirm: true,
    user_metadata: {
      first_name: input.firstName,
      last_name: input.lastName,
      full_name: displayName,
      display_name: displayName,
      name: displayName,
      auth_method: "password",
    },
  });

  if (error) {
    const code = (error as { code?: string }).code;
    const status = (error as { status?: number }).status;
    const msg = error.message?.toLowerCase() ?? "";
    const isDuplicate =
      code === "email_exists" ||
      status === 422 ||
      msg.includes("already") ||
      msg.includes("registered");

    if (isDuplicate) {
      return {
        ok: false,
        errors: [
          {
            field: "email",
            message: "An account with this email already exists. Sign in instead.",
          },
        ],
      };
    }

    console.error("[signup] unexpected supabase error:", error);
    return {
      ok: false,
      errors: [{ field: "form", message: "Something went wrong. Try again." }],
    };
  }

  return { ok: true, redirect: "/signin?signedup=1" };
}
