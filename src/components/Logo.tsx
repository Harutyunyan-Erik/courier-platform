import { site } from "@/lib/site";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-brand-600" />
        <path d="M7 19.5 25 9l-5.5 14-3.2-5.2L7 19.5Z" fill="#fff" />
        <path d="m16.3 17.8 3.2 5.2 1-6.6-4.2 1.4Z" className="fill-accent-400" />
      </svg>
      <span className={`text-lg font-bold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>{site.name}</span>
    </span>
  );
}
