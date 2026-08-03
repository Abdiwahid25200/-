/**
 * ⚠️ بيانات تجريبية مؤقتة — تُستبدل ببيانات Firestore الحقيقية في المرحلة ٣.
 *
 * الأشكال هنا مطابقة لبنية كائن DB في الموقع القديم، حتى يكون الاستبدال
 * لاحقاً مجرد تغيير مصدر البيانات دون لمس أي صفحة.
 */

/* ═══════════════════════════════════════════════════════════
   التحكّم بكل منتج وباقة — تُدار من: الإدارة ← المنتجات
   ═══════════════════════════════════════════════════════════ */

export type ItemStatus =
  | "on"    // معروض ويُشترى        (الافتراضي إن لم يُذكر)
  | "soon"  // معروض بشارة "قريباً" ولا يُشترى
  | "off";  // مخفي تماماً

/** الحقول المشتركة التي تُتيح التحكّم بأي عنصر معروض */
type Controllable = {
  /** الحالة — بحذفها يُعتبر العنصر "on" */
  status?: ItemStatus;
  /** ترتيب العرض — الأصغر أولاً. بلا رقم يبقى بترتيبه في المصفوفة */
  order?: number;
};

export type Product = Controllable & {
  id: string;
  name: string;
  /** مسار الصورة داخل public/ — مثال: "/images/elec/headset.jpg" */
  img?: string;
  /** معرض صفحة المنتج — ثلاث صور فأكثر. تُرفع من اللوحة */
  imgs?: string[];
  price: number;
  old?: number;
  disc?: number;
  desc?: string;
};

export type UcPack = Controllable & {
  id: string;
  amount: number;
  img?: string;
  /** فوري = يُشحن تلقائياً · يدوي = يحتاج مراجعة */
  instant?: boolean;
  popular?: boolean;
  price: number;
  old?: number;
  disc?: number;
};

export type CoinPack = Controllable & {
  id: string;
  name: string;
  amount: number;
  img?: string;
  instant?: boolean;
  popular?: boolean;
  price: number;
  old?: number;
};

export type GameAccount = Controllable & {
  id: string;
  title: string;
  img?: string;
  /**
   * 🖼️ **معرض الحساب** — قرارها: «ثلاث صور على الأقل في كل حساب».
   * وهو ما يبيع الحساب فعلاً: الزبون يشتري ما يراه، لا ما يُوصف له.
   */
  imgs?: string[];
  /** الوصف الكامل في صفحة الحساب — أطول من `note` سطر البطاقة */
  desc?: string;
  price: number;
  note?: string;
};

/**
 * يستبعد المخفي (`off`) ويرتّب حسب `order`.
 * **كل صفحة أو تدفّق شراء يمرّ بياناته من هنا** — فتغيير حالة عنصر واحد
 * في هذا الملف يسري فوراً على الموقع كله دون تعديل أي صفحة.
 */
export const live = <T extends Controllable>(items: T[]): T[] =>
  items
    .filter((i) => i.status !== "off")
    .map((i, idx) => ({ i, idx }))
    // الترتيب مستقرّ: العناصر بلا order تبقى بترتيبها الأصلي
    .sort((a, b) => (a.i.order ?? a.idx) - (b.i.order ?? b.idx) || a.idx - b.idx)
    .map(({ i }) => i);

/** هل العنصر قابل للشراء فعلاً؟ (`soon` يُعرض لكن لا يُشترى) */
export const isBuyable = (i: Controllable) => (i.status ?? "on") === "on";

/** عدد العناصر المعروضة — للعدّادات في بطاقات الأقسام */
export const liveCount = (items: Controllable[]) => live(items).length;

/* ═══════════════════════════════════════════════════════════
   🗑️ **فُرّغت كلّها بطلبها (٠٣-٠٨): «أنا أضيفهم من الإدارة».**

   كانت هذه القوائم بضاعةً تجريبية كتبتُها أنا لتُرى الشاشات قبل أن
   يكون في المتجر شيء. وقد صار له لوحةٌ تضيف وتحذف، فبقاؤها يعني
   أسعاراً ليست أسعارها تُعرض على زبونٍ حقيقيّ.

   ⚠️ **والقوائم تبقى موجودةً فارغة — لا تُحذف الأسطر نفسها**: كل
      الصفحات تقرأ منها (`live()` · `liveCount()` · البحث · الخريطة)،
      وحذفُ الاسم يكسر البناء كلّه. الفارغُ يُعرض «لا شيء بعد»، والمعدومُ
      لا يُعرض شيئاً أصلاً.

   ➕ **الإضافة من اللوحة**: Items ← اختاري القسم ← «Add new item».
      وما يُضاف هناك يعيش في Firestore، فلا يمرّ بهذا الملفّ أبداً.
   ═══════════════════════════════════════════════════════════ */

/** الإلكترونيات — تظهر بالصفحة الرئيسية */
export const elec: Product[] = [];

/** شدات ببجي — UC */
export const pubg: UcPack[] = [];

/** كوينز eFootball */
export const icons: CoinPack[] = [];

/** حسابات تيك توك الجاهزة — كل حساب فريد ويُباع مرة واحدة */
export const tiktok: GameAccount[] = [];

/** حسابات eFootball الجاهزة — كل حساب فريد ويُباع مرة واحدة */
export const accounts: GameAccount[] = [];

/** طرق الدفع — نفس شكل DB.pay في الموقع القديم، مع تجميع عالمي/محلي */
export type PayMethod = {
  id: string;
  nameAr: string;
  nameEn: string;
  numbers: string[];
  ussd: string;
  /** global = متاحة لأي زبون في العالم · local = تحويل محلي بكود USSD */
  scope: "global" | "local";
  /**
   * شركة الاتصالات صاحبة الخدمة — تظهر تحت الاسم.
   * الزبون الصومالي يعرف "هرمود" و"سومنت" أكثر من اسم الخدمة أحياناً،
   * وذكرها يقطع الشكّ: هل هذا الرقم يقبل تحويلي أم لا.
   */
  operator?: string;
  /** العلامة المرسومة — تُستخدم ريثما تُرفع الصورة الحقيقية */
  mark: PayMarkKey;
  /**
   * شعار الخدمة الحقيقي — ملف في `public/images/pay/`.
   * حين يوجد يحلّ محلّ العلامة المرسومة تلقائياً.
   */
  logo?: string;
  /** `on` يعمل · `soon` معروض بوسم "قريباً" ولا يُختار · `off` مخفي */
  status?: ItemStatus;
  order?: number;
};

export type PayMarkKey =
  | "paypal"
  | "card"
  | "usdt"
  | "binance"
  | "evc"
  | "jeeb"
  | "edahab"
  | "zaad"
  | "sahal"
  | "waafi";

/**
 * طرق الدفع — **فُرّغت بطلبها (٠٣-٠٨): «بدي أضيفهم من الإدارة»**.
 *
 * كانت عشراً تجريبية بأرقامٍ ليست أرقامها (`612345678` وأمثالها)، كلّها
 * `soon` فلا تُختار — تُري الزبون ما سيأتي. وقد صارت لها شاشةٌ تضيف
 * وتحذف (**More ← Payments ← Add method**)، فأولى أن تكتب طرقها بيدها
 * برقمها الصحيح، من أن ترث قائمةً تحتاج حذفَ ما لا تريده منها.
 *
 * ⚠️ **والقائمة تبقى موجودةً فارغة**: منها تُشتقّ وسائل الدفع في الفوتر
 *    وصفحة الدعم (`acceptedPayments`) وخطوة الدفع والسلّة — وحذفُ الاسم
 *    يكسر البناء كلّه.
 *
 * ⚠️ **ولا شيء يُحذف من Firestore هنا**: مجموعة `payments` فارغةٌ أصلاً
 *    (فُحصت)، فالعشرُ كنّ في هذا الملفّ وحده.
 */
export const pay: PayMethod[] = [];

/**
 * رابط خدمة التحقق من آيدي ببجي — يأتي من إعدادات الأدمن (DB.set.idApi).
 * فارغ الآن ⇒ يعمل الموقع بوضع التحقق اليدوي، تماماً كالموقع القديم.
 */
export const idApi: string = "";

/**
 * رقم واتساب المتجر — يأتي من إعدادات الأدمن (DB.set.wa).
 * فارغ الآن ⇒ يُعرض ملخّص الطلب بالصفحة فقط.
 * عند تعبئته ⇒ يفتح زر التأكيد واتساب برسالة الطلب جاهزة.
 */
export const wa: string = "";

/** إعدادات المتجر — تأتي لاحقاً من DB.set */
export const store = {
  phone: "",          // مثال: "252612345678"
  email: "",          // مثال: "support@eramaan.com"
  telegram: "",
};

/** شركاء الدفع — تُعرض بالفوتر وصفحة الدفع لبناء الثقة */
export const partners = [
  "PayPal", "Visa", "Mastercard", "USDT", "Binance Pay",
  "EVC Plus", "JEEB", "E-Dahab", "ZAAD", "SAHAL", "WAAFI",
];
