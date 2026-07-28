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

/** الإلكترونيات — تظهر بالصفحة الرئيسية */
export const elec: Product[] = [
  { id: "e1", name: "سماعة بلوتوث لاسلكية", price: 32, disc: 25, img: "/images/elec/test.jpg", desc: "عزل ضوضاء · بطارية ٣٠ ساعة" },
  { id: "e2", name: "شاحن سريع 65W", price: 18, desc: "ثلاثة منافذ · شحن سريع للجوال واللابتوب" },
  { id: "e3", name: "باور بانك 20000mAh", price: 35, disc: 20, desc: "شحن سريع · يكفي لثلاث شحنات" },
  { id: "e4", name: "ساعة ذكية رياضية", price: 42, desc: "قياس النبض · مقاومة للماء" },
  { id: "e5", name: "ماوس ألعاب RGB", price: 20, disc: 25, desc: "٧ أزرار · دقة 12000 DPI" },
  { id: "e6", name: "لوحة مفاتيح ميكانيكية", price: 38, desc: "إضاءة خلفية · مفاتيح زرقاء" },
  { id: "e7", name: "سماعة رأس للألعاب", price: 30, disc: 10, desc: "صوت محيطي · مايك قابل للفصل" },
  { id: "e8", name: "حامل جوال للسيارة", price: 9, desc: "تثبيت مغناطيسي قوي" },
];

/** شدات ببجي — UC */
export const pubg: UcPack[] = [
  { id: "u1", amount: 60, price: 1.2, instant: true },
  { id: "u2", amount: 325, price: 6, disc: 10, instant: true },
  { id: "u3", amount: 660, price: 10.5, instant: true, popular: true },
  { id: "u4", amount: 1800, price: 30, disc: 10, instant: true },
  { id: "u5", amount: 3850, price: 54, instant: true },
  { id: "u6", amount: 8100, price: 120, disc: 10, instant: true },
];

/** كوينز eFootball */
export const icons: CoinPack[] = [
  { id: "c1", name: "باقة صغيرة", amount: 100, price: 1.5 },
  { id: "c2", name: "باقة فضية", amount: 550, price: 7.5, old: 8 },
  { id: "c3", name: "باقة ذهبية", amount: 1300, price: 16, popular: true },
  { id: "c4", name: "باقة بلاتينية", amount: 2800, price: 33, old: 36 },
  { id: "c5", name: "باقة ماسية", amount: 5900, price: 68 },
  { id: "c6", name: "الباقة الكبرى", amount: 12000, price: 130, old: 145 },
];

/** حسابات تيك توك الجاهزة — كل حساب فريد ويُباع مرة واحدة */
export const tiktok: GameAccount[] = [
  { id: "t1", title: "حساب تيك توك — ١٠ آلاف متابع", price: 35, note: "متابعون حقيقيون · تفاعل نشط" },
  { id: "t2", title: "حساب تيك توك — ٢٥ ألف متابع", price: 75, note: "محتوى ترفيهي · جمهور عربي" },
  { id: "t3", title: "حساب تيك توك — ٥٠ ألف متابع", price: 140, note: "مؤهّل للربح · إحصائيات ممتازة" },
  { id: "t4", title: "حساب تيك توك — ١٠٠ ألف متابع", price: 260, note: "حساب مميّز · نمو مستقر" },
  { id: "t5", title: "حساب موثّق ✓", price: 420, note: "علامة التوثيق الزرقاء" },
];

/** حسابات eFootball الجاهزة — كل حساب فريد ويُباع مرة واحدة */
export const accounts: GameAccount[] = [
  { id: "a1", title: "حساب eFootball — ٥ نجوم", price: 45, note: "فريق كامل · لاعبون مميزون" },
  { id: "a2", title: "حساب eFootball — ٤ نجوم", price: 28, note: "رصيد كوينز إضافي" },
  { id: "a3", title: "حساب مبتدئ + ٢٠٠٠ كوينز", price: 15, note: "مناسب للبداية" },
];

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
 * طرق الدفع.
 *
 * `on` لما تملكه صاحبة المتجر فعلاً — EVC Plus وJEEB وحدهما اليوم.
 * وما عداهما `off`: مخفيّ تماماً بقرارها. صفٌّ من "قريباً" يشغل مساحة
 * ولا يبيع شيئاً، والزبون يقرأ ما لا ينفعه قبل أن يصل لطريقته.
 *
 * لتشغيل أي طريقة لاحقاً: بدّلي `off` إلى `on` بعد وضع الرقم والكود
 * الصحيحين، فتظهر فوراً في الدفع والفوتر وصفحة الدعم معاً.
 */
export const pay: PayMethod[] = [
  // 🇸🇴 محلية — تحويل بكود USSD
  { id: "p1", nameAr: "EVC Plus", nameEn: "EVC Plus", operator: "Hormuud", numbers: ["612345678"], ussd: "*712*{num}*{amt}#", scope: "local", mark: "evc", status: "on" },
  { id: "p2", nameAr: "JEEB", nameEn: "JEEB", operator: "Somnet", numbers: ["901234567"], ussd: "*789*{num}*{amt}#", scope: "local", mark: "jeeb", status: "on" },
  { id: "p3", nameAr: "E-Dahab", nameEn: "E-Dahab", operator: "Somtel", numbers: [], ussd: "*770*{num}*{amt}#", scope: "local", mark: "edahab", status: "off" },
  { id: "p4", nameAr: "ZAAD", nameEn: "ZAAD", operator: "Telesom", numbers: [], ussd: "", scope: "local", mark: "zaad", status: "off" },
  { id: "p5", nameAr: "SAHAL", nameEn: "SAHAL", operator: "Golis", numbers: [], ussd: "", scope: "local", mark: "sahal", status: "off" },
  { id: "p6", nameAr: "WAAFI", nameEn: "WAAFI", operator: "Salaam Bank", numbers: [], ussd: "", scope: "local", mark: "waafi", status: "off" },
  // 🌍 عالمية — تُفتح حين يجهز حساب الاستقبال
  { id: "g1", nameAr: "PayPal", nameEn: "PayPal", numbers: [], ussd: "", scope: "global", mark: "paypal", status: "off" },
  { id: "g2", nameAr: "بطاقة ائتمان أو خصم", nameEn: "Credit / Debit card", numbers: [], ussd: "", scope: "global", mark: "card", status: "off" },
  { id: "g3", nameAr: "USDT (TRC20)", nameEn: "USDT (TRC20)", numbers: [], ussd: "", scope: "global", mark: "usdt", status: "off" },
  { id: "g4", nameAr: "Binance Pay", nameEn: "Binance Pay", numbers: [], ussd: "", scope: "global", mark: "binance", status: "off" },
];

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
