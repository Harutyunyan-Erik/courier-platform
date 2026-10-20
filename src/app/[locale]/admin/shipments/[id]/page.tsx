import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MANAGER_ROLES, requireUser, STAFF_ROLES } from "@/lib/auth";
import { formatDate, getDictionary } from "@/lib/i18n";
import { STATUS_ORDER } from "@/lib/statuses";
import { managementOptions } from "@/lib/admin-data";
import { getAdapter } from "@/lib/carriers";
import { addEvent, syncNow, toggleAutoSync, toggleEventHidden, updateShipment } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { StatusBadge } from "@/components/StatusBadge";
import { ShipmentFields } from "@/components/ShipmentFields";
import { ManagementFields } from "@/components/ManagementFields";

const SOURCE_TONE = { API: "bg-blue-50 text-blue-700", WEBHOOK: "bg-blue-50 text-blue-700", MANUAL: "bg-amber-50 text-amber-800", SYSTEM: "bg-slate-100 text-slate-600" };

function yerevanNow() {
  return new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16);
}

export default async function ShipmentDetail({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const t = getDictionary(locale);
  const user = await requireUser(locale, STAFF_ROLES);
  const isManager = MANAGER_ROLES.includes(user.role);

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      carrier: true,
      courier: true,
      customer: true,
      events: { orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }], include: { createdBy: true } },
    },
  });
  if (!shipment || (user.role === "COURIER" && shipment.courierId !== user.id)) notFound();
  const adapter = getAdapter(shipment.carrier?.adapter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/${locale}/admin/shipments`} className="text-sm text-slate-500 hover:text-brand-600">← {t.admin.shipments}</Link>
          <h1 className="font-mono text-2xl font-bold">{shipment.trackingNumber}</h1>
          <div className="text-sm text-slate-500">
            {t.shipmentType[shipment.type]} · {shipment.originCity} → {shipment.destCity} · {shipment.carrier?.name ?? t.admin.ownCourier}
            {shipment.carrierTrackingNumber ? ` · ${shipment.carrierTrackingNumber}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={shipment.currentStatus} t={t} />
          <Link href={`/${locale}/track?n=${shipment.trackingNumber}`} target="_blank" className="btn-secondary">↗ {t.nav.track}</Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">{t.admin.addEvent}</h2>
            <ActionForm action={addEvent.bind(null, locale, shipment.id)} submitLabel={t.admin.addEvent} className="grid gap-4 md:grid-cols-2" resetOnSuccess>
              <div>
                <label className="label">{t.admin.status}</label>
                <select name="status" defaultValue={shipment.currentStatus} className="input">
                  {STATUS_ORDER.map((s) => <option key={s} value={s}>{t.status[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t.admin.occurredAt}</label>
                <input name="occurredAt" type="datetime-local" defaultValue={yerevanNow()} className="input" />
              </div>
              <div>
                <label className="label">{t.admin.location}</label>
                <input name="location" className="input" />
              </div>
              <div>
                <label className="label">{t.admin.description}</label>
                <input name="description" className="input" />
              </div>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input type="checkbox" name="internal" /> {t.admin.internal}
              </label>
            </ActionForm>
          </div>

          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">{t.admin.history}</h2>
            <ol className="space-y-3">
              {shipment.events.map((e) => (
                <li key={e.id} className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border p-3 ${e.hidden ? "border-dashed border-slate-300 opacity-50" : "border-slate-200"}`}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={e.status} t={t} />
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${SOURCE_TONE[e.source]}`}>{t.source[e.source]}</span>
                      {!e.isPublic && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">🔒</span>}
                      {e.hidden && <span className="text-xs text-slate-500">({t.admin.hidden})</span>}
                    </div>
                    <div className="mt-1 text-sm">{e.description}{e.rawStatus && e.rawStatus !== e.description ? <span className="text-slate-400"> · {e.rawStatus}</span> : null}</div>
                    <div className="text-xs text-slate-500">
                      {formatDate(e.occurredAt, locale)}{e.location ? ` · ${e.location}` : ""}{e.createdBy ? ` · ${e.createdBy.name}` : ""}
                    </div>
                  </div>
                  {isManager && (
                    <form action={toggleEventHidden.bind(null, locale, e.id)}>
                      <button className="text-xs font-medium text-slate-500 hover:text-brand-600">{e.hidden ? t.admin.show : t.admin.hide}</button>
                    </form>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-6">
          {isManager && shipment.carrier && (
            <div className="card space-y-3 text-sm">
              <h2 className="text-lg font-semibold">{t.admin.autoSync}</h2>
              <div>
                {t.admin.adapter}: <b>{adapter?.label ?? t.admin.manualOnly}</b>{" "}
                {adapter && (adapter.isConfigured() ? <span className="text-emerald-700">✓ {t.admin.configured}</span> : <span className="text-amber-700">⚠ {t.admin.notConfigured}</span>)}
              </div>
              <div>{t.admin.lastSync}: {shipment.lastSyncedAt ? formatDate(shipment.lastSyncedAt, locale) : t.admin.never}</div>
              {shipment.lastSyncError && <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{shipment.lastSyncError}</div>}
              <div className="flex flex-wrap gap-2">
                <form action={toggleAutoSync.bind(null, locale, shipment.id)}>
                  <button className={shipment.autoSync ? "btn-primary" : "btn-secondary"}>
                    {shipment.autoSync ? t.admin.autoSyncOn : t.admin.autoSyncOff}
                  </button>
                </form>
                {adapter && (
                  <form action={syncNow.bind(null, locale, shipment.id)}>
                    <button className="btn-secondary">⟳ {t.admin.syncNow}</button>
                  </form>
                )}
              </div>
            </div>
          )}
          <div className="card space-y-2 text-sm">
            <h2 className="text-lg font-semibold">{t.admin.details}</h2>
            <div><span className="text-slate-500">{t.order.sender}:</span> {shipment.senderName} {shipment.senderPhone}</div>
            <div><span className="text-slate-500">{t.order.recipient}:</span> {shipment.recipientName} {shipment.recipientPhone}</div>
            <div className="text-slate-600">{[shipment.recipientAddress, shipment.destCity, shipment.destCountry].filter(Boolean).join(", ")}</div>
            {shipment.weightKg && <div><span className="text-slate-500">{t.track.weight}:</span> {shipment.weightKg.toString()} {t.track.kg} · {shipment.pieces}</div>}
            {shipment.price && <div><span className="text-slate-500">{t.admin.price}:</span> {Number(shipment.price).toLocaleString("en-US")} {shipment.currency}</div>}
            {shipment.customer && <div><span className="text-slate-500">{t.admin.customer}:</span> {shipment.customer.name} ({shipment.customer.email})</div>}
            {shipment.courier && <div><span className="text-slate-500">{t.admin.courier}:</span> {shipment.courier.name}</div>}
            {shipment.notes && <div className="rounded-lg bg-amber-50 p-2">{shipment.notes}</div>}
          </div>
        </div>
      </div>

      {isManager && (
        <details className="card">
          <summary className="cursor-pointer text-lg font-semibold">{t.admin.edit}</summary>
          <div className="mt-6">
            <ActionForm action={updateShipment.bind(null, locale, shipment.id)} submitLabel={t.admin.save} className="space-y-8">
              <ShipmentFields t={t} d={{ ...shipment, weightKg: shipment.weightKg?.toString() }} />
              <ManagementFields t={t} {...await managementOptions()} s={shipment} />
            </ActionForm>
          </div>
        </details>
      )}
    </div>
  );
}
