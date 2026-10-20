import { MANAGER_ROLES, requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { managementOptions } from "@/lib/admin-data";
import { createShipment } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { ShipmentFields } from "@/components/ShipmentFields";
import { ManagementFields } from "@/components/ManagementFields";

export default async function NewShipment({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  await requireUser(locale, MANAGER_ROLES);
  const options = await managementOptions();
  return (
    <div className="max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold">{t.admin.newShipment}</h1>
      <div className="card">
        <ActionForm action={createShipment.bind(null, locale)} submitLabel={t.admin.create} className="space-y-8">
          <ShipmentFields t={t} />
          <ManagementFields t={t} {...options} />
        </ActionForm>
      </div>
    </div>
  );
}
