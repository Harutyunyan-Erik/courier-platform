import { en, type Dictionary } from "./en";
import { hy } from "./hy";
import { ru } from "./ru";

export const LOCALES = ["hy", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "hy";

const dictionaries: Record<Locale, Dictionary> = { hy, ru, en };

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function getDictionary(locale: string): Dictionary {
  return dictionaries[isLocale(locale) ? locale : DEFAULT_LOCALE];
}

const DATE_LOCALES: Record<Locale, string> = { hy: "hy-AM", ru: "ru-RU", en: "en-GB" };

export function formatDate(date: Date | string, locale: string, withTime = true) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(DATE_LOCALES[isLocale(locale) ? locale : DEFAULT_LOCALE], {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: "Asia/Yerevan",
  }).format(d);
}

export type { Dictionary };
