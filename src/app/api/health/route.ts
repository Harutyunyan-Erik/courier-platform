import { prisma } from "@/lib/db";

// Quick setup check: open /api/health after deploying. Shows only whether settings exist, never their values.
export async function GET() {
  const checks: Record<string, boolean | string> = {
    AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    APP_URL: Boolean(process.env.APP_URL),
    CRON_SECRET: Boolean(process.env.CRON_SECRET),
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
    checks.adminExists = (await prisma.user.count({ where: { role: "SUPER_ADMIN" } })) > 0;
  } catch (err) {
    checks.database = err instanceof Error ? err.message.split("\n").find(Boolean)?.slice(0, 200) ?? "error" : "error";
  }
  const ok = checks.AUTH_SECRET === true && checks.database === true;
  return Response.json({ ok, ...checks }, { status: ok ? 200 : 500 });
}
