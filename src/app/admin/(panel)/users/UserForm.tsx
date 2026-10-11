"use client";

import { useState, type FormEvent } from "react";
import { api, type AdminUser } from "@/lib/admin-api";
import { saveErrors } from "@/components/admin/useApi";
import { Button, Modal, SelectField, TextField, Toggle, useToast } from "@/components/admin/ui";

export const PASSWORD_HINT = "At least 12 characters, including an upper-case letter, a lower-case letter and a number.";
export const ROLE_HINT: Record<AdminUser["role"], string> = {
  admin: "Administrators can do everything, including managing users, site settings and the activity log.",
  editor: "Editors manage content (sculptures, categories, media, pages, menus, enquiries) but cannot manage users, site settings or view the activity log.",
};

export default function UserForm({
  user,
  isSelf,
  onClose,
  onSaved,
}: {
  /** null = create a new account. */
  user: AdminUser | null;
  isSelf: boolean;
  onClose: () => void;
  onSaved: (saved: AdminUser, message: string) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<AdminUser["role"]>(user?.role ?? "editor");
  const [active, setActive] = useState(user?.is_active ?? true);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    const local: Record<string, string> = {};
    if (!name.trim()) local.name = "Please enter a name.";
    if (!user && !email.trim()) local.email = "Please enter an email address.";
    if (!user && !password) local.password = "Please set a password.";
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    setSaving(true);
    try {
      if (user) {
        const body: Record<string, unknown> = { name: name.trim(), role, is_active: active };
        if (password) body.password = password;
        const res = await api.put<{ data: AdminUser }>(`/admin/users/${user.id}`, body);
        onSaved(res.data, `Updated ${res.data.name}.`);
      } else {
        const res = await api.post<{ data: AdminUser }>("/admin/users", { name: name.trim(), email: email.trim(), role, password });
        onSaved(res.data, `Created an ${res.data.role} account for ${res.data.name}.`);
      }
    } catch (err) {
      const { fields, message } = saveErrors(err);
      setErrors(fields);
      // Server-side guards (e.g. "at least one active administrator") arrive as field errors.
      toast({ tone: "error", message: fields.role ?? fields.user ?? message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={user ? "Edit user" : "Add user"}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="admin-user-form" loading={saving}>
            {user ? "Save changes" : "Create account"}
          </Button>
        </>
      }
    >
      <form id="admin-user-form" onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Full name" required maxLength={120} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <TextField
          label="Email"
          type="email"
          required={!user}
          maxLength={190}
          autoComplete="off"
          value={email}
          disabled={!!user}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          hint={user ? "The sign-in email cannot be changed." : "Used to sign in to the CMS."}
        />
        <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value as AdminUser["role"])} error={errors.role} hint={ROLE_HINT[role]}>
          <option value="editor">Editor</option>
          <option value="admin">Administrator</option>
        </SelectField>
        {isSelf && role !== "admin" && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">You are changing your own role. You will lose access to this page after saving.</p>
        )}
        <TextField
          label={user ? "New password" : "Password"}
          type="password"
          required={!user}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={user ? `Leave blank to keep the current password. ${PASSWORD_HINT}` : PASSWORD_HINT}
        />
        {user && (
          <div className="rounded-lg border border-gold/20 bg-white p-4">
            <Toggle
              label="Account active"
              checked={active}
              onChange={setActive}
              hint={isSelf ? "Deactivating your own account will sign you out." : "Inactive accounts cannot sign in."}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
