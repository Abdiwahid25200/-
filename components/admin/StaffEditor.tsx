"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PERMS,
  allStaff,
  removeStaff,
  saveStaff,
  type Can,
  type Perm,
  type StaffDoc,
} from "@/lib/staff";
import { useAuth } from "@/lib/auth";
import { createStaffLogin, toStaffEmail } from "@/lib/staffAuth";

/**
 * المساعدون — تُعطى الصلاحية **للبريد** فيعمل قبل أوّل دخول له.
 *
 * كل مربّع هنا باب: ما لم يُفتح لا يظهر تبويبه في لوحته أصلاً،
 * و`firestore.rules` ترفض كتابته حتى لو حاول من خارج الموقع.
 *
 * ⚠️ هذا التبويب لصاحبة المتجر وحدها — ولو رآه مساعد لفتح لنفسه
 *    كل الأبواب في ثانية. القواعد تمنع كتابة `staff` على غير الأدمن.
 */
export default function StaffEditor() {
  const { user } = useAuth();
  const [rows, setRows] = useState<(StaffDoc & { id: string })[] | null>(null);
  const [userName, setUserName] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => setRows(await allStaff()), []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * حسابٌ باسم وكلمة سرّ — للمساعد الذي لا يملك جوجل أو لا تريدين ربطه به.
   * يُصنع الحساب ثم تُفتح له أبوابه، فيدخل من `/admin` باسمه فقط.
   */
  async function makeLogin() {
    const u = userName.trim();
    if (!u || pass.length < 6) {
      setNote("Pick a username and a password of at least 6 characters.");
      return;
    }
    const id = toStaffEmail(u);
    if ((rows ?? []).some((r) => r.id === id)) {
      setNote("This username is already on the list.");
      return;
    }

    setBusy("login");
    const made = await createStaffLogin(u, pass);

    if (!made.ok) {
      setBusy(null);
      setNote(
        made.reason === "taken"
          ? "That username is taken — pick another."
          : made.reason === "weak"
            ? "Password too short — at least 6 characters."
            : "Could not create the login. Check your connection.",
      );
      return;
    }

    const ok = await saveStaff(made.email, {
      email: made.email,
      active: true,
      can: { orders: true },
    });
    setBusy(null);
    if (!ok) return setNote("Login created, but saving the permissions failed.");

    setNote(`Done — ${u} signs in at /admin with the password you set.`);
    setUserName("");
    setPass("");
    void load();
  }

  async function toggle(r: StaffDoc & { id: string }, p: Perm) {
    const can: Can = { ...(r.can ?? {}), [p]: !(r.can?.[p] === true) };
    setRows((list) => (list ?? []).map((x) => (x.id === r.id ? { ...x, can } : x)));
    setBusy(r.id);
    const ok = await saveStaff(r.id, { email: r.id, can });
    setBusy(null);
    if (!ok) {
      setNote("Could not save — check your access.");
      void load();
    }
  }

  async function setActive(r: StaffDoc & { id: string }, active: boolean) {
    setRows((list) => (list ?? []).map((x) => (x.id === r.id ? { ...x, active } : x)));
    setBusy(r.id);
    await saveStaff(r.id, { email: r.id, active });
    setBusy(null);
  }

  async function drop(r: StaffDoc & { id: string }) {
    if (!confirm(`Remove ${r.id} from the panel?`)) return;
    setBusy(r.id);
    const ok = await removeStaff(r.id);
    setBusy(null);
    if (!ok) return setNote("Could not remove — check your access.");
    void load();
  }

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange";

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-card border border-dashed border-line p-3 text-sm text-muted">
        Create a login below, then tick what that helper may open. They sign in
        at <strong>/admin</strong> with the username only. Your own account is
        not listed here and cannot be removed.
      </p>

      <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-3">
        <p className="font-bold">Create a username &amp; password</p>
        <p className="text-sm text-muted">
          For a helper with no Google account. They sign in at{" "}
          <strong>/admin</strong> with the username only.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Username"
            dir="ltr"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={`${field} min-w-32 flex-1`}
          />
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Password"
            type="text"
            dir="ltr"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={`${field} min-w-32 flex-1`}
          />
        </div>
        {userName.trim() && (
          <p className="num text-xs text-muted" dir="ltr">
            {toStaffEmail(userName)}
          </p>
        )}
        <button
          type="button"
          onClick={() => void makeLogin()}
          disabled={busy === "login" || !userName.trim() || pass.length < 6}
          className="min-h-12 rounded-card bg-orange px-4 font-bold text-onaccent disabled:opacity-50"
        >
          {busy === "login" ? "Creating…" : "Create login"}
        </button>
        <p className="text-xs text-muted">
          Write the password down — it cannot be read again. To change it,
          remove the helper and create a new username.
        </p>
      </div>

      {note && (
        <p className="rounded-card border border-line bg-surface p-2.5 text-sm font-medium">
          {note}
        </p>
      )}

      {rows === null ? (
        <p className="p-4 text-center text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
          No helpers yet.
        </p>
      ) : (
        rows.map((r) => (
          <article key={r.id} className="rounded-card border border-line bg-surface p-3">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 break-all font-bold" dir="ltr">
                {r.id}
                {r.id === (user?.email ?? "").toLowerCase() && (
                  <span className="ms-2 text-xs font-medium text-muted">(you)</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => void setActive(r, !(r.active !== false))}
                className={`min-h-10 rounded-full border px-3 text-sm font-bold ${
                  r.active !== false
                    ? "border-orange text-orange"
                    : "border-line text-muted"
                }`}
              >
                {r.active !== false ? "Active" : "Paused"}
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-1.5">
              {PERMS.map((p) => (
                <label key={p.v} className="flex items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={r.can?.[p.v] === true}
                    disabled={busy === r.id}
                    onChange={() => void toggle(r, p.v)}
                    className="size-5 shrink-0 accent-orange"
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void drop(r)}
              disabled={busy === r.id}
              className="mt-3 min-h-11 w-full rounded-card border border-line font-bold text-danger disabled:opacity-50"
            >
              Remove
            </button>
          </article>
        ))
      )}
    </div>
  );
}
