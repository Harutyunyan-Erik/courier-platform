import Link from "next/link";
import { Suspense } from "react";
import { requireUser, STAFF_ROLES } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const user = await requireUser(locale, STAFF_ROLES);
  const base = `/${locale}/admin`;
  const links =
    user.role === "COURIER"
      ? [{ href: base, label: t.admin.myDeliveries }]
      : [
          { href: base, label: t.admin.dashboard },
          { href: `${base}/shipments`, label: t.admin.shipments },
          { href: `${base}/shipments/new`, label: `+ ${t.admin.newShipment}` },
          { href: `${base}/tariffs`, label: t.admin.tariffs },
          ...(user.role === "SUPER_ADMIN"
            ? [
                { href: `${base}/carriers`, label: t.admin.carriers },
                { href: `${base}/users`, label: t.admin.users },
              ]
            : []),
        ];

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-slate-200 bg-white md:fixed md:inset-y-0 md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4">
          <Link href={`/${locale}`}><Logo /></Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 text-sm md:flex-col">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden space-y-3 border-t border-slate-200 p-4 md:absolute md:bottom-0 md:block md:w-full">
          <div className="text-sm">
            <div className="font-semibold">{user.name}</div>
            <div className="text-slate-500">{t.role[user.role]}</div>
          </div>
          <Suspense><LanguageSwitcher current={locale} /></Suspense>
          <div className="flex gap-4">
            <Link href={`/${locale}/password`} className="text-sm text-slate-500 hover:text-slate-900">{t.auth.changePassword}</Link>
            <form action={logout.bind(null, locale)}>
              <button className="text-sm text-slate-500 hover:text-slate-900">{t.nav.logout}</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="flex-1 p-4 md:ml-60 md:p-8">{children}</main>
    </div>
  );
}
