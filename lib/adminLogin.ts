/**
 * دخول اللوحة — ما يشترك فيه المتصفّح والخادم.
 *
 * ① **الاسم يصير بريداً**: `raman02500` ⇐ `raman02500@eramaan.com`.
 *    كان هذا محبوساً في `AdminGate`، وصار الخادم يحتاجه أيضاً ليتحقّق من
 *    كلمة السرّ قبل أن يرسل الرمز. **وقاعدةٌ في مكانين تعني مكاناً واحداً
 *    يُنسى** — فمن بدّل النطاق هناك وحده لَما دخل أحد.
 *
 * ② **ورقة الجهاز**: بعد أن يُكتب الرمز صحيحاً يعطي الخادمُ المتصفّحَ
 *    ورقةً موقّعة تعيش **سبعة أيام** (قرارها). فلا يُطلب الرمز في كل
 *    دخول — ويُطلب فوراً من أي جهازٍ لا ورقة له.
 *
 * ⚠️ **والورقة في `localStorage` لا `sessionStorage`**: مقصودها أن تبقى
 *    بعد إغلاق المتصفّح. وهذا لا يمسّ قفل الجلسة (٣٠ دقيقة + إغلاق
 *    التبويب) في `lib/adminSession.ts` — طبقتان مختلفتان:
 *    الأولى تقول «هذا الجهاز معروف»، والثانية تقول «وما زلتِ أمامه».
 *
 * ⚠️ **والورقة وحدها لا تفتح شيئاً**: بلا كلمة السرّ لا يُقبل دخول، وهي
 *    مربوطة بحساب صاحبها فلا تنفع غيره.
 */

/** النطاق الذي يُلحَق باسم المستخدم */
export const ADMIN_DOMAIN = "eramaan.com";

export const toAdminEmail = (u: string) =>
  String(u ?? "").includes("@")
    ? String(u).trim().toLowerCase()
    : `${String(u ?? "").trim().toLowerCase()}@${ADMIN_DOMAIN}`;

/** عمر الرمز المرسَل بالبريد */
export const CODE_TTL_MS = 10 * 60_000;

/** عمر ورقة الجهاز — قرارها: أسبوع */
export const DEVICE_DAYS = 7;
export const DEVICE_TTL_MS = DEVICE_DAYS * 24 * 60 * 60_000;

/* ⚠️ **ورقةٌ لكل اسم مستخدم**: صاحبة المتجر ومساعدُها قد يدخلان من
   الجهاز نفسه، ومفتاحٌ واحد يعني أن آخر داخلٍ يمحو ورقة الأوّل. */
const devKey = (u: string) => `adm:dev:${toAdminEmail(u)}`;

export function devTicket(u: string): string {
  try {
    return localStorage.getItem(devKey(u)) ?? "";
  } catch {
    return "";
  }
}

export function saveDevTicket(u: string, ticket: string): void {
  try {
    if (ticket) localStorage.setItem(devKey(u), ticket);
  } catch {
    /* متصفّحٌ يمنع التخزين ⇒ يُطلب الرمز كل مرّة. الأحوط لا الأسهل */
  }
}

export function clearDevTicket(u: string): void {
  try {
    localStorage.removeItem(devKey(u));
  } catch {}
}
