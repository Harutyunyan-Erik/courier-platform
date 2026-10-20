import type { Carrier, Shipment, User } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";

/** Staff-only fields: carrier, courier, customer, price, notes. */
export function ManagementFields({
  t,
  carriers,
  couriers,
  customers,
  s,
}: {
  t: Dictionary;
  carriers: Carrier[];
  couriers: User[];
  customers: User[];
  s?: Shipment;
}) {
  return (
    <fieldset className="grid gap-4 md:grid-cols-3">
      <legend className="mb-2 text-base font-semibold">{t.admin.details}</legend>
      <div>
        <label className="label">{t.admin.carrier}</label>
        <select name="carrierId" defaultValue={s?.carrierId ?? ""} className="input">
          <option value="">{t.admin.ownCourier}</option>
          {carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">{t.admin.carrierNumber}</label>
        <input name="carrierTrackingNumber" defaultValue={s?.carrierTrackingNumber ?? ""} className="input font-mono" />
      </div>
      <div>
        <label className="label">{t.admin.courier}</label>
        <select name="courierId" defaultValue={s?.courierId ?? ""} className="input">
          <option value="">{t.admin.none}</option>
          {couriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">{t.admin.customer}</label>
        <select name="customerId" defaultValue={s?.customerId ?? ""} className="input">
          <option value="">{t.admin.none}</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="label">{t.admin.price}</label>
          <input name="price" type="number" step="1" defaultValue={s?.price?.toString() ?? ""} className="input" />
        </div>
        <div className="w-24">
          <label className="label">&nbsp;</label>
          <select name="currency" defaultValue={s?.currency ?? "AMD"} className="input">
            {["AMD", "USD", "EUR", "RUB"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">{t.admin.estimated}</label>
        <input name="estimatedDelivery" type="date" defaultValue={s?.estimatedDelivery?.toISOString().slice(0, 10) ?? ""} className="input" />
      </div>
      <div className="md:col-span-2">
        <label className="label">{t.admin.notes}</label>
        <input name="notes" defaultValue={s?.notes ?? ""} className="input" />
      </div>
      <label className="flex items-center gap-2 self-end pb-2 text-sm">
        <input type="checkbox" name="autoSync" defaultChecked={s?.autoSync ?? true} />
        {t.admin.autoSync}
      </label>
    </fieldset>
  );
}
