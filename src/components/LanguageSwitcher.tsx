"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LOCALES } from "@/lib/i18n";

const LABELS: Record<string, string> = { hy: "ՀԱՅ", ru: "РУС", en: "ENG" };

export function LanguageSwitcher({ current }: { current: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const rest = pathname.split("/").slice(2).join("/");
  return (
    <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest ? `/${rest}` : ""}${search ? `?${search}` : ""}`}
          className={`rounded-md px-2 py-1 ${l === current ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
        >
          {LABELS[l]}
        </Link>
      ))}
    </div>
  );
}
