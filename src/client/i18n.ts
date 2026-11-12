type LanguageEntry = { id: string; label: string; file: string; homeyCodes: string[] };
type LanguageRegistry = { automatic: { label: string }; languages: LanguageEntry[]; fallback: string };

let languageRegistry: LanguageRegistry = {
  automatic: { label: "Automatic (Homey language)" },
  languages: [],
  fallback: "en",
};
const dictionaries: Record<string, Record<string, string>> = {};

export type Locale = string;
export let availableLanguages: LanguageEntry[] = [];
export let automaticLanguageLabel = languageRegistry.automatic.label;

export async function loadTranslations(): Promise<void> {
  try {
    const response = await fetch("/api/locales/registry", { cache: "no-store" });
    if (!response.ok) throw new Error("Language registry unavailable");
    const registry = await response.json() as LanguageRegistry;
    if (!Array.isArray(registry.languages) || typeof registry.fallback !== "string") {
      throw new Error("Invalid language registry");
    }
    const loaded: Record<string, Record<string, string>> = {};
    await Promise.all(registry.languages.map(async (language) => {
      if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(language.id) || !/^[a-z]{2}(-[A-Z]{2})?\.json$/.test(language.file)) return;
      const dictionaryResponse = await fetch(`/api/locales/${language.file}`, { cache: "no-store" });
      if (!dictionaryResponse.ok) return;
      loaded[language.id] = await dictionaryResponse.json() as Record<string, string>;
    }));
    if (!loaded[registry.fallback]) throw new Error("Fallback translation file unavailable");
    languageRegistry = registry;
    availableLanguages = registry.languages.filter((language) => Boolean(loaded[language.id]));
    automaticLanguageLabel = registry.automatic.label;
    Object.keys(dictionaries).forEach((key) => delete dictionaries[key]);
    Object.assign(dictionaries, loaded);
  } catch (error) {
    console.error("Could not load dashboard translations:", error);
    if (!dictionaries.en) dictionaries.en = {};
    if (!dictionaries[languageRegistry.fallback]) languageRegistry.fallback = "en";
  }
}

export function translate(locale: Locale, key: string): string {
  return dictionaries[locale]?.[key] ?? dictionaries[languageRegistry.fallback]?.[key] ?? key;
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
