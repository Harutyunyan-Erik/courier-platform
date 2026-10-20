import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatDate, getDictionary } from "@/lib/i18n";
import { normalizeTrackingInput } from "@/lib/tracking-number";
import { PROGRESS_STEPS, progressIndex } from "@/lib/statuses";
import { TrackForm } from "@/components/TrackForm";
import { StatusBadge } from "@/components/StatusBadge";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: getDictionary((await params).locale).track.title };
}

export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ n?: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const number = normalizeTrackingInput((await searchParams).n ?? "");

  // Customers may search by our number or by the partner carrier's number.
  const shipment = number
    ? await prisma.shipment.findFirst({
        where: { OR: [{ trackingNumber: number }, { carrierTrackingNumber: number }] },
        include: {
          carrier: true,
          events: { where: { hidden: false, isPublic: true }, orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }] },
        },
      })
    : null;

  const step = shipment ? progressIndex(shipment.currentStatus) : -1;
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t.track.title}</h1>
      <div className="mt-6">
        <TrackForm locale={locale} t={t} defaultValue={number} />
      </div>

      {number && !shipment && <div className="card mt-8 text-slate-600">{t.track.notFound}</div>}

      {shipment && (
        <div className="mt-8 space-y-6">
          <div className="card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm text-slate-500">Tracking</div>
                <div className="font-mono text-2xl font-bold">{shipment.trackingNumber}</div>
              </div>
              <StatusBadge status={shipment.currentStatus} t={t} />
            </div>

            {step >= 0 && (
              <ol className="mt-8 grid grid-cols-5 gap-2">
                {PROGRESS_STEPS.map((s, i) => (
                  <li key={s} className="text-center">
                    <div className={`h-2 rounded-full ${i <= step ? "bg-brand-600" : "bg-slate-200"}`} />
                    <div className={`mt-2 text-xs ${i <= step ? "font-semibold text-slate-900" : "text-slate-400"}`}>{t.status[s]}</div>
                  </li>
                ))}
              </ol>
            )}

            <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2 md:grid-cols-4">
              <div>
                <dt className="text-slate-500">{t.track.from}</dt>
                <dd className="font-medium">{shipment.originCity}, {shipment.originCountry}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t.track.to}</dt>
                <dd className="font-medium">{shipment.destCity}, {shipment.destCountry}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t.track.type}</dt>
                <dd className="font-medium">{t.shipmentType[shipment.type]}{shipment.carrier ? ` · ${shipment.carrier.name}` : ""}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{shipment.estimatedDelivery ? t.track.estimated : t.track.pieces}</dt>
                <dd className="font-medium">
                  {shipment.estimatedDelivery ? formatDate(shipment.estimatedDelivery, locale, false) : shipment.pieces}
                </dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold">{t.track.history}</h2>
            {shipment.events.length === 0 ? (
              <p className="mt-4 text-slate-500">{t.track.noEvents}</p>
            ) : (
              <ol className="mt-6 space-y-0">
                {shipment.events.map((e, i) => (
                  <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < shipment.events.length - 1 && <span className="absolute left-[7px] top-4 h-full w-0.5 bg-slate-200" />}
                    <span className={`relative mt-1 h-4 w-4 shrink-0 rounded-full border-4 ${i === 0 ? "border-brand-600 bg-white" : "border-slate-300 bg-white"}`} />
                    <div>
                      <div className="font-semibold">{t.status[e.status]}</div>
                      {e.description && <div className="text-sm text-slate-600">{e.description}</div>}
                      <div className="mt-0.5 text-xs text-slate-500">
                        {formatDate(e.occurredAt, locale)}
                        {e.location ? ` · ${e.location}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {botUsername && (
            <a href={`https://t.me/${botUsername}?start=track_${shipment.trackingNumber}`} className="btn-secondary" target="_blank" rel="noreferrer">
              {t.track.telegram}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
