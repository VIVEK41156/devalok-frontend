"use client";

import { useCallback, useState } from "react";
import { Pencil, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { api, type AdminUser } from "@/lib/admin-api";
import { saveErrors, useApi } from "@/components/admin/useApi";
import { useAuth } from "@/components/admin/AuthProvider";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, Toggle, formatDate, useConfirm, useToast } from "@/components/admin/ui";
import UserForm, { PASSWORD_HINT, ROLE_HINT } from "./UserForm";

function firstError(e: unknown) {
  const { fields, message } = saveErrors(e);
  return Object.values(fields)[0] ?? message;
}

export default function UsersPage() {
  const { user } = useAuth();
  if (!user) return <LoadingState />;
  if (user.role !== "admin") {
    return (
      <>
        <PageHeader title="Admin Users" />
        <Card>
          <EmptyState title="Administrators only" description="Managing CMS accounts is limited to administrators. Ask an administrator if you need access changed." />
        </Card>
      </>
    );
  }
  return <UsersManager me={user} />;
}

function UsersManager({ me }: { me: AdminUser }) {
  const { refresh } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const [editing, setEditing] = useState<AdminUser | "new" | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { data, error, loading, reload, setData } = useApi(() => api.get<{ data: AdminUser[] }>("/admin/users"), []);
  const users = data?.data ?? [];

  const closeForm = useCallback(() => setEditing(null), []);

  const upsert = (u: AdminUser) => setData((d) => (d ? { data: d.data.some((x) => x.id === u.id) ? d.data.map((x) => (x.id === u.id ? u : x)) : [...d.data, u].sort((a, b) => a.name.localeCompare(b.name)) } : d));

  const onSaved = async (saved: AdminUser, message: string) => {
    setEditing(null);
    upsert(saved);
    toast({ tone: "success", message });
    if (saved.id === me.id) await refresh();
  };

  const toggleActive = async (u: AdminUser, next: boolean) => {
    if (!next) {
      const ok = await confirm({
        title: "Deactivate account?",
        message: `${u.name} will no longer be able to sign in. You can reactivate the account later.`,
        confirmLabel: "Deactivate",
        danger: true,
      });
      if (!ok) return;
    }
    setBusyId(u.id);
    try {
      const res = await api.put<{ data: AdminUser }>(`/admin/users/${u.id}`, { is_active: next });
      upsert(res.data);
      toast({ tone: "success", message: next ? `${u.name} can sign in again.` : `${u.name} has been deactivated.` });
      if (u.id === me.id) await refresh();
    } catch (e) {
      toast({ tone: "error", message: firstError(e) });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (u: AdminUser) => {
    const ok = await confirm({
      title: "Delete account?",
      message: `${u.name} (${u.email}) will be permanently removed. Their past activity stays in the log.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusyId(u.id);
    try {
      await api.del(`/admin/users/${u.id}`);
      setData((d) => (d ? { data: d.data.filter((x) => x.id !== u.id) } : d));
      toast({ tone: "success", message: `Deleted ${u.name}.` });
    } catch (e) {
      toast({ tone: "error", message: firstError(e) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Admin Users"
        description="People who can sign in to this CMS. Editors manage content; only administrators can manage users, site settings and the activity log."
        actions={
          <Button icon={<UserPlus size={16} />} onClick={() => setEditing("new")}>
            Add user
          </Button>
        }
      />

      <Card padded={false}>
        {loading && !data ? (
          <LoadingState label="Loading users…" />
        ) : error && !data ? (
          <div className="p-5">
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No users yet"
            action={
              <Button icon={<UserPlus size={16} />} onClick={() => setEditing("new")}>
                Add user
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-gold/15 text-xs uppercase tracking-wider text-mist">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Role
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Last sign-in
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {users.map((u) => {
                  const self = u.id === me.id;
                  const busy = busyId === u.id;
                  return (
                    <tr key={u.id} className={u.is_active ? "" : "bg-parchment/40"}>
                      <td className="px-5 py-3">
                        <p className="flex flex-wrap items-center gap-2 font-semibold text-plum">
                          {u.name}
                          {self && <Badge tone="gold">You</Badge>}
                        </p>
                        <p className="break-all text-xs text-mist">{u.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        {u.role === "admin" ? (
                          <Badge tone="info">
                            <ShieldCheck size={12} aria-hidden /> Administrator
                          </Badge>
                        ) : (
                          <Badge>Editor</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Toggle label={u.is_active ? "Active" : "Inactive"} checked={u.is_active} onChange={(v) => busyId === null && toggleActive(u, v)} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-plum/70">{u.last_login_at ? formatDate(u.last_login_at) : <span className="text-mist">Never</span>}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" className="px-2.5 py-2" aria-label={`Edit ${u.name}`} icon={<Pencil size={15} />} onClick={() => setEditing(u)} disabled={busy} />
                          <Button
                            variant="ghost"
                            className="px-2.5 py-2 text-red-700 hover:bg-red-50 hover:text-red-800"
                            aria-label={self ? "You cannot delete your own account" : `Delete ${u.name}`}
                            title={self ? "You cannot delete your own account" : undefined}
                            icon={<Trash2 size={15} />}
                            onClick={() => remove(u)}
                            disabled={busy || self}
                            loading={busy}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card title="Roles">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-plum">Administrator</dt>
              <dd className="text-mist">{ROLE_HINT.admin}</dd>
            </div>
            <div>
              <dt className="font-semibold text-plum">Editor</dt>
              <dd className="text-mist">{ROLE_HINT.editor}</dd>
            </div>
          </dl>
        </Card>
        <Card title="Passwords">
          <p className="text-sm text-mist">{PASSWORD_HINT} Passwords are stored securely and are never shown here. At least one active administrator must always remain.</p>
        </Card>
      </div>

      {editing && <UserForm key={editing === "new" ? "new" : editing.id} user={editing === "new" ? null : editing} isSelf={editing !== "new" && editing.id === me.id} onClose={closeForm} onSaved={onSaved} />}
    </>
  );
}
