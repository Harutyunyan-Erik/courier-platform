import { getDictionary } from "@/lib/i18n";
import { RegisterForm } from "@/components/AuthForms";

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card">
        <h1 className="mb-6 text-2xl font-bold">{t.auth.registerTitle}</h1>
        <RegisterForm locale={locale} t={t} />
      </div>
    </div>
  );
}
