"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { allChats, listenAdminChat, replyChat, type ChatRow } from "@/lib/adminChat";
import { MAX_LEN, type ChatMessage } from "@/lib/chat";
import {
  IconChecks,
  IconChevron,
  IconPaperPlane,
  IconSearch,
} from "@/components/icons";

/**
 * الدردشة — **بشكل واتساب** (طلب صاحبة المتجر).
 *
 * 💡 السبب ليس الجمال: زبائنها يكتبون لها من واتساب كل يوم، وهي تردّ
 *    منه. فأيّ شكلٍ آخر يحتاج تعلّماً، وهذا يحتاج صفراً — قائمةٌ فيها
 *    حرفٌ دائريّ واسمٌ وآخرُ سطرٍ ووقتُه وشارةٌ خضراء، ثم محادثةٌ
 *    بفقاعاتٍ لها ذيول على أرضٍ مُنقّطة.
 *
 * ⚠️ والترتيب هو الميزة: من ضغط «أريد التحدّث مع شخص» فوق الجميع، ثم
 *    من آخر سطرٍ فيه من الزبون — أي من ينتظر ردّك — ثم المردود عليها.
 *
 * ⚠️ والاستماع للمحادثة المفتوحة **وحدها** — لا لمئة محادثة معاً.
 */

/** لونُ الحرف الدائريّ — ثابتٌ لكل زبون فيُعرَف من لونه قبل اسمه */
const TINTS = [
  "#0f7a4d",
  "#123262",
  "#8a5a00",
  "#7b2d5e",
  "#1f6f7a",
  "#8a3324",
  "#4a3a8a",
  "#2f6b1f",
];

const tintOf = (key: string) => {
  let n = 0;
  for (let i = 0; i < key.length; i++) n = (n * 31 + key.charCodeAt(i)) >>> 0;
  return TINTS[n % TINTS.length];
};

const initials = (name: string) =>
  name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

/** وقتٌ قصير في القائمة: اليوم ⇐ الساعة · أمس ⇐ Yesterday · وإلا التاريخ */
function shortTime(d: Date | null) {
  if (!d) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
}

const clock = (d: Date | null) =>
  d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";

function dayLabel(d: Date) {
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

export default function ChatsEditor() {
  const [rows, setRows] = useState<ChatRow[] | null>(null);
  const [open, setOpen] = useState<ChatRow | null>(null);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
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

  useEffect(() => {
    if (!open) return;
    setMsgs([]);
    return listenAdminChat(open.uid, setMsgs, () => setErr(true));
  }, [open]);

  /* الصفحة خلف المحادثة لا تتحرّك — وإلا انزلقت اللوحة تحتها بالإصبع */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
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

  /* ═══ محادثة مفتوحة ═══ */
  if (open) {
    let lastDay = "";

    /* ⚠️ **ملء الشاشة كواتساب**: `fixed inset-0` فوق كل شيء — تختفي
       قائمة المحادثات وترويسة اللوحة وشريط التبويبات معاً. محادثةٌ
       داخل إطارٍ فيه تبويبات لا تُشبه واتساب مهما شابهتها فقاعاتها. */
    return (
      <div className="adm fixed inset-0 z-50 flex flex-col bg-bg">
        <div
          className="flex items-center gap-3 border-b border-line bg-surface px-3 py-2"
          style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Back"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted"
          >
            <IconChevron className="size-5 rotate-180 rtl:rotate-0" />
          </button>
          <Avatar name={who(open)} seed={open.uid} size={40} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold leading-tight">{who(open)}</span>
            <span className="block truncate text-xs text-muted" dir="ltr">
              {open.email || "customer"}
            </span>
          </span>
        </div>

        <div className="chat-ground flex flex-1 flex-col gap-1.5 overflow-y-auto p-3">
          {msgs.length === 0 ? (
            <span className="chat-day mt-4">No messages yet</span>
          ) : (
            msgs.map((m, i) => {
              const d = m.createdAt;
              // ذيل الفقاعة لأوّل رسالة في كل مجموعة — كما في واتساب
              const first = i === 0 || msgs[i - 1].from !== m.from;
              const day = d ? dayLabel(d) : "";
              const showDay = !!day && day !== lastDay;
              if (showDay) lastDay = day;

              return (
                <div key={m.id} className="contents">
                  {showDay && <span className="chat-day my-2">{day}</span>}
                  <div
                    className={`bub ${first ? "bub-tail" : ""} ${
                      m.from === "admin" ? "bub-me self-end" : "bub-them self-start"
                    }`}
                  >
                    <span className="whitespace-pre-wrap">{m.text}</span>
                    <span className="bub-time num">{clock(d)}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <div
          className="flex items-end gap-2 border-t border-line bg-surface px-3 py-2"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder="Message"
            className="max-h-28 min-h-11 min-w-0 flex-1 resize-none rounded-[22px] border border-line bg-bg px-4 py-2.5 outline-none focus:border-orange"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy || !text.trim()}
            aria-label="Send"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-orange text-onaccent disabled:opacity-40"
          >
            <IconPaperPlane className="size-5" />
          </button>
        </div>

        {err && (
          <p className="mx-3 mb-2 rounded-card border border-danger/40 bg-danger/5 p-2 text-sm">
            Could not send. Check your access and try again.
          </p>
        )}
      </div>
    );
  }

  /* ═══ قائمة المحادثات ═══ */
  const sorted = [...rows]
    .filter((c) => {
      const s = q.trim().toLowerCase();
      return (
        !s || who(c).toLowerCase().includes(s) || c.lastText.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
      const rank = (c: ChatRow) => (c.needsHuman ? 0 : c.lastFrom === "user" ? 1 : 2);
      return rank(a) - rank(b) || (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0);
    });

  const waiting = rows.filter((c) => c.lastFrom === "user").length;

  return (
    <div className="-mx-4 flex flex-col">
      <div className="relative px-3 pb-2">
        <IconSearch className="pointer-events-none absolute inset-y-0 start-6 my-auto size-4 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search chats"
          aria-label="Search chats"
          className="min-h-11 w-full rounded-[22px] border border-line bg-bg pe-4 ps-11 outline-none focus:border-orange"
        />
      </div>

      {err && (
        <p className="mx-3 mb-2 rounded-card border border-danger/40 bg-danger/5 p-3 text-sm">
          Could not read the conversations. Check your access, then press Refresh.
        </p>
      )}

      {waiting > 0 && (
        <p className="px-4 pb-1 text-sm text-muted">
          <strong className="num text-success">{waiting}</strong> waiting for your
          reply
        </p>
      )}

      {sorted.length === 0 ? (
        <p className="m-3 rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
          {q
            ? "Nothing matches that search."
            : "No conversations yet. They appear here the moment a customer writes."}
        </p>
      ) : (
        <ul className="bg-surface">
          {sorted.map((c) => {
            const unread = c.lastFrom === "user";
            return (
              <li key={c.uid}>
                <button
                  type="button"
                  onClick={() => setOpen(c)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-start"
                >
                  <Avatar name={who(c)} seed={c.uid} size={48} />

                  <span className="min-w-0 flex-1 border-b border-line pb-2.5">
                    <span className="flex items-baseline gap-2">
                      <span className="min-w-0 flex-1 truncate font-bold">{who(c)}</span>
                      <span
                        className={`num shrink-0 text-xs ${
                          unread ? "font-bold text-success" : "text-muted"
                        }`}
                      >
                        {shortTime(c.at)}
                      </span>
                    </span>

                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm text-muted">
                        {c.lastFrom === "admin" && (
                          <IconChecks className="me-1 inline-block size-3.5 align-[-2px] text-success" />
                        )}
                        {c.lastText || "—"}
                      </span>

                      {c.needsHuman ? (
                        <span className="shrink-0 rounded-full bg-danger px-2 py-0.5 text-[0.7rem] font-bold text-white">
                          Wants a person
                        </span>
                      ) : unread ? (
                        <span
                          aria-label="Unanswered"
                          className="size-2.5 shrink-0 rounded-full bg-success"
                        />
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => void load()}
        className="m-3 min-h-11 rounded-card border border-line text-sm font-bold"
      >
        Refresh
      </button>
    </div>
  );
}

/** الحرف الدائريّ — لونه ثابتٌ لصاحبه، فيُعرَف قبل أن يُقرأ اسمه */
function Avatar({ name, seed, size }: { name: string; seed: string; size: number }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        background: tintOf(seed),
        fontSize: size * 0.36,
      }}
    >
      {initials(name)}
    </span>
  );
}
