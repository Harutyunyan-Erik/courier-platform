import { prisma } from "./db";

export async function managementOptions() {
  const [carriers, couriers, customers] = await Promise.all([
    prisma.carrier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "COURIER", active: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { name: "asc" }, take: 500 }),
  ]);
  return { carriers, couriers, customers };
}
