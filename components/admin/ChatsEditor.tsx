"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { allChats, listenAdminChat, replyChat, type ChatRow } from "@/lib/adminChat";
import { MAX_LEN, type ChatMessage } from "@/lib/chat";
import { IconChevron } from "@/components/icons";

/**
 * الدردشة في اللوحة — قائمة المحادثات، وفتحُ واحدة، والردّ عليها.
 *
 * 💡 **الترتيب هو الميزة**: المحادثة التي آخر سطرٍ فيها من الزبون تعني
 *    «تنتظر ردّك»، ومن ضغط «أريد التحدّث مع شخص» يُرفع فوق الجميع.
 *    فلا تفتحين عشرين محادثة لتعرفي أيّها يحتاجك.
 *
 * ⚠️ والرسائل لحظية (`onSnapshot`): الزبون يكتب فيظهر أمامك بلا تحديث.
 */
export default function ChatsEditor() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ChatRow[] | null>(null);
  const [open, setOpen] = useState<ChatRow | null>(null);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setErr(false);
    try {
      setRows(await allChats());
    } catch {
      setErr(true);
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // الاستماع للمحادثة المفتوحة وحدها — لا نستمع لمئة محادثة معاً
  useEffect(() => {
    if (!open) return;
    setMsgs([]);
    return listenAdminChat(open.uid, setMsgs, () => setErr(true));
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  async function send() {
    if (!open || !text.trim()) return;
    setBusy(true);
    const ok = await replyChat(open.uid, text, open.name, open.email);
    setBusy(false);
    if (ok) {
      setText("");
      void load();
    } else setErr(true);
  }

  if (rows === null)
    return <p className="p-4 text-center text-sm text-muted">Loading…</p>;

  const who = (c: ChatRow) => c.name || c.email || c.uid.slice(0, 6);

  /* بانتظار ردّك أوّلاً، ومن طلب إنساناً قبلهم جميعاً */
  const sorted = [...rows].sort((a, b) => {
    const rank = (c: ChatRow) => (c.needsHuman ? 0 : c.lastFrom === "user" ? 1 : 2);
    return rank(a) - rank(b);
  });
  const waiting = rows.filter((c) => c.lastFrom === "user").length;

  /* ── محادثة مفتوحة ── */
  if (open) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Back to conversations"
            className="flex size-11 shrink-0 items-center justify-center rounded-card border border-line text-lg text-muted"
          >
            <IconChevron className="size-5 rotate-180 rtl:rotate-0" />
          </button>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">{who(open)}</span>
            <span className="block truncate text-xs text-muted" dir="ltr">
              {open.email}
            </span>
          </span>
        </div>

        <div className="flex max-h-[55dvh] flex-col gap-2 overflow-y-auto rounded-card border border-line bg-bg p-3">
          {msgs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No messages yet.</p>
          ) : (
            msgs.map((m) => (
              <p
                key={m.id}
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-[16px] px-3 py-2 text-sm ${
                  m.from === "admin"
                    ? "self-end bg-orange text-onaccent"
                    : "self-start border border-line bg-surface"
                }`}
              >
                {m.text}
              </p>
            ))
          )}
          <div ref={endRef} />
        </div>

        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            rows={2}
            placeholder="Write your reply…"
            className="min-h-12 min-w-0 flex-1 resize-none rounded-card border border-line bg-bg p-3 outline-none focus:border-orange"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy || !text.trim()}
            className="min-h-12 shrink-0 rounded-card bg-orange px-5 font-bold text-onaccent disabled:opacity-50"
          >
            {busy ? "…" : "Send"}
          </button>
        </div>

        {err && (
          <p className="rounded-card border border-danger/40 bg-danger/5 p-3 text-sm">
            Could not send. Check your access and try again.
          </p>
        )}

        <p className="text-xs text-muted">
          Replies are signed as the store. Customers can never write a message
          signed as the store — the database rules block it.
        </p>
      </div>
    );
  }

  /* ── قائمة المحادثات ── */
  return (
    <div className="flex flex-col gap-3">
      {err && (
        <p className="rounded-card border border-danger/40 bg-danger/5 p-3 text-sm">
          Could not read the conversations. Check your access, then press
          Refresh.
        </p>
      )}

      <p className="text-sm text-muted">
        {waiting > 0 ? (
          <>
            <strong className="num text-orange">{waiting}</strong> waiting for
            your reply.
          </>
        ) : (
          "Everyone has been answered."
        )}
      </p>

      {sorted.length === 0 ? (
        <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
          No conversations yet. They appear here the moment a customer writes.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {sorted.map((c) => (
            <li key={c.uid}>
              <button
                type="button"
                onClick={() => setOpen(c)}
                className={`flex w-full items-center gap-3 rounded-card border bg-surface p-3 text-start ${
                  c.needsHuman
                    ? "border-danger"
                    : c.lastFrom === "user"
                      ? "border-orange"
                      : "border-line"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{who(c)}</span>
                  <span className="block truncate text-sm text-muted">
                    {c.lastFrom === "admin" && "↩ "}
                    {c.lastText || "—"}
                  </span>
                </span>

                {c.needsHuman ? (
                  <span className="shrink-0 rounded-full border border-danger px-2.5 py-1 text-xs font-bold text-danger">
                    Wants a person
                  </span>
                ) : c.lastFrom === "user" ? (
                  <span className="shrink-0 rounded-full border border-orange px-2.5 py-1 text-xs font-bold text-orange">
                    Reply
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => void load()}
        className="min-h-11 rounded-card border border-line px-4 text-sm font-bold"
      >
        Refresh
      </button>

      {!user && (
        <p className="text-xs text-muted">Sign in to reply.</p>
      )}
    </div>
  );
}
