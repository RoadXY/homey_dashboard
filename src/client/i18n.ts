import registry from "./locales/languages.json";

type LanguageEntry = { id: string; label: string; file: string; homeyCodes: string[] };
type LanguageRegistry = { automatic: { label: string }; languages: LanguageEntry[]; fallback: string };

const languageRegistry = registry as LanguageRegistry;
const translationFiles = import.meta.glob<Record<string, string>>("./locales/*.json", {
  eager: true,
  import: "default",
});
const dictionaries: Record<string, Record<string, string>> = Object.fromEntries(
  languageRegistry.languages.flatMap((language) => {
    const module = translationFiles[`./locales/${language.file}`];
    return module ? [[language.id, module]] : [];
  }),
);
const fallbackDictionary = dictionaries[languageRegistry.fallback] ?? {};

export type Locale = string;
export const availableLanguages = languageRegistry.languages;
export const automaticLanguageLabel = languageRegistry.automatic.label;

export function translate(locale: Locale, key: string): string {
  return dictionaries[locale]?.[key] ?? fallbackDictionary[key] ?? key;
}

export function resolveLocale(language: string, homeyLanguage?: string | null): Locale {
  if (language !== "automatic") {
    return availableLanguages.some((entry) => entry.id === language)
      ? language
      : languageRegistry.fallback;
  }
  const detected = homeyLanguage?.toLowerCase();
  const match = detected && availableLanguages.find((entry) =>
    entry.homeyCodes.some((code) => code.toLowerCase() === detected || detected.startsWith(code.toLowerCase() + "-")),
  );
  return match?.id ?? languageRegistry.fallback;
}
