import { requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { changePassword } from "@/app/actions/auth";
import { ActionForm } from "@/components/ActionForm";

export default async function PasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const user = await requireUser(locale);
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card">
        <h1 className="mb-1 text-2xl font-bold">{t.auth.changePassword}</h1>
        <p className="mb-6 text-sm text-slate-500">{user.email}</p>
        <ActionForm action={changePassword.bind(null, locale)} submitLabel={t.admin.save} resetOnSuccess>
          <div>
            <label className="label">{t.auth.currentPassword}</label>
            <input name="current" type="password" required className="input" autoComplete="current-password" />
          </div>
          <div>
            <label className="label">{t.auth.newPassword}</label>
            <input name="password" type="password" required minLength={8} className="input" autoComplete="new-password" />
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
