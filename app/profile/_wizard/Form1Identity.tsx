"use client";

import { useMemo, useState } from "react";
import { saveIdentity } from "@/app/_actions/save-identity";
import { validateName } from "@/lib/validation/signup";
import {
  validateLinkedInUrl,
  validateWhatsappE164,
} from "@/lib/profile/validators";
import {
  REFERRAL_SOURCES,
  type ProfileIdentityRow,
  type WizardField,
  type WizardFieldError,
} from "@/lib/profile/schema";

const REFERRAL_SET = new Set<string>(REFERRAL_SOURCES);

type ErrorMap = Partial<Record<WizardField, string>>;

const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: "+20", label: "🇪🇬 +20" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+966", label: "🇸🇦 +966" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+90", label: "🇹🇷 +90" },
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+62", label: "🇮🇩 +62" },
  { code: "+234", label: "🇳🇬 +234" },
  { code: "+27", label: "🇿🇦 +27" },
  { code: "+212", label: "🇲🇦 +212" },
  { code: "+961", label: "🇱🇧 +961" },
  { code: "+962", label: "🇯🇴 +962" },
  { code: "+965", label: "🇰🇼 +965" },
  { code: "+974", label: "🇶🇦 +974" },
  { code: "+973", label: "🇧🇭 +973" },
  { code: "+968", label: "🇴🇲 +968" },
  { code: "+86", label: "🇨🇳 +86" },
  { code: "+81", label: "🇯🇵 +81" },
];

const REFERRAL_OPTIONS: { value: string; label: string }[] = [
  { value: "google", label: "Google" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter_x", label: "Twitter / X" },
  { value: "friend", label: "Friend" },
  { value: "meska_community", label: "Meska Community" },
  { value: "other", label: "Other" },
];

function splitWhatsapp(e164: string): { code: string; rest: string } {
  if (!e164) return { code: "+20", rest: "" };
  const match = COUNTRY_CODES.find((c) => e164.startsWith(c.code));
  if (match) return { code: match.code, rest: e164.slice(match.code.length) };
  const fallback = e164.match(/^(\+\d{1,4})(.*)$/);
  return fallback
    ? { code: fallback[1], rest: fallback[2] }
    : { code: "+20", rest: e164.replace(/^\+/, "") };
}

const INPUT_BASE =
  "rounded-xl border bg-[#EEF3F8] px-3.5 py-3 text-sm outline-none transition-colors focus:ring-2";

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    borderColor: hasError ? "var(--error-border)" : "var(--dashboard-track)",
    color: "var(--dashboard-text)",
    // @ts-expect-error custom property for tailwind ring color
    "--tw-ring-color": "rgba(10,114,243,0.35)",
  };
}

export function Form1Identity({
  firstNameDefault,
  lastNameDefault,
  initial,
  onSaved,
}: {
  firstNameDefault: string;
  lastNameDefault: string;
  initial: ProfileIdentityRow | null;
  onSaved: () => void;
}) {
  const initialPhone = useMemo(
    () => splitWhatsapp(initial?.whatsapp_e164 ?? ""),
    [initial?.whatsapp_e164],
  );

  const [firstName, setFirstName] = useState(firstNameDefault);
  const [lastName, setLastName] = useState(lastNameDefault);
  const [waCode, setWaCode] = useState(initialPhone.code);
  const [waRest, setWaRest] = useState(initialPhone.rest);
  const [referralSource, setReferralSource] = useState(
    initial?.referral_source ?? "",
  );
  const [linkedinUrl, setLinkedinUrl] = useState(initial?.linkedin_url ?? "");
  const [errors, setErrors] = useState<ErrorMap>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const whatsapp = `${waCode}${waRest.replace(/[^\d]/g, "")}`;
    const errs: WizardFieldError[] = [];
    const fnErr = validateName(firstName, "firstName", "First name");
    if (fnErr) errs.push({ field: "firstName", message: fnErr.message });
    const lnErr = validateName(lastName, "lastName", "Last name");
    if (lnErr) errs.push({ field: "lastName", message: lnErr.message });
    const waErr = validateWhatsappE164(whatsapp);
    if (waErr) errs.push(waErr);
    if (!referralSource) {
      errs.push({ field: "referralSource", message: "Please select how you heard about us." });
    } else if (!REFERRAL_SET.has(referralSource)) {
      errs.push({ field: "referralSource", message: "Invalid referral source." });
    }
    const liErr = validateLinkedInUrl(linkedinUrl);
    if (liErr) errs.push(liErr);

    if (errs.length > 0) {
      const map: ErrorMap = {};
      for (const err of errs) if (!map[err.field]) map[err.field] = err.message;
      setErrors(map);
      return;
    }

    setErrors({});
    const fd = new FormData();
    fd.set("firstName", firstName);
    fd.set("lastName", lastName);
    fd.set("whatsapp", whatsapp);
    fd.set("referralSource", referralSource);
    fd.set("linkedinUrl", linkedinUrl);
    // Fire-and-forget: advance UI now, persist in background.
    void saveIdentity(null, fd).catch((e) =>
      console.error("[saveIdentity] background save failed:", e),
    );
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <header className="space-y-2">
        <h2
          className="text-xl font-semibold sm:text-2xl"
          style={{ color: "var(--dashboard-text)" }}
        >
          Personal Information
        </h2>
        <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
          Define your digital signature. This metadata helps Meska Brain calibrate
          its cognitive filters for you.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First Name" required error={errors.firstName}>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            className={INPUT_BASE + " w-full"}
            style={inputStyle(Boolean(errors.firstName))}
          />
        </Field>
        <Field label="Last Name" required error={errors.lastName}>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            className={INPUT_BASE + " w-full"}
            style={inputStyle(Boolean(errors.lastName))}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="WhatsApp" required error={errors.whatsapp}>
            <div className="flex items-stretch gap-2">
              <select
                value={waCode}
                onChange={(e) => setWaCode(e.target.value)}
                className={INPUT_BASE + " w-24 shrink-0 !px-2"}
                style={inputStyle(false)}
                aria-label="Country code"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={waRest}
                onChange={(e) => setWaRest(e.target.value)}
                placeholder="1001234567"
                autoComplete="tel-national"
                className={INPUT_BASE + " w-full flex-1 min-w-0"}
                style={inputStyle(Boolean(errors.whatsapp))}
              />
            </div>
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field
            label="How did you hear about us?"
            required
            error={errors.referralSource}
          >
            <select
              value={referralSource}
              onChange={(e) => setReferralSource(e.target.value)}
              className={INPUT_BASE + " w-full"}
              style={inputStyle(Boolean(errors.referralSource))}
            >
              <option value="" disabled>
                Select…
              </option>
              {REFERRAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="LinkedIn URL" required error={errors.linkedinUrl}>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/your-handle"
              autoComplete="url"
              className={INPUT_BASE + " w-full"}
              style={inputStyle(Boolean(errors.linkedinUrl))}
            />
          </Field>
        </div>
      </div>

      {errors.form && (
        <p className="text-center text-xs text-red-500" role="alert">
          {errors.form}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
          style={{ background: "var(--neon-blue-gradient)" }}
        >
          Next Step
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }} aria-hidden>
            arrow_forward
          </span>
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span
        className="block text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--dashboard-muted)" }}
      >
        {label}
        {required && (
          <>
            {" "}
            <span className="text-red-500" aria-hidden>
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        )}
      </span>
      {children}
      {error && (
        <span className="block text-xs text-red-500" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
