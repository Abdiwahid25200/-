"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import {
  listenChat,
  lastSeen,
  markSeen,
  sendChatMessage,
  unreadCount,
  MAX_LEN,
  type ChatMessage,
} from "@/lib/chat";
import { site } from "@/lib/content";
import { faqSlots, pick, readFaq, type FaqDoc, type FaqKey } from "@/lib/faq";
import Logo from "./Logo";
import { IconChatLine, IconClose, IconGoogle, IconSend } from "./icons";

/** ارتفاع القائمة السفلية العائمة — نجلس فوقها فلا يتغطّى شيء */
/**
 * ارتفاع الزرّ العائم — قيمته في `globals.css` لا هنا، لأنه يرتفع تلقائياً
 * فوق شريط تأكيد الطلب متى ظهر (`body.has-buybar`) فلا يغطّي أحدهما الآخر.
 */
const ABOVE_NAV = "var(--chat-bottom)";

/** لافتة الترحيب تُقال مرّة في الزيارة — لا في كل صفحة */
const TEASER_KEY = "rs-chat-teaser";

/**
 * الدردشة المباشرة — نافذة تنزلق من الجانب الأيمن.
 *
 * ليست خدمة خارجية: الرسائل في Firestore الخاص بالمتجر، تصل صاحبته
 * لحظياً وتردّ من لوحة الإدارة. راجعي `lib/chat.ts` للتفصيل.
 *
 * ثلاث حالات تُعرض بلا انكسار:
 * ① Firebase غير مضبوط ⇒ القنوات البديلة (واتساب/إيميل)
 * ② الزبون زائر ⇒ دعوة للدخول بضغطة، لأن الردّ يحتاج معرفة صاحب السؤال
 * ③ مسجّل ⇒ المحادثة كاملة
 */
export default function LiveChat() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const { user, ready, enabled, signIn } = useAuth();

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [seen, setSeen] = useState(0);
  /** ما حفظته صاحبة المتجر من أسئلة وأجوبة — يعلو نصوص الترجمة */
  const [faq, setFaq] = useState<FaqDoc>({});
  /** الأسئلة التي فتحها الزبون في هذه الجلسة — تُعرض محلياً بلا كتابة */
  const [opened, setOpened] = useState<FaqKey[]>([]);

  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setSeen(lastSeen()), []);

  // تُقرأ مرّة عند فتح النافذة — لا حاجة لقراءتها لمن لم يفتحها
  useEffect(() => {
    if (open) readFaq().then(setFaq);
  }, [open]);

  /**
   * اللافتة: تظهر بعد ثانيتين ونصف وتنسحب بعد ثمانٍ، ومرّةً واحدة في
   * الزيارة كلّها (`sessionStorage`). دعوةٌ تتكرّر في كل صفحة تصير إزعاجاً.
   */
  const [teaser, setTeaser] = useState(false);
  useEffect(() => {
    if (open) return;
    try {
      if (sessionStorage.getItem(TEASER_KEY)) return;
    } catch {
      // متصفّح يمنع التخزين — تظهر اللافتة وتنسحب كالمعتاد
    }
    const show = setTimeout(() => setTeaser(true), 2500);
    const hide = setTimeout(() => {
      setTeaser(false);
      try {
        sessionStorage.setItem(TEASER_KEY, "1");
      } catch {}
    }, 10500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [open]);

  // نستمع حتى والنافذة مغلقة، ليظهر عدّاد الردود الجديدة على الزرّ
  useEffect(() => {
    if (!user) {
      setMsgs([]);
      return;
    }
    return listenChat(user, setMsgs, () => setFailed(true));
  }, [user]);

  // النزول لآخر رسالة: عند الفتح وعند وصول ردّ جديد
  useEffect(() => {
    if (!open) return;
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [open, msgs.length]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      markSeen();
      setSeen(Date.now());
      // فتحها مرّة ⇒ فهم الدعوة، فلا تُعاد عليه
      setTeaser(false);
      try {
        sessionStorage.setItem(TEASER_KEY, "1");
      } catch {}
      // مهلة قصيرة حتى تُرسم النافذة قبل نقل التركيز إليها
      setTimeout(() => inputRef.current?.focus(), 260);
    }
  }

  async function send(body: string) {
    const value = body.trim();
    if (!user || !value || sending) return;
    setSending(true);
    setText("");
    const res = await sendChatMessage(user, value);
    if (!res.ok) {
      setFailed(true);
      setText(value); // لا نضيّع ما كتبه الزبون
    }
    setSending(false);
    inputRef.current?.focus();
  }

  const unread = unreadCount(msgs, seen);
  const waHref = site.whatsapp
    ? `https://wa.me/${site.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <>
      {/* ── لافتة الترحيب فوق الزرّ ─────────────────────
          الزرّ وحده أيقونة صامتة قد لا يفهمها الزبون؛ سطرٌ فوقه يدعوه
          للكلام. لكنه دعوة تُقال **مرّة**: كانت تظهر في كل صفحة وتبقى
          فوق الحقول فتغطّي ما يكتبه الزبون. الآن تظهر لحظة، ثم تنسحب
          وتترك الزرّ وحده — ولا تعود في هذه الزيارة. */}
      {!open && teaser && (
        <button
          type="button"
          onClick={toggle}
          style={{ bottom: `calc(${ABOVE_NAV} + 3.9rem)` }}
          className="chat-in fixed right-3 z-40 max-w-[min(15rem,calc(100vw-1.5rem))] rounded-[16px] rounded-br-[4px] border border-line bg-surface px-3.5 py-2 text-start text-sm font-medium shadow-[0_8px_22px_rgba(0,0,0,0.14)]"
        >
          {t("teaser")}
        </button>
      )}

      {/* ── الزرّ العائم ───────────────────────────────── */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? t("close") : t("open")}
        style={{ bottom: ABOVE_NAV }}
        className="nav-tap fixed right-3 z-50 flex size-14 items-center justify-center rounded-full bg-orange text-onaccent shadow-[0_8px_24px_rgba(0,0,0,0.22)] ring-1 ring-black/5"
      >
        {open ? (
          <IconClose className="size-6" />
        ) : (
          <IconChatLine className="size-6" />
        )}

        {/* عدّاد الردود التي لم تُقرأ — يختفي فور فتح النافذة */}
        {!open && unread > 0 && (
          <span className="num absolute -top-0.5 -right-0.5 flex min-w-6 items-center justify-center rounded-full border-2 border-bg bg-yellow px-1 text-xs font-bold text-onaccent">
            {unread}
          </span>
        )}
      </button>

      {/* ── النافذة ────────────────────────────────────── */}
      {open && (
        <div
          role="dialog"
          aria-label={t("title")}
          style={{ bottom: `calc(${ABOVE_NAV} + 4.4rem)` }}
          className="chat-in fixed right-3 z-50 flex max-h-[min(32rem,66dvh)] w-[min(23rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[26px] border border-line bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.25)]"
        >
          {/* الترويسة — لوحة بلون العلامة تُميّز النافذة عن الصفحة خلفها */}
          <header className="flex items-center gap-3 bg-navy p-3.5 text-white">
            <Logo className="size-10 shrink-0" solid />

            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{t("title")}</span>
              <span className="flex items-center gap-1.5 text-xs text-white/75">
                <span className="pulse-dot" />
                {t("status")}
              </span>
            </span>

            <button
              type="button"
              onClick={close}
              aria-label={t("close")}
              className="nav-tap -me-1 flex size-9 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            >
              <IconClose className="size-5" />
            </button>
          </header>

          {/* ① Firebase غير مضبوط — لا نُظهر دردشة لا تعمل */}
          {!enabled ? (
            <Fallback note={t("offline")} waHref={waHref} email={site.email} t={t} />
          ) : !ready ? (
            <p className="flex-1 p-5 text-center text-sm text-muted">
              {t("loading")}
            </p>
          ) : !user ? (
            /* ② زائر — يجيبه سؤالُه الشائع بلا حساب، والدخول لِما سواه */
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3.5">
              <FaqBlock
                faq={faq}
                locale={locale}
                t={t}
                opened={opened}
                onOpen={(k) => setOpened((p) => [...p, k])}
              />
              <p className="mt-2 text-center font-bold">{t("guestTitle")}</p>
              <p className="text-center text-sm text-muted">{t("guestNote")}</p>
              <button
                type="button"
                onClick={() => signIn()}
                className="lift mx-auto flex min-h-12 items-center gap-2.5 rounded-card border border-line bg-bg px-5 font-bold"
              >
                <IconGoogle className="size-5" />
                {t("guestCta")}
              </button>
            </div>
          ) : (
            /* ③ المحادثة */
            <>
              <div
                ref={boxRef}
                className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3.5"
              >
                {/* ترحيب المتجر — يُعرض دائماً في الأعلى، لا يُخزَّن كرسالة */}
                <Bubble from="admin" text={t("welcome", { name: firstName(user.displayName) })} />

                {msgs.map((m) => (
                  <Bubble key={m.id} from={m.from} text={m.text} at={m.createdAt} />
                ))}

                <FaqBlock
                  faq={faq}
                  locale={locale}
                  t={t}
                  opened={opened}
                  onOpen={(k) => setOpened((p) => [...p, k])}
                />

                {failed && (
                  <p className="rounded-card border border-danger/40 bg-danger/5 p-2.5 text-center text-xs text-danger">
                    {t("failed")}
                  </p>
                )}
              </div>

              {/* المُرسِل */}
              <div className="flex items-end gap-2 border-t border-line bg-bg p-2.5">
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(text);
                    }
                  }}
                  rows={1}
                  placeholder={t("placeholder")}
                  aria-label={t("placeholder")}
                  className="max-h-24 min-h-12 flex-1 resize-none rounded-[18px] border border-line bg-surface px-3.5 py-3 text-sm outline-none focus:border-orange"
                />
                <button
                  type="button"
                  onClick={() => send(text)}
                  disabled={!text.trim() || sending}
                  aria-label={t("send")}
                  className="nav-tap flex size-12 shrink-0 items-center justify-center rounded-full bg-orange text-onaccent disabled:opacity-40"
                >
                  <IconSend className="size-5 rtl:-scale-x-100" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

/**
 * الأسئلة الشائعة داخل النافذة.
 *
 * تظهر للزائر أيضاً لا للمسجَّل وحده: من يسأل "كم يستغرق التسليم؟" لا
 * ينبغي أن يُطالَب بحساب ليعرف الجواب.
 */
function FaqBlock({
  faq,
  locale,
  t,
  opened,
  onOpen,
}: {
  faq: FaqDoc;
  locale: string;
  t: (k: string) => string;
  opened: FaqKey[];
  onOpen: (k: FaqKey) => void;
}) {
  const rest = faqSlots.filter((k) => !opened.includes(k));

  return (
    <>
      {opened.map((k) => (
        <div key={`faq-${k}`} className="flex flex-col gap-2.5">
          <Bubble from="user" text={pick(faq, k, locale, "q", t(`faq.${k}.q`))} />
          <Bubble from="admin" text={pick(faq, k, locale, "a", t(`faq.${k}.a`))} />
        </div>
      ))}

      {rest.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-2">
          {rest.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onOpen(k)}
              className="lift rounded-full border border-line bg-bg px-3.5 py-2 text-start text-sm"
            >
              {pick(faq, k, locale, "q", t(`faq.${k}.q`))}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/** الاسم الأول فقط — "أهلاً محمد" أدفأ من الاسم الثلاثي */
function firstName(full: string | null) {
  return (full ?? "").trim().split(/\s+/)[0] ?? "";
}

function Bubble({
  from,
  text,
  at,
}: {
  from: "user" | "admin";
  text: string;
  at?: Date | null;
}) {
  const mine = from === "user";
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <p
        className={`max-w-[85%] whitespace-pre-wrap break-words px-3.5 py-2.5 text-sm ${
          mine
            ? "rounded-[18px] rounded-ee-[6px] bg-orange text-onaccent"
            : "rounded-[18px] rounded-es-[6px] border border-line bg-surface2"
        }`}
      >
        {text}
      </p>
      {at && (
        // dir="ltr" وصيغة ٢٤ ساعة: بالعربية كانت تنقلب إلى "PM ٠٥:٢٩"
        <time dir="ltr" className="num mt-1 px-1 text-xs text-muted">
          {at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </time>
      )}
    </div>
  );
}

/** القنوات البديلة حين لا تعمل الدردشة — لا نترك الزبون بلا طريق */
function Fallback({
  note,
  waHref,
  email,
  t,
}: {
  note: string;
  waHref: string | null;
  email: string;
  t: (k: string) => string;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-3 p-5 text-center">
      <p className="text-sm text-muted">{note}</p>
      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="lift mx-auto flex min-h-12 items-center rounded-card bg-orange px-5 font-bold text-onaccent"
        >
          {t("whatsapp")}
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} dir="ltr" className="text-sm text-orange underline">
          {email}
        </a>
      )}
    </div>
  );
}
