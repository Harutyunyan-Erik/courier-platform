import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export async function audit(
  userId: string | null,
  action: string,
  entity: string,
  entityId: string,
  data?: Prisma.InputJsonValue,
) {
  await prisma.auditLog.create({ data: { userId, action, entity, entityId, data } });
}
