"use client";

/**
 * الدردشة من جهة المتجر — قراءة المحادثات والردّ عليها من اللوحة.
 *
 * ⚠️ كانت الردود تُكتب من Firebase Console يدوياً (وثيقة جديدة بحقول
 *    `from: "admin"`…) — وهذا لا يصلح لمتجرٍ يعمل: الزبون ينتظر دقائق،
 *    وصاحبة المتجر على جوّالها لا على حاسوب.
 *
 * 🔒 والردّ باسم المتجر مشروطٌ في القواعد بـ`canDo('chat')` لا بالواجهة:
 *    الزبون لا يستطيع كتابة رسالة موقّعة `admin` مهما فعل بمتصفّحه،
 *    فلا ينتحل أحدٌ صفة المتجر ويخدع زبوناً آخر.
 */

import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { fbDb } from "./firebase";
import { withTimeout } from "./timeout";
import { MAX_LEN, type ChatMessage } from "./chat";

export type ChatRow = {
  uid: string;
  name: string;
  email: string;
  lastText: string;
  /** من كتب آخر سطر — `user` يعني **بانتظار ردّك** */
  lastFrom: "user" | "admin";
  /** ضغط الزبون «أريد التحدّث مع شخص» */
  needsHuman: boolean;
  at: Date | null;
};

/**
 * كل المحادثات، الأحدث أولاً.
 *
 * ⚠️ بلا `where` مع `orderBy` — قاعدة هذا المشروع، فلا نحتاج إنشاء
 *    فهرس مركّب يدوياً عند كل استعلام جديد. والتصفية في المتصفّح.
 */
export async function allChats(n = 100): Promise<ChatRow[]> {
  const db = fbDb();
  if (!db) return [];

  const snap = await withTimeout(
    getDocs(query(collection(db, "chats"), fbLimit(n))),
  );

  return snap.docs
    .map((d) => {
      const v = d.data();
      return {
        uid: d.id,
        name: String(v.name ?? ""),
        email: String(v.email ?? ""),
        lastText: String(v.lastText ?? ""),
        lastFrom: v.lastFrom === "admin" ? ("admin" as const) : ("user" as const),
        needsHuman: v.needsHuman === true,
        at: v.updatedAt?.toDate?.() ?? null,
      };
    })
    .sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0));
}

/** الاستماع لمحادثة واحدة لحظياً — الزبون يكتب فيظهر فوراً أمامك */
export function listenAdminChat(
  uid: string,
  onChange: (msgs: ChatMessage[]) => void,
  onError?: () => void,
): () => void {
  const db = fbDb();
  if (!db || !uid) return () => {};

  return onSnapshot(
    query(
      collection(db, "chats", uid, "messages"),
      orderBy("createdAt", "asc"),
      fbLimit(200),
    ),
    (snap) =>
      onChange(
        snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id,
            from: v.from === "admin" ? ("admin" as const) : ("user" as const),
            text: String(v.text ?? ""),
            createdAt: v.createdAt?.toDate?.() ?? null,
          };
        }),
      ),
    () => onError?.(),
  );
}

/**
 * الردّ باسم المتجر.
 *
 * تُكتب الرسالة **ثم** وثيقة المحادثة بآخر سطر — فتنزل المحادثة إلى
 * «مردود عليها» وتُرفع علامة الانتظار، بلا قراءة الرسائل كلّها.
 */
export async function replyChat(
  uid: string,
  text: string,
  name: string,
  email: string,
): Promise<boolean> {
  const db = fbDb();
  const body = text.trim().slice(0, MAX_LEN);
  if (!db || !uid || !body) return false;

  try {
    await addDoc(collection(db, "chats", uid, "messages"), {
      from: "admin",
      text: body,
      createdAt: serverTimestamp(),
    });

    await setDoc(
      doc(db, "chats", uid),
      {
        uid,
        name,
        email,
        lastText: body,
        lastFrom: "admin",
        // الردّ يُنهي الانتظار — وإلا بقيت المحادثة صارخةً بعد جوابها
        needsHuman: false,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  } catch {
    return false;
  }
}
