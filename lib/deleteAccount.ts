"use client";

/**
 * حذف الحساب من داخل التطبيق — **شرطُ نشرٍ لا تحسين**.
 *
 * 🔒 Google Play تشترطه منذ ٢٠٢٣ على كل تطبيق فيه تسجيل دخول (وآبل
 *    كذلك في ٥.١.١): سبيلٌ **داخل التطبيق** يمحو الحساب وبياناته.
 *    وبدونه يُرفض التطبيق مهما كان سليماً.
 *
 * ⚠️ **وما يُمحى وما يبقى مذكوران للزبون قبل الضغط** — لا بعده:
 *
 *    يُمحى: هويّته (الدخول بجوجل) · رقمه · **رصيد نقاطه** · رمز دعوته
 *    يبقى: سجلّ طلباته في دفاترنا — سِجلٌّ محاسبيّ لا بيانات تسويق،
 *          واحتفاظُه حقٌّ مشروع تُفصح عنه سياسة الخصوصية.
 *
 * ⚠️ ورصيدُ النقاط **يضيع بالحذف**. تُقال له صراحةً بالرقم قبل أن يضغط،
 *    فلا يكتشف بعد شهرٍ أنه أتلف مالاً كان له.
 */

import { deleteUser, reauthenticateWithPopup, GoogleAuthProvider } from "firebase/auth";
import type { User } from "firebase/auth";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { fbDb } from "./firebase";

export type DeleteResult =
  | { ok: true }
  | { ok: false; reason: "auth" | "recent" | "error" };

/**
 * ⚠️ **الترتيب مقصود**: تُمحى الوثائق **قبل** الهويّة.
 *
 *    لأن القواعد تشترط `request.auth.uid` لتأذن بمحوها — فلو مُحيت
 *    الهويّة أوّلاً لَما بقي من يأذن له، وبقيت وثائقه في القاعدة إلى
 *    الأبد بلا صاحبٍ يحذفها ولا لوحةٍ تعرف أنها متروكة.
 */
export async function deleteMyAccount(user: User | null): Promise<DeleteResult> {
  const db = fbDb();
  if (!user || !db) return { ok: false, reason: "auth" };

  try {
    const uRef = doc(db, "users", user.uid);
    const snap = await getDoc(uRef);
    const v = snap.exists() ? snap.data() : {};

    /* رقمه ورمزه يُحرَّران أوّلاً، وإلا بقيا محجوزين لحسابٍ لا وجود له
       فلا يستطيع التسجيل برقمه نفسه لو عاد. */
    const phone = String(v.phone ?? "");
    const ref = String(v.ref ?? "");

    if (phone) await deleteDoc(doc(db, "phones", phone)).catch(() => {});
    if (ref) await deleteDoc(doc(db, "refcodes", ref)).catch(() => {});

    await deleteDoc(uRef);

    /* ثم الهويّة نفسها. وجوجل تطلب دخولاً حديثاً قبل حذفٍ لا رجعة فيه،
       فلو طالت الجلسة أعدنا التحقّق بضغطةٍ ثم أكملنا. */
    try {
      await deleteUser(user);
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "";
      if (code !== "auth/requires-recent-login") throw e;

      try {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
        await deleteUser(user);
      } catch {
        // وثائقه مُحيت فعلاً — يبقى تسجيل الدخول وحده
        return { ok: false, reason: "recent" };
      }
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}
