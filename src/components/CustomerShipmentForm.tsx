"use client";

import { useActionState } from "react";
import { createCustomerShipment } from "@/app/actions/customer";
import type { Dictionary } from "@/lib/i18n";

export function CustomerShipmentForm({ locale, t, children }: { locale: string; t: Dictionary; children: React.ReactNode }) {
  const [state, action, pending] = useActionState(createCustomerShipment.bind(null, locale), undefined);
  return (
    <form action={action} className="card space-y-6">
      {children}
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary">{t.order.submit}</button>
    </form>
  );
}
