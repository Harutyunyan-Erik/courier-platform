"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register } from "@/app/actions/auth";
import type { Dictionary } from "@/lib/i18n";

export function LoginForm({ locale, t, next }: { locale: string; t: Dictionary; next?: string }) {
  const [state, action, pending] = useActionState(login.bind(null, locale), undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label">{t.auth.email}</label>
        <input name="email" type="email" required className="input" autoComplete="email" />
      </div>
      <div>
        <label className="label">{t.auth.password}</label>
        <input name="password" type="password" required className="input" autoComplete="current-password" />
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">{t.auth.login}</button>
      <p className="text-center text-sm text-slate-600">
        {t.auth.noAccount} <Link href={`/${locale}/register`} className="font-semibold text-brand-600">{t.auth.register}</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ locale, t }: { locale: string; t: Dictionary }) {
  const [state, action, pending] = useActionState(register.bind(null, locale), undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label">{t.auth.name} *</label>
        <input name="name" required className="input" autoComplete="name" />
      </div>
      <div>
        <label className="label">{t.auth.email} *</label>
        <input name="email" type="email" required className="input" autoComplete="email" />
      </div>
      <div>
        <label className="label">{t.auth.phone}</label>
        <input name="phone" type="tel" className="input" autoComplete="tel" />
      </div>
      <div>
        <label className="label">{t.auth.password} *</label>
        <input name="password" type="password" required minLength={8} className="input" autoComplete="new-password" />
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">{t.auth.register}</button>
      <p className="text-center text-sm text-slate-600">
        {t.auth.haveAccount} <Link href={`/${locale}/login`} className="font-semibold text-brand-600">{t.auth.login}</Link>
      </p>
    </form>
  );
}
