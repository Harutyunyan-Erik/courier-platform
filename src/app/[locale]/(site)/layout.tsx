import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getDictionary } from "@/lib/i18n";

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  return (
    <>
      <Header locale={locale} t={t} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer t={t} />
    </>
  );
}
