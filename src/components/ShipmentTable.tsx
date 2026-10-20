import Link from "next/link";
import type { Carrier, Shipment } from "@prisma/client";
import { formatDate, type Dictionary } from "@/lib/i18n";
import { StatusBadge } from "./StatusBadge";

export function ShipmentTable({ shipments, locale, t }: { shipments: (Shipment & { carrier: Carrier | null })[]; locale: string; t: Dictionary }) {
  if (shipments.length === 0) return <div className="card text-slate-500">{t.admin.noResults}</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tracking</th>
            <th>{t.admin.type}</th>
            <th>{t.admin.route}</th>
            <th>{t.order.recipient}</th>
            <th>{t.admin.carrier}</th>
            <th>{t.admin.status}</th>
            <th>{t.admin.updated}</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td>
                <Link href={`/${locale}/admin/shipments/${s.id}`} className="font-mono font-semibold text-brand-600">{s.trackingNumber}</Link>
              </td>
              <td>{t.shipmentType[s.type]}</td>
              <td className="whitespace-nowrap">{s.originCity} → {s.destCity}</td>
              <td>{s.recipientName}</td>
              <td>{s.carrier?.name ?? t.admin.ownCourier}</td>
              <td><StatusBadge status={s.currentStatus} t={t} /></td>
              <td className="whitespace-nowrap text-slate-500">{formatDate(s.updatedAt, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
