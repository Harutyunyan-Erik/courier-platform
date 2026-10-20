import type { Shipment } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";

type Defaults = Partial<Pick<Shipment, "type" | "senderName" | "senderPhone" | "senderAddress" | "originCity" | "originCountry" | "recipientName" | "recipientPhone" | "recipientEmail" | "recipientAddress" | "destCity" | "destCountry" | "pieces" | "description">> & {
  weightKg?: string | number | null;
};

function Field({ name, label, required, type = "text", defaultValue }: { name: string; label: string; required?: boolean; type?: string; defaultValue?: string | number | null }) {
  return (
    <div>
      <label className="label">{label}{required ? " *" : ""}</label>
      <input name={name} type={type} required={required} defaultValue={defaultValue ?? undefined} step={type === "number" ? "0.1" : undefined} className="input" />
    </div>
  );
}

/** Sender, recipient and parcel fields shared by the customer order form and the admin form. */
export function ShipmentFields({ t, d = {} }: { t: Dictionary; d?: Defaults }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="label">{t.calc.type} *</label>
        <div className="flex gap-3">
          {(["AIR", "GROUND"] as const).map((type) => (
            <label key={type} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" name="type" value={type} defaultChecked={(d.type ?? "AIR") === type} />
              {t.shipmentType[type]}
            </label>
          ))}
        </div>
      </div>
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-2 text-base font-semibold">{t.order.sender}</legend>
        <Field name="senderName" label={t.order.name} required defaultValue={d.senderName} />
        <Field name="senderPhone" label={t.order.phone} type="tel" defaultValue={d.senderPhone} />
        <Field name="originCity" label={t.order.city} required defaultValue={d.originCity ?? "Yerevan"} />
        <Field name="originCountry" label={t.order.country} required defaultValue={d.originCountry ?? "Armenia"} />
        <div className="md:col-span-2"><Field name="senderAddress" label={t.order.address} defaultValue={d.senderAddress} /></div>
      </fieldset>
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-2 text-base font-semibold">{t.order.recipient}</legend>
        <Field name="recipientName" label={t.order.name} required defaultValue={d.recipientName} />
        <Field name="recipientPhone" label={t.order.phone} type="tel" defaultValue={d.recipientPhone} />
        <Field name="recipientEmail" label={t.order.email} type="email" defaultValue={d.recipientEmail} />
        <Field name="destCity" label={t.order.city} required defaultValue={d.destCity} />
        <Field name="destCountry" label={t.order.country} required defaultValue={d.destCountry} />
        <Field name="recipientAddress" label={t.order.address} defaultValue={d.recipientAddress} />
      </fieldset>
      <fieldset className="grid gap-4 md:grid-cols-3">
        <legend className="mb-2 text-base font-semibold">{t.order.parcel}</legend>
        <Field name="weightKg" label={t.order.weight} type="number" defaultValue={d.weightKg?.toString()} />
        <Field name="pieces" label={t.order.pieces} type="number" defaultValue={d.pieces ?? 1} />
        <Field name="description" label={t.order.description} defaultValue={d.description} />
      </fieldset>
    </div>
  );
}
