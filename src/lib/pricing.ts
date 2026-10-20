import type { ShipmentType } from "@prisma/client";
import { prisma } from "./db";

export async function quote(type: ShipmentType, destCountry: string, weightKg: number) {
  const tariff = await prisma.tariff.findFirst({
    where: { type, destCountry: { equals: destCountry, mode: "insensitive" }, active: true },
  });
  if (!tariff || !(weightKg > 0)) return null;
  // Charge by every started half kilogram.
  const billable = Math.ceil(weightKg * 2) / 2;
  const price = Number(tariff.baseFee) + Number(tariff.pricePerKg) * billable;
  return { price: Math.round(price), currency: tariff.currency, daysMin: tariff.daysMin, daysMax: tariff.daysMax };
}

export async function tariffCountries() {
  const rows = await prisma.tariff.findMany({ where: { active: true }, select: { destCountry: true }, distinct: ["destCountry"], orderBy: { destCountry: "asc" } });
  return rows.map((r) => r.destCountry);
}
