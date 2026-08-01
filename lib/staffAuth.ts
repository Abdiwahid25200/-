"use client";

/**
 * صنع حساب دخول للمساعد — **اسم مستخدم وكلمة سرّ، بلا بريد حقيقي**.
 *
 * 🔑 الحيلة نفسها المستعملة لحسابك: Firebase لا يعرف «أسماء مستخدمين» بل
 *    البريد وكلمة السرّ، فنُلحق بالاسم نطاقاً داخلياً:
 *    `sara` ⇐ `sara@eramaan.com`. المساعد يكتب اسمه فقط.
 *
 * ⚠️ **المشكلة التي حُلّت هنا:** إنشاء حساب من المتصفّح يُدخل صاحبَ الحساب
 *    الجديد **محلّك** فيُخرجك من لوحتك فوراً. الحلّ: نفتح اتصال Firebase
 *    ثانياً باسم مستقلّ، ننشئ فيه الحساب، ثم نُغلقه. جلستك لا تتأثّر.
 *
 * 🔒 ولا يلزم مفتاح خدمة سرّي — ولذلك لا يوجد ما يُرفع إلى GitHub بالخطأ.
 *
 * ما لا يستطيعه هذا الطريق: تغيير كلمة سرّ منسيّة أو حذف الحساب من
 * Firebase. والعلاج العملي: احذفي المساعد من القائمة (فيفقد كل صلاحية
 * فوراً ولو بقي حسابه) ثم اصنعي له اسماً جديداً.
 */

import { deleteApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { fbAuth } from "./firebase";

/** النطاق الداخلي — نفسه في `AdminGate` */
export const STAFF_DOMAIN = "eramaan.com";

/** `sara` ⇐ `sara@eramaan.com` · والمكتوب بريداً كاملاً يُترك كما هو */
export const toStaffEmail = (u: string) => {
  const s = u.trim().toLowerCase();
  return s.includes("@") ? s : `${s.replace(/[^a-z0-9._-]/g, "")}@${STAFF_DOMAIN}`;
};

export type MakeResult =
  | { ok: true; email: string }
  | { ok: false; reason: "taken" | "weak" | "bad" | "error" };

export async function createStaffLogin(
  username: string,
  password: string,
): Promise<MakeResult> {
  const email = toStaffEmail(username);
  if (!email.startsWith("@") === false || email.length < 5) return { ok: false, reason: "bad" };
  if (password.length < 6) return { ok: false, reason: "weak" };

  const main = fbAuth();
  if (!main) return { ok: false, reason: "error" };

  // اتصالٌ ثانٍ باسم مستقلّ — لئلّا يحلّ الحساب الجديد محلّ جلستك
  const second = initializeApp(main.app.options, `staff-${Date.now()}`);

  try {
    await createUserWithEmailAndPassword(getAuth(second), email, password);
    return { ok: true, email };
  } catch (e) {
    const code = (e as { code?: string })?.code ?? "";
    if (code === "auth/email-already-in-use") return { ok: false, reason: "taken" };
    if (code === "auth/weak-password") return { ok: false, reason: "weak" };
    if (code === "auth/invalid-email") return { ok: false, reason: "bad" };
    return { ok: false, reason: "error" };
  } finally {
    // نُغلق الاتصال الثاني دائماً، فلا تبقى جلسة معلّقة في الذاكرة
    await deleteApp(second).catch(() => {});
  }
}
