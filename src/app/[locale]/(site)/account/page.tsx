import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, getDictionary } from "@/lib/i18n";
import { connectTelegram } from "@/app/actions/customer";
import { StatusBadge } from "@/components/StatusBadge";

export default async function AccountPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ created?: string }> }) {
  const { locale } = await params;
  const { created } = await searchParams;
  const t = getDictionary(locale);
  const user = await requireUser(locale);
  const shipments = await prisma.shipment.findMany({ where: { customerId: user.id }, orderBy: { createdAt: "desc" } });
  const telegramReady = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t.account.title}</h1>
          <p className="text-slate-600">
            {user.name} · {user.email} ·{" "}
            <Link href={`/${locale}/password`} className="text-brand-600 hover:underline">{t.auth.changePassword}</Link>
          </p>
        </div>
        <Link href={`/${locale}/account/new`} className="btn-primary">+ {t.account.newShipment}</Link>
      </div>

      {created && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          {t.order.created} <span className="font-mono font-bold">{created}</span>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">{t.account.myShipments}</h2>
          {shipments.length === 0 ? (
            <div className="card text-slate-500">{t.account.empty}</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Tracking</th><th>{t.admin.route}</th><th>{t.admin.status}</th><th>{t.admin.updated}</th></tr>
                </thead>
                <tbody>
                  {shipments.map((s) => (
                    <tr key={s.id}>
                      <td><Link href={`/${locale}/track?n=${s.trackingNumber}`} className="font-mono font-semibold text-brand-600">{s.trackingNumber}</Link><div className="text-xs text-slate-500">{t.shipmentType[s.type]}</div></td>
                      <td>{s.originCity} → {s.destCity}</td>
                      <td><StatusBadge status={s.currentStatus} t={t} /></td>
                      <td className="text-slate-500">{formatDate(s.updatedAt, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card h-fit">
          <h2 className="font-semibold">{t.account.telegramTitle}</h2>
          {user.telegramChatId ? (
            <p className="mt-2 text-sm text-emerald-700">✓ {t.account.telegramConnected}</p>
          ) : telegramReady ? (
            <>
              <p className="mt-2 text-sm text-slate-600">{t.account.telegramText}</p>
              <form action={connectTelegram.bind(null, locale)}>
                <button className="btn-secondary mt-4">{t.account.telegramConnect}</button>
              </form>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-500">{t.account.telegramUnavailable}</p>
          )}
        </div>
      </div>
    </div>
  );
}
