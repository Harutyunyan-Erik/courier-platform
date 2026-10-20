import type { Prisma, ShipmentType } from "@prisma/client";
import { num, optStr, str } from "./forms";

/** Reads the fields rendered by ShipmentFields. Returns null when a required field is missing. */
export function readShipmentFields(form: FormData) {
  const type: ShipmentType = str(form, "type") === "GROUND" ? "GROUND" : "AIR";
  const data = {
    type,
    senderName: str(form, "senderName"),
    senderPhone: optStr(form, "senderPhone"),
    senderAddress: optStr(form, "senderAddress"),
    originCity: str(form, "originCity"),
    originCountry: str(form, "originCountry"),
    recipientName: str(form, "recipientName"),
    recipientPhone: optStr(form, "recipientPhone"),
    recipientEmail: optStr(form, "recipientEmail"),
    recipientAddress: optStr(form, "recipientAddress"),
    destCity: str(form, "destCity"),
    destCountry: str(form, "destCountry"),
    weightKg: num(form, "weightKg"),
    pieces: Math.max(1, Math.round(num(form, "pieces") ?? 1)),
    description: optStr(form, "description"),
  } satisfies Partial<Prisma.ShipmentUncheckedCreateInput>;
  const required = [data.senderName, data.originCity, data.originCountry, data.recipientName, data.destCity, data.destCountry];
  return required.every(Boolean) ? data : null;
}
