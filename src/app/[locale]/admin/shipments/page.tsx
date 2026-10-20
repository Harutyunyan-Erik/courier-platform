import Link from "next/link";
import type { Prisma, ShipmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MANAGER_ROLES, requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { STATUS_ORDER } from "@/lib/statuses";
import { ShipmentTable } from "@/components/ShipmentTable";

const PAGE_SIZE = 50;

export default async function ShipmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string; type?: string; page?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = getDictionary(locale);
  await requireUser(locale, MANAGER_ROLES);
  const q = sp.q?.trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.ShipmentWhereInput = {
    ...(STATUS_ORDER.includes(sp.status as ShipmentStatus) ? { currentStatus: sp.status as ShipmentStatus } : {}),
    ...(sp.type === "AIR" || sp.type === "GROUND" ? { type: sp.type } : {}),
    ...(q
      ? {
          OR: [
            { trackingNumber: { contains: q, mode: "insensitive" } },
            { carrierTrackingNumber: { contains: q, mode: "insensitive" } },
            { recipientName: { contains: q, mode: "insensitive" } },
            { senderName: { contains: q, mode: "insensitive" } },
            { recipientPhone: { contains: q } },
            { senderPhone: { contains: q } },
          ],
        }
      : {}),
  };
  const [shipments, count] = await Promise.all([
    prisma.shipment.findMany({ where, orderBy: { updatedAt: "desc" }, include: { carrier: true }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
    prisma.shipment.count({ where }),
  ]);
  const pageHref = (p: number) => `?${new URLSearchParams({ ...(q ? { q } : {}), ...(sp.status ? { status: sp.status } : {}), ...(sp.type ? { type: sp.type } : {}), page: String(p) })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t.admin.shipments} <span className="text-slate-400">({count})</span></h1>
        <Link href={`/${locale}/admin/shipments/new`} className="btn-primary">+ {t.admin.newShipment}</Link>
      </div>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder={t.admin.search} className="input max-w-sm" />
        <select name="status" defaultValue={sp.status ?? ""} className="input w-auto">
          <option value="">{t.admin.status}: {t.admin.all}</option>
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{t.status[s]}</option>)}
        </select>
        <select name="type" defaultValue={sp.type ?? ""} className="input w-auto">
          <option value="">{t.admin.type}: {t.admin.all}</option>
          <option value="AIR">{t.shipmentType.AIR}</option>
          <option value="GROUND">{t.shipmentType.GROUND}</option>
        </select>
        <button className="btn-secondary">🔍</button>
      </form>
      <ShipmentTable shipments={shipments} locale={locale} t={t} />
      {count > PAGE_SIZE && (
        <div className="flex gap-2">
          {page > 1 && <Link href={pageHref(page - 1)} className="btn-secondary">←</Link>}
          {page * PAGE_SIZE < count && <Link href={pageHref(page + 1)} className="btn-secondary">→</Link>}
        </div>
      )}
    </div>
  );
}
