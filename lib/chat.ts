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
  /** `user` = الزبون · `admin` = المتجر. القواعد تمنع الزبون من انتحال `admin` */
  from: "user" | "admin";
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
            from: v.from === "admin" ? "admin" : "user",
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
 * "أريد التحدّث مع شخص" — تُرفع علامة على المحادثة لا رسالةً وحدها.
 *
 * الرسالة تصل صاحبة المتجر مع عشرات غيرها، أمّا `needsHuman` فتُميّز
 * المحادثة التي **تنتظر إنساناً** فتُرى أولاً في لوحة الإدارة.
 * وفشلُها لا يضرّ: الرسالة نفسها وصلت على كل حال.
 */
export async function markNeedsHuman(user: User): Promise<boolean> {
  const db = fbDb();
  if (!db) return false;
  try {
    await setDoc(
      doc(db, "chats", user.uid),
      {
        uid: user.uid,
        name: user.displayName ?? "",
        email: user.email ?? "",
        needsHuman: true,
        updatedAt: serverTimestamp(),
      },
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
    (m) => m.from === "admin" && (m.createdAt?.getTime() ?? 0) > seen,
  ).length;
}
