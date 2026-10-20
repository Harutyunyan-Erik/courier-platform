"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { generateTrackingNumber } from "@/lib/tracking-number";
import { readShipmentFields } from "@/lib/shipment-input";
import { quote } from "@/lib/pricing";
import { audit } from "@/lib/audit";
import type { FormState } from "@/lib/forms";

export async function createCustomerShipment(locale: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser(locale);
  const t = getDictionary(locale);
  const data = readShipmentFields(form);
  if (!data) return { error: t.auth.required };
  const q = data.weightKg ? await quote(data.type, data.destCountry, data.weightKg) : null;
  const shipment = await prisma.shipment.create({
    data: {
      ...data,
      trackingNumber: generateTrackingNumber(data.type),
      customerId: user.id,
      price: q?.price ?? null,
      currency: q?.currency ?? "AMD",
      events: { create: { status: "CREATED", source: "SYSTEM", occurredAt: new Date(), createdById: user.id } },
    },
  });
  await audit(user.id, "shipment.create", "Shipment", shipment.id, { by: "customer" });
  redirect(`/${locale}/account?created=${shipment.trackingNumber}`);
}

/** Creates a one-time token the customer sends to the bot with /start to link their chat. */
export async function connectTelegram(locale: string) {
  const user = await requireUser(locale);
  const token = randomBytes(12).toString("hex");
  await prisma.user.update({ where: { id: user.id }, data: { telegramToken: token } });
  redirect(`https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=user_${token}`);
}
