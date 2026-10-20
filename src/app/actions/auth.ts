"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, STAFF_ROLES, verifyPassword } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { str, type FormState } from "@/lib/forms";

function safeNext(next: string, fallback: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function login(locale: string, _: FormState, form: FormData): Promise<FormState> {
  const t = getDictionary(locale);
  const email = str(form, "email").toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(str(form, "password"), user.passwordHash))) return { error: t.auth.invalid };
  if (!user.active) return { error: t.admin.blocked };
  await createSession(user);
  const home = STAFF_ROLES.includes(user.role) ? `/${locale}/admin` : `/${locale}/account`;
  redirect(safeNext(str(form, "next"), home));
}

export async function register(locale: string, _: FormState, form: FormData): Promise<FormState> {
  const t = getDictionary(locale);
  const email = str(form, "email").toLowerCase();
  const name = str(form, "name");
  const password = str(form, "password");
  if (!email || !name || !password) return { error: t.auth.required };
  if (password.length < 8) return { error: t.auth.passwordShort };
  if (await prisma.user.findUnique({ where: { email } })) return { error: t.auth.emailTaken };
  const user = await prisma.user.create({
    data: { email, name, phone: str(form, "phone") || null, passwordHash: await hashPassword(password), locale, role: "CUSTOMER" },
  });
  await createSession(user);
  redirect(`/${locale}/account`);
}

export async function logout(locale: string) {
  await destroySession();
  redirect(`/${locale}`);
}
