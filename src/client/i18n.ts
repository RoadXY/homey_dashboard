import nl from "./locales/nl.json";
import en from "./locales/en.json";

export type Locale = "nl" | "en";
const dictionaries: Record<Locale, Record<string, string>> = { nl, en };

export function translate(locale: Locale, key: string): string {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
}

export function resolveLocale(language: string, homeyLanguage?: string | null): Locale {
  if (language === "nl-NL") return "nl";
  if (language === "en") return "en";
  return homeyLanguage?.toLowerCase().startsWith("nl") ? "nl" : "en";
}
