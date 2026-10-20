import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { adapters } from "@/lib/carriers";
import { saveCarrier } from "@/app/actions/admin";

export default async function CarriersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  await requireUser(locale, ["SUPER_ADMIN"]);
  const carriers = await prisma.carrier.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { shipments: true } } } });
  const adapterOptions = [{ id: "manual", label: t.admin.manualOnly }, ...Object.values(adapters).map((a) => ({ id: a.id, label: a.label }))];

  const row = (c?: (typeof carriers)[number]) => (
    <form action={saveCarrier.bind(null, locale)} className="grid items-center gap-3 md:grid-cols-[100px_1fr_1fr_auto_auto_auto]">
      {c && <input type="hidden" name="id" value={c.id} />}
      <input name="code" defaultValue={c?.code} placeholder="CODE" required className="input font-mono" />
      <input name="name" defaultValue={c?.name} placeholder={t.admin.carrier} required className="input" />
      <select name="adapter" defaultValue={c?.adapter ?? "manual"} className="input">
        {adapterOptions.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
      </select>
      <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="active" defaultChecked={c?.active ?? true} /> {t.admin.activeLabel}</label>
      <span className="text-xs">
        {c && c.adapter !== "manual" && (adapters[c.adapter]?.isConfigured() ? <span className="text-emerald-700">✓ {t.admin.configured}</span> : <span className="text-amber-700">⚠ {t.admin.notConfigured}</span>)}
      </span>
      <button className="btn-secondary">{c ? t.admin.save : t.admin.create}</button>
    </form>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.admin.carriers}</h1>
      <div className="card space-y-3">
        {carriers.map((c) => <div key={c.id}>{row(c)}</div>)}
        <div className="border-t border-slate-200 pt-3">{row()}</div>
      </div>
      <p className="max-w-3xl text-sm text-slate-500">
        API keys are set as environment variables on the server (see .env.example): DHL_API_KEY, FEDEX_CLIENT_ID / FEDEX_CLIENT_SECRET, UPS_CLIENT_ID / UPS_CLIENT_SECRET, TRACK17_API_KEY.
      </p>
    </div>
  );
}
