import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, getDictionary } from "@/lib/i18n";
import { createStaff, updateUser } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";

const ROLES: Role[] = ["SUPER_ADMIN", "MANAGER", "COURIER", "CUSTOMER"];

export default async function UsersPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ role?: string }> }) {
  const { locale } = await params;
  const { role } = await searchParams;
  const t = getDictionary(locale);
  const me = await requireUser(locale, ["SUPER_ADMIN"]);
  const users = await prisma.user.findMany({
    where: ROLES.includes(role as Role) ? { role: role as Role } : {},
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    take: 300,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.admin.users}</h1>
      <div className="card">
        <h2 className="mb-4 font-semibold">{t.admin.newUser}</h2>
        <ActionForm action={createStaff.bind(null, locale)} submitLabel={t.admin.create} className="grid gap-3 md:grid-cols-5" resetOnSuccess>
          <input name="name" placeholder={t.auth.name} required className="input" />
          <input name="email" type="email" placeholder={t.auth.email} required className="input" />
          <input name="phone" placeholder={t.auth.phone} className="input" />
          <input name="password" type="password" placeholder={t.auth.password} required minLength={8} className="input" />
          <select name="role" defaultValue="COURIER" className="input">
            {ROLES.map((r) => <option key={r} value={r}>{t.role[r]}</option>)}
          </select>
        </ActionForm>
      </div>
      <form className="flex gap-2">
        <select name="role" defaultValue={role ?? ""} className="input w-auto">
          <option value="">{t.admin.role}: {t.admin.all}</option>
          {ROLES.map((r) => <option key={r} value={r}>{t.role[r]}</option>)}
        </select>
        <button className="btn-secondary">🔍</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>{t.auth.name}</th><th>{t.auth.email}</th><th>{t.auth.phone}</th><th>{t.admin.role}</th><th>{t.admin.activeLabel}</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.name}<div className="text-xs text-slate-400">{formatDate(u.createdAt, locale, false)}</div></td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td colSpan={3}>
                  {u.id === me.id ? (
                    <span className="text-slate-500">{t.role[u.role]}</span>
                  ) : (
                    <form action={updateUser.bind(null, locale, u.id)} className="flex flex-wrap items-center gap-3">
                      <select name="role" defaultValue={u.role} className="input w-auto">
                        {ROLES.map((r) => <option key={r} value={r}>{t.role[r]}</option>)}
                      </select>
                      <input type="checkbox" name="active" defaultChecked={u.active} />
                      <button className="btn-secondary">{t.admin.save}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
