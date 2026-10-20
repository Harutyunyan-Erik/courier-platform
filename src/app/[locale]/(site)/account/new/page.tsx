import { requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { ShipmentFields } from "@/components/ShipmentFields";
import { CustomerShipmentForm } from "@/components/CustomerShipmentForm";

export default async function NewShipmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; country?: string; weight?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = getDictionary(locale);
  const user = await requireUser(locale);
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">{t.order.title}</h1>
      <CustomerShipmentForm locale={locale} t={t}>
        <ShipmentFields
          t={t}
          d={{
            type: sp.type === "GROUND" ? "GROUND" : "AIR",
            destCountry: sp.country,
            weightKg: sp.weight,
            senderName: user.name,
            senderPhone: user.phone,
          }}
        />
      </CustomerShipmentForm>
    </div>
  );
}
