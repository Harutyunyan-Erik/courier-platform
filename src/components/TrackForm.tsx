import type { Dictionary } from "@/lib/i18n";

export function TrackForm({ locale, t, defaultValue, large = false }: { locale: string; t: Dictionary; defaultValue?: string; large?: boolean }) {
  return (
    <form action={`/${locale}/track`} method="get" className="flex w-full flex-col gap-2 sm:flex-row">
      <input
        name="n"
        required
        defaultValue={defaultValue}
        placeholder={t.home.trackPlaceholder}
        className={`input flex-1 ${large ? "h-14 text-base" : ""}`}
        autoComplete="off"
      />
      <button className={`btn-accent ${large ? "h-14 px-8 text-base" : ""}`}>{t.home.trackButton}</button>
    </form>
  );
}
