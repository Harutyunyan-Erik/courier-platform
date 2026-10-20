import { PrismaClient, type ShipmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function user(email: string, name: string, role: "SUPER_ADMIN" | "MANAGER" | "COURIER" | "CUSTOMER", password: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role, passwordHash: await bcrypt.hash(password, 10) },
  });
}

async function main() {
  const admin = await user("admin@example.com", "Admin", "SUPER_ADMIN", process.env.SEED_ADMIN_PASSWORD ?? "admin12345");
  if (process.env.SEED_DEMO === "false") return;

  await user("manager@example.com", "Anna Manager", "MANAGER", "manager12345");
  const courier = await user("courier@example.com", "Armen Courier", "COURIER", "courier12345");
  const customer = await user("customer@example.com", "Davit Customer", "CUSTOMER", "customer12345");

  const carriers = [
    { code: "DHL", name: "DHL Express", adapter: "dhl" },
    { code: "FEDEX", name: "FedEx", adapter: "fedex" },
    { code: "UPS", name: "UPS", adapter: "ups" },
    { code: "HAYPOST", name: "Haypost", adapter: "track17" },
    { code: "DEMO", name: "Demo carrier", adapter: "demo" },
  ];
  for (const c of carriers) await prisma.carrier.upsert({ where: { code: c.code }, update: {}, create: c });
  const demo = await prisma.carrier.findUniqueOrThrow({ where: { code: "DEMO" } });

  const tariffs = [
    { type: "AIR", destCountry: "Russia", baseFee: 5000, pricePerKg: 4500, daysMin: 3, daysMax: 5 },
    { type: "AIR", destCountry: "USA", baseFee: 8000, pricePerKg: 9500, daysMin: 5, daysMax: 8 },
    { type: "AIR", destCountry: "Germany", baseFee: 7000, pricePerKg: 7500, daysMin: 4, daysMax: 7 },
    { type: "AIR", destCountry: "France", baseFee: 7000, pricePerKg: 7800, daysMin: 4, daysMax: 7 },
    { type: "GROUND", destCountry: "Russia", baseFee: 3000, pricePerKg: 1200, daysMin: 7, daysMax: 12 },
    { type: "GROUND", destCountry: "Georgia", baseFee: 2500, pricePerKg: 600, daysMin: 2, daysMax: 3 },
    { type: "GROUND", destCountry: "Armenia", baseFee: 1500, pricePerKg: 200, daysMin: 1, daysMax: 2 },
  ] as const;
  for (const t of tariffs) {
    await prisma.tariff.upsert({ where: { type_destCountry: { type: t.type, destCountry: t.destCountry } }, update: {}, create: { ...t } });
  }

  if ((await prisma.shipment.count()) > 0) return;
  const now = Date.now();
  const h = (n: number) => new Date(now - n * 3600_000);
  const samples: { tn: string; type: "AIR" | "GROUND"; dest: [string, string]; events: [ShipmentStatus, number, string, string][]; carrierId?: string; courier?: boolean }[] = [
    {
      tn: "EC-A7KQ2M9XH",
      type: "AIR",
      dest: ["Moscow", "Russia"],
      events: [
        ["CREATED", 50, "", "Yerevan, AM"],
        ["PICKED_UP", 46, "Picked up by courier", "Yerevan, AM"],
        ["AT_HUB", 30, "Arrived at sort facility", "Yerevan, AM"],
        ["IN_TRANSIT", 20, "Departed on flight", "Zvartnots, AM"],
        ["CUSTOMS", 4, "Customs clearance", "Moscow, RU"],
      ],
    },
    {
      tn: "EC-G3PLW8ZQ2",
      type: "GROUND",
      dest: ["Gyumri", "Armenia"],
      courier: true,
      events: [
        ["CREATED", 6, "", "Yerevan, AM"],
        ["PICKED_UP", 3, "", "Yerevan, AM"],
      ],
    },
    { tn: "EC-AD3M0TRK5", type: "AIR", dest: ["Paris", "France"], carrierId: demo.id, events: [["CREATED", 1, "", "Yerevan, AM"]] },
  ];
  for (const s of samples) {
    await prisma.shipment.create({
      data: {
        trackingNumber: s.tn,
        type: s.type,
        currentStatus: s.events[s.events.length - 1][0],
        carrierId: s.carrierId,
        senderName: "Davit Customer",
        senderPhone: "+374 91 000000",
        originCity: "Yerevan",
        originCountry: "Armenia",
        recipientName: "Maria Ivanova",
        recipientPhone: "+7 900 000 0000",
        recipientAddress: "Lenina 1",
        destCity: s.dest[0],
        destCountry: s.dest[1],
        weightKg: 2.5,
        customerId: customer.id,
        courierId: s.courier ? courier.id : undefined,
        events: {
          create: s.events.map(([status, hoursAgo, description, location]) => ({
            status,
            description: description || null,
            location,
            occurredAt: h(hoursAgo),
            source: status === "CREATED" ? "SYSTEM" : "MANUAL",
            createdById: admin.id,
          })),
        },
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
