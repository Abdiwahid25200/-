/**
 * الدردشة المباشرة — على Firebase الخاص بالمتجر، لا خدمة خارجية.
 *
 * لماذا لا Tawk.to أو ما شابه: الرسائل تصير عند شركة أخرى، وشعارها يظهر
 * للزبون، وتُفرض عليك باقة شهرية. هنا الرسائل في قاعدة بياناتك أنتِ،
 * وتقرئينها من لوحة الإدارة (المرحلة ٤) أو من Firebase Console الآن.
 *
 * الشكل: لكل زبون **محادثة واحدة** باسم الـuid، ورسائلها في مجموعة فرعية.
 * فلا يرى زبونٌ محادثة غيره — القواعد في `firestore.rules` تفرض ذلك.
 *
 * وإن لم تُضبط إعدادات Firebase، ترجع الدوال بلا عمل ويعرض المكوّن
 * القنوات البديلة (واتساب/إيميل) بدل أن ينكسر شيء.
 */

import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { fbDb } from "./firebase";

export type ChatMessage = {
  id: string;
  /**
   * `user` = الزبون · `admin` = المتجر · `ai` = المساعد الآلي.
   * القواعد تمنع الزبون من انتحال `admin`، فلا ينتحل أحد صفة المتجر.
   */
  from: "user" | "admin" | "ai";
  text: string;
  createdAt: Date | null;
};

/** آخر ٢٠٠ رسالة تكفي محادثة دعم، وتمنع تحميل تاريخ طويل بلا داعٍ */
const MAX_MESSAGES = 200;

/** أطول رسالة مقبولة — نفس الحدّ في `firestore.rules` */
export const MAX_LEN = 2000;

/**
 * الاستماع لمحادثة الزبون لحظياً.
 * ترجع دالة الإيقاف — تُستدعى عند إغلاق المكوّن.
 */
export function listenChat(
  user: User,
  onChange: (msgs: ChatMessage[]) => void,
  onError?: () => void,
): () => void {
  const db = fbDb();
  if (!db) return () => {};

  return onSnapshot(
    query(
      collection(db, "chats", user.uid, "messages"),
      orderBy("createdAt", "asc"),
      limit(MAX_MESSAGES),
    ),
    (snap) => {
      onChange(
        snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id,
            from:
              v.from === "admin" ? "admin" : v.from === "ai" ? "ai" : "user",
            text: String(v.text ?? ""),
            createdAt: v.createdAt?.toDate?.() ?? null,
          } satisfies ChatMessage;
        }),
      );
    },
    () => onError?.(),
  );
}

export type SendResult = { ok: true } | { ok: false };

/**
 * إرسال رسالة من الزبون.
 *
 * نكتب شيئين: الرسالة نفسها، ووثيقة المحادثة بآخر سطر ووقته — لتظهر
 * المحادثات في لوحة الإدارة مرتّبة بالأحدث دون قراءة كل الرسائل.
 */
export async function sendChatMessage(
  user: User,
  text: string,
): Promise<SendResult> {
  const db = fbDb();
  const body = text.trim().slice(0, MAX_LEN);
  if (!db || !body) return { ok: false };

  try {
    await addDoc(collection(db, "chats", user.uid, "messages"), {
      from: "user",
      text: body,
      createdAt: serverTimestamp(),
    });

    // merge: تُنشئ الوثيقة أول مرة وتحدّثها بعدها، بلا فحص مسبق
    await setDoc(
      doc(db, "chats", user.uid),
      {
        uid: user.uid,
        name: user.displayName ?? "",
        email: user.email ?? "",
        lastText: body,
        lastFrom: "user",
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * ردّ المساعد الآلي — يُطلب نصّه من خادم الموقع ثم يُكتب في المحادثة.
 *
 * لماذا يكتبه المتصفّح لا الخادم: الكتابة في Firestore تحكمها قواعد
 * الأمان، والخادم لا يملك هويّة تعبرها. فالخادم يصنع النصّ (ومعه المفتاح
 * السرّي)، والمتصفّح يكتبه في محادثة صاحبه وحده.
 *
 * ولو لم يُضبط مفتاح Anthropic ترجع `off` ولا يحدث شيء — الدردشة كما هي.
 */
export type AiResult =
  | { ok: true; text: string; human: boolean }
  | { ok: false; human: boolean };

export async function aiReply(
  user: User,
  history: ChatMessage[],
): Promise<AiResult> {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/ai-reply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        idToken,
        messages: history.map((m) => ({ from: m.from, text: m.text })),
      }),
    });
    const d = await res.json().catch(() => null);

    if (!d?.ok || !d.text) {
      // "أحِلْه إلى إنسان" حين يقرّر المساعد ذلك، لا حين تعذّرت الخدمة
      return { ok: false, human: d?.reason === "human" };
    }

    await writeAiMessage(user, String(d.text), Boolean(d.human));
    return { ok: true, text: String(d.text), human: Boolean(d.human) };
  } catch {
    return { ok: false, human: false };
  }
}

async function writeAiMessage(user: User, text: string, human: boolean) {
  const db = fbDb();
  if (!db) return;
  const body = text.trim().slice(0, MAX_LEN);
  if (!body) return;

  await addDoc(collection(db, "chats", user.uid, "messages"), {
    from: "ai",
    text: body,
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "chats", user.uid),
    {
      uid: user.uid,
      lastText: body,
      lastFrom: "ai",
      // تُرفع لصاحبة المتجر: هذه محادثة تنتظر إنساناً
      needsHuman: human,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** الزبون يطلب إنساناً بضغطة — تُعلَّم المحادثة فتراها صاحبة المتجر */
export async function askForHuman(user: User): Promise<boolean> {
  const db = fbDb();
  if (!db) return false;
  try {
    await setDoc(
      doc(db, "chats", user.uid),
      { uid: user.uid, needsHuman: true, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return true;
  } catch {
    return false;
  }
}

/* ── شارة "رسالة جديدة" ──
   نحفظ وقت آخر رسالة قرأها الزبون في متصفّحه، فلا نحتاج كتابة في
   قاعدة البيانات عند كل فتح للنافذة. */

const SEEN_KEY = "ramaan.chat.seen";

export function lastSeen(): number {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(SEEN_KEY) ?? 0);
}

export function markSeen(at: number = Date.now()) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SEEN_KEY, String(at));
}

/** عدد ردود المتجر التي وصلت بعد آخر مرة فتح فيها الزبون النافذة */
export function unreadCount(msgs: ChatMessage[], seen: number): number {
  return msgs.filter(
    (m) => m.from !== "user" && (m.createdAt?.getTime() ?? 0) > seen,
  ).length;
}
