import { getDictionary } from "@/lib/i18n";
import { LoginForm } from "@/components/AuthForms";

export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card">
        <h1 className="mb-6 text-2xl font-bold">{t.auth.loginTitle}</h1>
        <LoginForm locale={locale} t={t} next={(await searchParams).next} />
      </div>
    </div>
  );
}
