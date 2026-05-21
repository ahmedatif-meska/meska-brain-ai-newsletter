export const REFERRAL_SOURCES = [
  "google",
  "linkedin",
  "twitter_x",
  "friend",
  "meska_community",
  "other",
] as const;
export type ReferralSource = (typeof REFERRAL_SOURCES)[number];

export const AI_USAGES = ["just_starting", "casual", "daily", "builder"] as const;
export type AiUsage = (typeof AI_USAGES)[number];

export const MAIN_REASONS = [
  "stay_current",
  "find_tools",
  "learn_deeply",
  "lead_transformation",
] as const;
export type MainReason = (typeof MAIN_REASONS)[number];

export const CONSUMPTIONS = ["quick", "short", "medium", "deep"] as const;
export type Consumption = (typeof CONSUMPTIONS)[number];

export const LANGUAGES = ["english", "arabic", "both"] as const;
export type Language = (typeof LANGUAGES)[number];

export const CHANNELS = ["whatsapp", "telegram", "email"] as const;
export type Channel = (typeof CHANNELS)[number];

export const TOPICS = [
  "Generative AI",
  "LLM Research",
  "AI Ethics",
  "Prompt Engineering",
  "Robotics",
  "AI Policy",
  "Autonomous Agents",
  "Compute Infrastructure",
  "Neuroscience",
  "Coding Assistants",
  "Voice AI",
  "Venture Capital",
  "Cybersecurity",
] as const;
export type Topic = (typeof TOPICS)[number];

export type WizardField =
  | "firstName"
  | "lastName"
  | "whatsapp"
  | "referralSource"
  | "linkedinUrl"
  | "aiUsage"
  | "mainReason"
  | "topics"
  | "consumption"
  | "language"
  | "channel"
  | "form";

export type WizardFieldError = {
  field: WizardField;
  message: string;
};

export type SaveResult =
  | { ok: true }
  | { ok: false; errors: WizardFieldError[] };

export type ProfileIdentityRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  whatsapp_e164: string;
  referral_source: ReferralSource;
  linkedin_url: string;
  updated_at: string;
};

export type ProfileCurationRow = {
  user_id: string;
  ai_usage: AiUsage;
  main_reason: MainReason;
  topics: Topic[];
  consumption: Consumption;
  language: Language;
  channel: Channel;
  updated_at: string;
};

export type ProfileFinalizeRow = {
  user_id: string;
  response_text: string;
  submitted_at: string;
};
