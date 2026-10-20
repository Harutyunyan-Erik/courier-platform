import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser, STAFF_ROLES } from "@/lib/auth";
import { formatDate, getDictionary } from "@/lib/i18n";
import { quickStatus } from "@/app/actions/admin";
import { StatusBadge } from "@/components/StatusBadge";
import { ShipmentTable } from "@/components/ShipmentTable";

const FINAL = ["DELIVERED", "RETURNED", "CANCELLED"] as const;

export default async function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const user = await requireUser(locale, STAFF_ROLES);

  if (user.role === "COURIER") {
    const shipments = await prisma.shipment.findMany({
      where: { courierId: user.id, currentStatus: { notIn: [...FINAL] } },
      orderBy: { updatedAt: "desc" },
    });
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">{t.admin.myDeliveries}</h1>
        {shipments.length === 0 && <div className="card text-slate-500">{t.admin.noResults}</div>}
        <div className="grid gap-4 md:grid-cols-2">
          {shipments.map((s) => (
            <div key={s.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/${locale}/admin/shipments/${s.id}`} className="font-mono font-semibold text-brand-600">{s.trackingNumber}</Link>
                <StatusBadge status={s.currentStatus} t={t} />
              </div>
              <div className="text-sm">
                <div className="font-medium">{s.recipientName}</div>
                {s.recipientPhone && <a href={`tel:${s.recipientPhone}`} className="text-brand-600">{s.recipientPhone}</a>}
                <div className="text-slate-600">{[s.recipientAddress, s.destCity].filter(Boolean).join(", ")}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "EXCEPTION"] as const).map((st) => (
                  <form key={st} action={quickStatus.bind(null, locale, s.id, st)}>
                    <button className={st === "DELIVERED" ? "btn-primary" : "btn-secondary"}>{t.status[st]}</button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [total, active, delivered, exceptions, recent, syncErrors] = await Promise.all([
    prisma.shipment.count(),
    prisma.shipment.count({ where: { currentStatus: { notIn: [...FINAL] } } }),
    prisma.shipment.count({ where: { currentStatus: "DELIVERED", updatedAt: { gte: weekAgo } } }),
    prisma.shipment.count({ where: { currentStatus: "EXCEPTION" } }),
    prisma.shipment.findMany({ orderBy: { updatedAt: "desc" }, take: 10, include: { carrier: true } }),
    prisma.shipment.findMany({ where: { lastSyncError: { not: null }, autoSync: true }, take: 5, orderBy: { lastSyncedAt: "desc" } }),
  ]);
  const stats = [
    { label: t.admin.total, value: total },
    { label: t.admin.active, value: active },
    { label: t.admin.deliveredWeek, value: delivered },
    { label: t.admin.exceptions, value: exceptions, warn: exceptions > 0 },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{t.admin.dashboard}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className={`mt-1 text-3xl font-bold ${s.warn ? "text-red-600" : ""}`}>{s.value}</div>
          </div>
        ))}
      </div>
      {syncErrors.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <div className="font-semibold text-amber-900">{t.admin.syncError}</div>
          <ul className="mt-2 space-y-1">
            {syncErrors.map((s) => (
              <li key={s.id}>
                <Link href={`/${locale}/admin/shipments/${s.id}`} className="font-mono font-semibold text-amber-900 underline">{s.trackingNumber}</Link>{" "}
                <span className="text-amber-800">{s.lastSyncedAt ? formatDate(s.lastSyncedAt, locale) : ""}: {s.lastSyncError?.slice(0, 120)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h2 className="mb-3 text-lg font-semibold">{t.admin.recent}</h2>
        <ShipmentTable shipments={recent} locale={locale} t={t} />
      </div>
    </div>
  );
}
