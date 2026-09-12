export const VISUAL_THEME_STORAGE_KEY = "quiz-zen-visual-theme-v1";

export const VISUAL_THEME_IDS = [
  "fantasy",
  "mediterranean",
  "okinawa",
  "hokkaido",
  "halloween",
  "new-year",
  "christmas",
  "hanami",
  "event-horizon",
] as const;

export type VisualThemeId = (typeof VISUAL_THEME_IDS)[number];

const visualThemeSet = new Set<string>(VISUAL_THEME_IDS);

export function normalizeVisualTheme(value: string | null): VisualThemeId {
  return value && visualThemeSet.has(value) ? value as VisualThemeId : "mediterranean";
}

export function applyStoredVisualTheme(): VisualThemeId {
  let storedTheme: string | null = null;
  try {
    storedTheme = localStorage.getItem(VISUAL_THEME_STORAGE_KEY);
  } catch {
    // The default theme still works when browser storage is unavailable.
  }
  const theme = normalizeVisualTheme(storedTheme);
  document.documentElement.dataset.theme = theme;
  return theme;
}
