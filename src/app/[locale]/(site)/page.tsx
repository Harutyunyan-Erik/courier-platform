import Link from "next/link";
import type { ShipmentType } from "@prisma/client";
import { getDictionary } from "@/lib/i18n";
import { quote, tariffCountries } from "@/lib/pricing";
import { TrackForm } from "@/components/TrackForm";

const icons = {
  air: "M2 16l20-6-20-6 4 6-4 6zm4-6h8",
  ground: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z",
  courier: "M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11zm0-8a3 3 0 100-6 3 3 0 000 6z",
};

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; country?: string; weight?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = getDictionary(locale);
  const countries = await tariffCountries();
  const calcType: ShipmentType = sp.type === "GROUND" ? "GROUND" : "AIR";
  const weight = Number(sp.weight);
  const result = sp.country && weight > 0 ? await quote(calcType, sp.country, weight) : undefined;

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">{t.home.heroTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-100">{t.home.heroSubtitle}</p>
          <div className="mt-8 max-w-2xl rounded-2xl bg-white/10 p-3 backdrop-blur">
            <TrackForm locale={locale} t={t} large />
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold">{t.home.servicesTitle}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {(["air", "ground", "courier"] as const).map((key) => (
            <div key={key} className="card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                  <path d={icons[key]} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">{t.home[key].title}</h3>
              <p className="mt-2 text-slate-600">{t.home[key].text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold">{t.home.whyTitle}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.why.map((w, i) => (
              <div key={i}>
                <div className="text-3xl font-bold text-accent-500">0{i + 1}</div>
                <h3 className="mt-2 font-semibold">{w.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="calculator" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">{t.home.calculatorTitle}</h2>
            <form action={`/${locale}#calculator`} method="get" className="card mt-6 space-y-4">
              <div>
                <label className="label">{t.calc.type}</label>
                <select name="type" defaultValue={calcType} className="input">
                  <option value="AIR">{t.shipmentType.AIR}</option>
                  <option value="GROUND">{t.shipmentType.GROUND}</option>
                </select>
              </div>
              <div>
                <label className="label">{t.calc.country}</label>
                <select name="country" defaultValue={sp.country} className="input" required>
                  {countries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t.calc.weight}</label>
                <input name="weight" type="number" step="0.1" min="0.1" defaultValue={sp.weight ?? "1"} className="input" required />
              </div>
              <button className="btn-primary w-full">{t.calc.calculate}</button>
            </form>
          </div>
          <div className="flex items-end">
            {result === undefined ? null : result === null ? (
              <div className="card w-full text-slate-600">{t.calc.noTariff}</div>
            ) : (
              <div className="card w-full border-brand-100 bg-brand-50">
                <div className="text-sm text-slate-600">{t.calc.price}</div>
                <div className="mt-1 text-4xl font-bold text-brand-700">
                  {result.price.toLocaleString("en-US")} {result.currency}
                </div>
                <div className="mt-4 text-sm text-slate-600">{t.calc.days}</div>
                <div className="font-semibold">
                  {result.daysMin}–{result.daysMax} {t.calc.daysUnit}
                </div>
                <Link href={`/${locale}/account/new?type=${calcType}&country=${encodeURIComponent(sp.country ?? "")}&weight=${weight}`} className="btn-accent mt-6">
                  {t.calc.orderNow}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
