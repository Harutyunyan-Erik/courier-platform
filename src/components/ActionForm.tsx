"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/forms";

/** Form with inline error/success message for server actions returning FormState. */
export function ActionForm({
  action,
  submitLabel,
  children,
  className = "space-y-4",
  resetOnSuccess = false,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className} key={resetOnSuccess && state?.ok ? Math.random() : undefined}>
      {children}
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.ok}</p>}
      <button disabled={pending} className="btn-primary">{submitLabel}</button>
    </form>
  );
}
