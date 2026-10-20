import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser, STAFF_ROLES } from "@/lib/auth";
import type { Dictionary } from "@/lib/i18n";
import { logout } from "@/app/actions/auth";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function Header({ locale, t }: { locale: string; t: Dictionary }) {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={`/${locale}`}>
          <Logo />
        </Link>
        <nav className="order-3 flex w-full gap-5 overflow-x-auto text-sm font-medium text-slate-600 md:order-none md:w-auto">
          <Link href={`/${locale}#services`} className="hover:text-brand-600">{t.nav.services}</Link>
          <Link href={`/${locale}/track`} className="hover:text-brand-600">{t.nav.track}</Link>
          <Link href={`/${locale}#calculator`} className="hover:text-brand-600">{t.nav.calculator}</Link>
          <Link href={`/${locale}#contact`} className="hover:text-brand-600">{t.nav.contact}</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Suspense>
            <LanguageSwitcher current={locale} />
          </Suspense>
          {user ? (
            <>
              <Link
                href={STAFF_ROLES.includes(user.role) ? `/${locale}/admin` : `/${locale}/account`}
                className="btn-secondary"
              >
                {STAFF_ROLES.includes(user.role) ? t.nav.admin : t.nav.account}
              </Link>
              <form action={logout.bind(null, locale)}>
                <button className="btn text-slate-500 hover:text-slate-900">{t.nav.logout}</button>
              </form>
            </>
          ) : (
            <>
              <Link href={`/${locale}/login`} className="btn text-slate-700 hover:text-brand-600">{t.nav.login}</Link>
              <Link href={`/${locale}/register`} className="btn-primary">{t.nav.register}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
