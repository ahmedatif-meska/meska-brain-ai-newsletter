"use client";

import { useState } from "react";
import { saveCuration } from "@/app/_actions/save-curation";
import { validateExactlyThreeTopics } from "@/lib/profile/validators";
import {
  TOPICS,
  type AiUsage,
  type Channel,
  type Consumption,
  type Language,
  type MainReason,
  type ProfileCurationRow,
  type Topic,
  type WizardField,
  type WizardFieldError,
} from "@/lib/profile/schema";

type ErrorMap = Partial<Record<WizardField, string>>;

const AI_USAGE_OPTIONS: { value: AiUsage; label: string }[] = [
  { value: "just_starting", label: "Just getting started" },
  { value: "casual", label: "Casual user" },
  { value: "daily", label: "Daily user" },
  { value: "builder", label: "Builder" },
];
const MAIN_REASON_OPTIONS: { value: MainReason; label: string }[] = [
  { value: "stay_current", label: "Stay current" },
  { value: "find_tools", label: "Find tools" },
  { value: "learn_deeply", label: "Learn deeply" },
  { value: "lead_transformation", label: "Lead AI transformation" },
];
const CONSUMPTION_OPTIONS: { value: Consumption; label: string }[] = [
  { value: "quick", label: "Quick" },
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "deep", label: "Deep" },
];
const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "english", label: "English" },
  { value: "arabic", label: "Arabic" },
  { value: "both", label: "Both" },
];
const CHANNEL_OPTIONS: { value: Channel; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "email", label: "Email" },
];

const PRIMARY = "#0A72F3";
const BORDER = "#e5e7eb";
const TEXT = "#0b1220";
const MUTED = "#6b7280";

export function Form2Curation({
  initial,
  onSaved,
  onBack,
}: {
  initial: ProfileCurationRow | null;
  onSaved: () => void;
  onBack: () => void;
}) {
  const [aiUsage, setAiUsage] = useState<AiUsage | "">(initial?.ai_usage ?? "");
  const [mainReason, setMainReason] = useState<MainReason | "">(
    initial?.main_reason ?? "",
  );
  const [topics, setTopics] = useState<Topic[]>(initial?.topics ?? []);
  const [consumption, setConsumption] = useState<Consumption | "">(
    initial?.consumption ?? "",
  );
  const [language, setLanguage] = useState<Language | "">(initial?.language ?? "");
  const [channel, setChannel] = useState<Channel | "">(initial?.channel ?? "");
  const [errors, setErrors] = useState<ErrorMap>({});

  function toggleTopic(t: Topic) {
    setTopics((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 3) return prev;
      return [...prev, t];
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs: WizardFieldError[] = [];
    if (!aiUsage) errs.push({ field: "aiUsage", message: "Please make a selection." });
    if (!mainReason) errs.push({ field: "mainReason", message: "Please make a selection." });
    if (!consumption) errs.push({ field: "consumption", message: "Please make a selection." });
    if (!language) errs.push({ field: "language", message: "Please make a selection." });
    if (!channel) errs.push({ field: "channel", message: "Please make a selection." });
    const tErr = validateExactlyThreeTopics(topics);
    if (tErr) errs.push(tErr);

    if (errs.length > 0) {
      const map: ErrorMap = {};
      for (const err of errs) if (!map[err.field]) map[err.field] = err.message;
      setErrors(map);
      return;
    }
    setErrors({});

    const fd = new FormData();
    fd.set("aiUsage", aiUsage);
    fd.set("mainReason", mainReason);
    fd.set("consumption", consumption);
    fd.set("language", language);
    fd.set("channel", channel);
    fd.set("topics", JSON.stringify(topics));
    void saveCuration(null, fd).catch((e) =>
      console.error("[saveCuration] background save failed:", e),
    );
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-12">
      <header className="space-y-2">
        <h2
          className="text-xl font-semibold sm:text-2xl"
          style={{ color: TEXT }}
        >
          Your Preferences
        </h2>
        <p className="text-sm" style={{ color: MUTED }}>
          Tell us what you care about so we can send the right news.
        </p>
      </header>

      <PillSection
        title="How would you describe your current AI usage?"
        subtitle="AI fluency drives content depth + tone"
        options={AI_USAGE_OPTIONS}
        selected={aiUsage}
        onSelect={setAiUsage}
        error={errors.aiUsage}
        cols="2-4"
      />

      <PillSection
        title="What's the main reason you signed up?"
        subtitle="Primary goal determines content type mix"
        options={MAIN_REASON_OPTIONS}
        selected={mainReason}
        onSelect={setMainReason}
        error={errors.mainReason}
        cols="1-4"
      />

      <div className="space-y-4">
        <SectionHeader
          title="Which 3 topics matter most to you?"
          subtitle="Topic affinity is the core routing input"
        />
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => {
            const selected = topics.includes(t);
            const disabled = !selected && topics.length >= 3;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => toggleTopic(t)}
                className="inline-block rounded-full border px-3.5 py-1.5 text-[11px] transition-all disabled:cursor-not-allowed disabled:opacity-40"
                style={
                  selected
                    ? {
                        background: PRIMARY,
                        color: "white",
                        borderColor: PRIMARY,
                        boxShadow: "0 4px 12px rgba(10,114,243,0.2)",
                      }
                    : {
                        background: "#EEF3F8",
                        color: TEXT,
                        borderColor: BORDER,
                      }
                }
              >
                {t}
              </button>
            );
          })}
        </div>
        {errors.topics && (
          <p className="text-xs text-red-500" role="alert">
            {errors.topics}
          </p>
        )}
      </div>

      <PillSection
        title="How do you like to consume content?"
        subtitle="Depth preference shapes every variant"
        options={CONSUMPTION_OPTIONS}
        selected={consumption}
        onSelect={setConsumption}
        error={errors.consumption}
        cols="2-4"
      />

      <div
        className="rounded-2xl border p-6 sm:p-8"
        style={{ background: "rgba(248,250,252,0.5)", borderColor: "#f1f5f9" }}
      >
        <h3
          className="mb-6 text-xs font-semibold uppercase tracking-wider"
          style={{ color: MUTED }}
        >
          Delivery Preferences
        </h3>

        <div className="space-y-4">
          <SegmentedRow
            label="Language"
            options={LANGUAGE_OPTIONS}
            selected={language}
            onSelect={setLanguage}
            error={errors.language}
          />
          <SegmentedRow
            label="Channel"
            options={CHANNEL_OPTIONS}
            selected={channel}
            onSelect={setChannel}
            error={errors.channel}
          />
        </div>
      </div>

      {errors.form && (
        <p className="text-center text-xs text-red-500" role="alert">
          {errors.form}
        </p>
      )}

      <footer className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm transition-colors hover:opacity-80"
          style={{ color: MUTED }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px" }}
            aria-hidden
          >
            arrow_back
          </span>
          Back
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-3 rounded-full px-10 py-3.5 text-sm text-white shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{
            background: "var(--neon-blue-gradient)",
            boxShadow: "0 0 20px rgba(10,114,243,0.3)",
          }}
        >
          Next
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px" }}
            aria-hidden
          >
            arrow_forward
          </span>
        </button>
      </footer>
    </form>
  );
}

function SectionHeader({ title }: { title: string; subtitle?: string }) {
  return (
    <h3
      className="text-xs font-semibold uppercase tracking-wider"
      style={{ color: MUTED }}
    >
      {title}
    </h3>
  );
}

function PillSection<T extends string>({
  title,
  subtitle,
  options,
  selected,
  onSelect,
  error,
  cols,
}: {
  title: string;
  subtitle: string;
  options: { value: T; label: string }[];
  selected: T | "";
  onSelect: (v: T) => void;
  error?: string;
  cols: "2-4" | "1-4";
}) {
  const gridClass =
    cols === "2-4"
      ? "grid-cols-2 md:grid-cols-4"
      : "grid-cols-1 md:grid-cols-4";
  return (
    <div className="space-y-4">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className={`grid gap-3 ${gridClass}`}>
        {options.map((o) => {
          const isOn = selected === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={isOn}
              onClick={() => onSelect(o.value)}
              className="rounded-full border px-3 py-2.5 text-center text-xs transition-all hover:brightness-95 sm:text-sm"
              style={
                isOn
                  ? {
                      background: PRIMARY,
                      color: "white",
                      borderColor: PRIMARY,
                      boxShadow: "0 4px 12px rgba(10,114,243,0.2)",
                    }
                  : {
                      background: "#EEF3F8",
                      color: TEXT,
                      borderColor: BORDER,
                    }
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function SegmentedRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
  error,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T | "";
  onSelect: (v: T) => void;
  error?: string;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
      style={{ borderColor: BORDER, background: "#EEF3F8" }}
    >
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: MUTED }}
        >
          {label}
        </p>
        {error && (
          <p className="mt-1 text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
      <div
        className="flex w-fit rounded-full p-1"
        style={{ background: "#f1f5f9" }}
      >
        {options.map((o) => {
          const isOn = selected === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={isOn}
              onClick={() => onSelect(o.value)}
              className="rounded-full px-3.5 py-1 text-[11px] transition-all"
              style={
                isOn
                  ? {
                      background: PRIMARY,
                      color: "white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }
                  : { color: MUTED }
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
