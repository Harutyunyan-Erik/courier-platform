import { prisma } from "@/lib/db";
import { MANAGER_ROLES, requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { saveTariff } from "@/app/actions/admin";

export default async function TariffsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  await requireUser(locale, MANAGER_ROLES);
  const tariffs = await prisma.tariff.findMany({ orderBy: [{ type: "asc" }, { destCountry: "asc" }] });

  const row = (x?: (typeof tariffs)[number]) => (
    <form action={saveTariff.bind(null, locale)} className="grid items-center gap-2 md:grid-cols-[110px_1fr_110px_110px_80px_70px_70px_auto_auto]">
      {x && <input type="hidden" name="id" value={x.id} />}
      <select name="type" defaultValue={x?.type ?? "AIR"} className="input">
        <option value="AIR">{t.shipmentType.AIR}</option>
        <option value="GROUND">{t.shipmentType.GROUND}</option>
      </select>
      <input name="destCountry" defaultValue={x?.destCountry} placeholder={t.order.country} required className="input" />
      <input name="baseFee" type="number" defaultValue={x?.baseFee.toString()} placeholder={t.admin.baseFee} className="input" title={t.admin.baseFee} />
      <input name="pricePerKg" type="number" defaultValue={x?.pricePerKg.toString()} placeholder={t.admin.perKg} className="input" title={t.admin.perKg} />
      <select name="currency" defaultValue={x?.currency ?? "AMD"} className="input">
        {["AMD", "USD", "EUR", "RUB"].map((c) => <option key={c}>{c}</option>)}
      </select>
      <input name="daysMin" type="number" defaultValue={x?.daysMin ?? 1} className="input" title={t.admin.days} />
      <input name="daysMax" type="number" defaultValue={x?.daysMax ?? 3} className="input" title={t.admin.days} />
      <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="active" defaultChecked={x?.active ?? true} /> {t.admin.activeLabel}</label>
      <button className="btn-secondary">{x ? t.admin.save : t.admin.addTariff}</button>
    </form>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.admin.tariffs}</h1>
      <div className="card space-y-2 overflow-x-auto">
        <div className="hidden gap-2 text-xs font-medium text-slate-500 md:grid md:grid-cols-[110px_1fr_110px_110px_80px_70px_70px_auto_auto]">
          <span>{t.admin.type}</span><span>{t.order.country}</span><span>{t.admin.baseFee}</span><span>{t.admin.perKg}</span><span></span><span>{t.admin.days} min</span><span>max</span>
        </div>
        {tariffs.map((x) => <div key={x.id}>{row(x)}</div>)}
        <div className="border-t border-slate-200 pt-3">{row()}</div>
      </div>
    </div>
  );
}
