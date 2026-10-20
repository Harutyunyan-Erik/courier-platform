"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role, ShipmentStatus, ShipmentType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword, MANAGER_ROLES, requireUser, STAFF_ROLES } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { num, optStr, str, type FormState } from "@/lib/forms";
import { generateTrackingNumber, normalizeTrackingInput } from "@/lib/tracking-number";
import { readShipmentFields } from "@/lib/shipment-input";
import { STATUS_ORDER } from "@/lib/statuses";
import { addManualEvent, recomputeStatus, syncShipment } from "@/lib/shipments";
import { audit } from "@/lib/audit";

const ROLES: Role[] = ["SUPER_ADMIN", "MANAGER", "COURIER", "CUSTOMER"];

/** Couriers can only touch shipments assigned to them. */
async function requireShipmentAccess(locale: string, shipmentId: string) {
  const user = await requireUser(locale, STAFF_ROLES);
  if (user.role === "COURIER") {
    const s = await prisma.shipment.findFirst({ where: { id: shipmentId, courierId: user.id }, select: { id: true } });
    if (!s) redirect(`/${locale}/admin`);
  }
  return user;
}

function managementFields(form: FormData) {
  return {
    carrierId: optStr(form, "carrierId"),
    carrierTrackingNumber: str(form, "carrierTrackingNumber") ? normalizeTrackingInput(str(form, "carrierTrackingNumber")) : null,
    courierId: optStr(form, "courierId"),
    customerId: optStr(form, "customerId"),
    price: num(form, "price"),
    currency: str(form, "currency") || "AMD",
    estimatedDelivery: str(form, "estimatedDelivery") ? new Date(str(form, "estimatedDelivery")) : null,
    notes: optStr(form, "notes"),
    autoSync: form.get("autoSync") === "on",
  };
}

/** datetime-local has no zone; the business runs on Yerevan time (UTC+4). */
function parseOccurredAt(value: string) {
  if (!value) return new Date();
  const date = new Date(`${value}:00+04:00`);
  if (Number.isNaN(date.getTime())) return new Date();
  // The form pre-fills the current minute; keep the exact time so the event sorts after earlier ones.
  return Date.now() - date.getTime() < 60_000 && date.getTime() <= Date.now() ? new Date() : date;
}

export async function createShipment(locale: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser(locale, MANAGER_ROLES);
  const data = readShipmentFields(form);
  if (!data) return { error: getDictionary(locale).auth.required };
  const shipment = await prisma.shipment.create({
    data: {
      ...data,
      ...managementFields(form),
      trackingNumber: generateTrackingNumber(data.type),
      events: { create: { status: "CREATED", source: "SYSTEM", occurredAt: new Date(), createdById: user.id } },
    },
  });
  await audit(user.id, "shipment.create", "Shipment", shipment.id);
  redirect(`/${locale}/admin/shipments/${shipment.id}`);
}

export async function updateShipment(locale: string, id: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser(locale, MANAGER_ROLES);
  const t = getDictionary(locale);
  const data = readShipmentFields(form);
  if (!data) return { error: t.auth.required };
  await prisma.shipment.update({ where: { id }, data: { ...data, ...managementFields(form) } });
  await audit(user.id, "shipment.update", "Shipment", id);
  revalidatePath(`/${locale}/admin/shipments/${id}`);
  return { ok: t.admin.saved };
}

export async function addEvent(locale: string, shipmentId: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireShipmentAccess(locale, shipmentId);
  const status = str(form, "status") as ShipmentStatus;
  if (!STATUS_ORDER.includes(status)) return { error: getDictionary(locale).auth.required };
  await addManualEvent({
    shipmentId,
    status,
    description: str(form, "description"),
    location: str(form, "location"),
    occurredAt: parseOccurredAt(str(form, "occurredAt")),
    isPublic: form.get("internal") !== "on",
    userId: user.id,
  });
  await audit(user.id, "event.add", "Shipment", shipmentId, { status });
  revalidatePath(`/${locale}/admin/shipments/${shipmentId}`);
  return { ok: getDictionary(locale).admin.saved };
}

export async function quickStatus(locale: string, shipmentId: string, status: ShipmentStatus) {
  const user = await requireShipmentAccess(locale, shipmentId);
  await addManualEvent({ shipmentId, status, userId: user.id, location: undefined });
  await audit(user.id, "event.add", "Shipment", shipmentId, { status, quick: true });
  revalidatePath(`/${locale}/admin`, "layout");
}

export async function toggleEventHidden(locale: string, eventId: string) {
  const user = await requireUser(locale, MANAGER_ROLES);
  const event = await prisma.statusEvent.findUniqueOrThrow({ where: { id: eventId } });
  await prisma.statusEvent.update({ where: { id: eventId }, data: { hidden: !event.hidden } });
  await recomputeStatus(event.shipmentId);
  await audit(user.id, event.hidden ? "event.show" : "event.hide", "Shipment", event.shipmentId, { eventId });
  revalidatePath(`/${locale}/admin/shipments/${event.shipmentId}`);
}

export async function toggleAutoSync(locale: string, shipmentId: string) {
  const user = await requireUser(locale, MANAGER_ROLES);
  const s = await prisma.shipment.findUniqueOrThrow({ where: { id: shipmentId } });
  await prisma.shipment.update({ where: { id: shipmentId }, data: { autoSync: !s.autoSync } });
  await audit(user.id, "shipment.autoSync", "Shipment", shipmentId, { autoSync: !s.autoSync });
  revalidatePath(`/${locale}/admin/shipments/${shipmentId}`);
}

export async function syncNow(locale: string, shipmentId: string) {
  const user = await requireUser(locale, MANAGER_ROLES);
  const result = await syncShipment(shipmentId);
  await audit(user.id, "shipment.sync", "Shipment", shipmentId, result as object);
  revalidatePath(`/${locale}/admin/shipments/${shipmentId}`);
}

export async function createStaff(locale: string, _: FormState, form: FormData): Promise<FormState> {
  const admin = await requireUser(locale, ["SUPER_ADMIN"]);
  const t = getDictionary(locale);
  const email = str(form, "email").toLowerCase();
  const role = str(form, "role") as Role;
  const password = str(form, "password");
  if (!email || !str(form, "name") || !ROLES.includes(role)) return { error: t.auth.required };
  if (password.length < 8) return { error: t.auth.passwordShort };
  if (await prisma.user.findUnique({ where: { email } })) return { error: t.auth.emailTaken };
  const user = await prisma.user.create({
    data: { email, name: str(form, "name"), phone: optStr(form, "phone"), role, passwordHash: await hashPassword(password) },
  });
  await audit(admin.id, "user.create", "User", user.id, { role });
  revalidatePath(`/${locale}/admin/users`);
  return { ok: t.admin.saved };
}

export async function updateUser(locale: string, userId: string, form: FormData) {
  const admin = await requireUser(locale, ["SUPER_ADMIN"]);
  const role = str(form, "role") as Role;
  // Never let the last super admin lock themselves out.
  if (userId === admin.id) return;
  await prisma.user.update({
    where: { id: userId },
    data: { role: ROLES.includes(role) ? role : undefined, active: form.get("active") === "on" },
  });
  await audit(admin.id, "user.update", "User", userId, { role, active: form.get("active") === "on" });
  revalidatePath(`/${locale}/admin/users`);
}

export async function saveCarrier(locale: string, form: FormData) {
  const admin = await requireUser(locale, ["SUPER_ADMIN"]);
  const id = optStr(form, "id");
  const data = {
    code: str(form, "code").toUpperCase(),
    name: str(form, "name"),
    adapter: str(form, "adapter") || "manual",
    active: form.get("active") === "on",
  };
  if (!data.code || !data.name) return;
  const carrier = id
    ? await prisma.carrier.update({ where: { id }, data })
    : await prisma.carrier.create({ data });
  await audit(admin.id, id ? "carrier.update" : "carrier.create", "Carrier", carrier.id, data);
  revalidatePath(`/${locale}/admin/carriers`);
}

export async function saveTariff(locale: string, form: FormData) {
  const admin = await requireUser(locale, MANAGER_ROLES);
  const id = optStr(form, "id");
  const data = {
    type: (str(form, "type") === "GROUND" ? "GROUND" : "AIR") as ShipmentType,
    destCountry: str(form, "destCountry"),
    baseFee: num(form, "baseFee") ?? 0,
    pricePerKg: num(form, "pricePerKg") ?? 0,
    currency: str(form, "currency") || "AMD",
    daysMin: Math.round(num(form, "daysMin") ?? 1),
    daysMax: Math.round(num(form, "daysMax") ?? 1),
    active: form.get("active") === "on",
  };
  if (!data.destCountry) return;
  const tariff = id ? await prisma.tariff.update({ where: { id }, data }) : await prisma.tariff.upsert({
    where: { type_destCountry: { type: data.type, destCountry: data.destCountry } },
    update: data,
    create: data,
  });
  await audit(admin.id, "tariff.save", "Tariff", tariff.id, { ...data });
  revalidatePath(`/${locale}/admin/tariffs`);
}
