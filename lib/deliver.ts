/**
 * كلمة نهاية الطلب — **لكل قسمٍ كلمتُه** (قرار صاحبة المتجر).
 *
 * ⚠️ «Delivered» لا تصف شحن شدّات ببجي: الشدّات **تُشحن** على آيدي
 *    اللاعب، وحساب تيك توك **يُسلَّم** بياناتُه على واتساب، والجهاز
 *    **يُوصَّل** إلى عنوان. كلمةٌ واحدة للثلاثة تجعل الجملة غريبة،
 *    وتُوهم من يقرأ اللوحة أن الأقسام تُنجَز بطريقةٍ واحدة.
 *
 * ⚠️ و**مصدرٌ واحد لا مصدران**: كانت الخريطة داخل `components/OrderCard.tsx`
 *    وحده، فبقيت اللوحة تقول «Delivered» لكل شيء بينما يقرأ الزبون
 *    «Topped up». إضافةُ قسمٍ جديد كانت تستلزم تذكّر موضعين.
 */

/** مفاتيح الترجمة في `messages/*.json` ← `accountPage.done.*` */
export type DoneWord = "toppedUp" | "handedOver" | "shipped";

/**
 * القسم ⇐ كلمته.
 * ما ليس هنا (الأقسام المضافة من اللوحة) يقع على `shipped` — أعمّها.
 */
const BY_KIND: Record<string, DoneWord> = {
  pubg: "toppedUp",
  efootball: "toppedUp",
  points: "toppedUp",
  tiktok: "handedOver",
  accounts: "handedOver",
  "points-send": "handedOver",
  "points-sell": "handedOver",
  elec: "shipped",
};

export function doneWord(kind: string | undefined): DoneWord {
  return BY_KIND[String(kind ?? "")] ?? "shipped";
}

/**
 * النصّ الإنجليزيّ للوحة الإدارة.
 *
 * 🔒 اللوحة بالإنجليزية — قرارٌ مقفول، فلا تمرّ بـ`next-intl` أصلاً.
 *    وصفحة الزبون تقرأ المفتاح نفسه من `messages/*.json` بثلاث لغات.
 */
const EN: Record<DoneWord, string> = {
  toppedUp: "Topped up",
  handedOver: "Handed over",
  shipped: "Delivered",
};

/** كلمة النهاية بالإنجليزية لطلبٍ من هذا القسم */
export const doneLabel = (kind: string | undefined): string => EN[doneWord(kind)];

/**
 * ⚠️ وحين تُذكر الحالة **لمجموعة طلبات** (مرشّح القائمة مثلاً) لا يصحّ
 *    انتقاء إحدى الكلمات الثلاث: المجموعة فيها شحنٌ وتسليمٌ وتوصيل معاً.
 *    فتُسمّى بما يجمعها.
 */
export const DONE_GROUP = "Done";
export const DONE_GROUP_NOTE = "topped up, handed over or shipped";
