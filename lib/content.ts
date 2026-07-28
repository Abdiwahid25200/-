/**
 * محتوى المتجر القابل للتعديل.
 *
 * ⚠️ كل ما في هذا الملف مصمّم ليُدار من لوحة الإدارة لاحقاً (المرحلة ٤):
 * تُقرأ نفس الحقول من Firestore بدل القيم الثابتة هنا، دون أي تعديل على الصفحات.
 * فأي نص أو رقم يظهر للزبون يجب أن يعيش هنا — لا داخل المكوّنات.
 */

export type Multilang = { en: string; ar: string; so: string };

/** بيانات المتجر — تُعدَّل من: الإدارة ← عام ← الإعدادات */
export const site = {
  brand: "Ramaan Store",
  tagline: {
    en: "Top-ups & electronics",
    ar: "شدات وإلكترونيات",
    so: "Buuxin & elektaroonig",
  } as Multilang,
  /** وصف قصير يظهر بالفوتر */
  description: {
    en: "Your trusted store for game top-ups, gaming accounts and electronics — fair prices and instant delivery worldwide.",
    ar: "متجرك الموثوق لشحن الألعاب وحسابات الألعاب والإلكترونيات — أسعار عادلة وتسليم فوري لكل العالم.",
    so: "Dukaankaaga lagu kalsoon yahay ee buuxinta ciyaaraha, akoonnada iyo elektaroonigga — qiimo cadaalad ah iyo gaarsiin degdeg ah.",
  } as Multilang,
  /** رقم واتساب بصيغة دولية بلا رموز — مثال: 252612345678 */
  whatsapp: "",
  email: "",
  telegram: "",
  hours: {
    en: "Sat – Thu · 9am – 11pm",
    ar: "السبت – الخميس · ٩ص – ١١م",
    so: "Sabti – Khamiis · 9am – 11pm",
  } as Multilang,
  address: {
    en: "Mogadishu, Somalia",
    ar: "مقديشو، الصومال",
    so: "Muqdisho, Soomaaliya",
  } as Multilang,
};

/** روابط الفوتر — تُعدَّل من: الإدارة ← الموقع ← الأقسام */
export const footerLinks = {
  quick: [
    { key: "home", href: "/" },
    { key: "games", href: "/games" },
    { key: "accounts", href: "/accounts" },
    { key: "help", href: "/help" },
  ],
  policies: [
    { key: "privacy", href: "/policy#privacy" },
    { key: "terms", href: "/policy#terms" },
    { key: "refund", href: "/policy#refund" },
  ],
} as const;

/** وسائل الدفع المعروضة بالفوتر — تُعدَّل من: الإدارة ← الطلبات ← طرق الدفع */
export const acceptedPayments = [
  "PayPal",
  "Visa",
  "Mastercard",
  "USDT",
  "Binance Pay",
  "EVC Plus",
  "JEEB",
  "E-Dahab",
  "ZAAD",
  "SAHAL",
  "WAAFI",
];

/* ═══════════════════════════════════════════════════════════
   أقسام المتجر — تُدار من: الإدارة ← الموقع ← الأقسام
   ═══════════════════════════════════════════════════════════ */

export type SectionStatus =
  | "on"    // ظاهر ويعمل
  | "soon"  // ظاهر بشارة "قريباً" ولا يفتح
  | "off";  // مخفي تماماً

export type Section = {
  /** مفتاح الترجمة في messages/*.json ← pages.<key> */
  key: string;
  href: string;
  /** مفتاح الأيقونة الملوّنة في components/icons.tsx */
  icon: "pubg" | "efoot" | "tiktok" | "device" | "games";
  /** الصفحة التي يظهر بها: الألعاب أم الحسابات */
  group: "games" | "accounts";
  status: SectionStatus;
  /** وسم على البطاقة: فوري (يُشحن تلقائياً) أم يدوي (بمراجعة) */
  badge?: "instant" | "manual";
  /** صورة القسم — تُرفع لاحقاً من لوحة الإدارة إلى public/images/sections/ */
  img?: string;
};

/**
 * لإضافة قسم جديد: أضيفي عنصراً هنا بحالة "soon" — سيظهر فوراً
 * بشارة "قريباً" دون الحاجة لصفحة. وعند جاهزية الصفحة غيّري الحالة إلى "on".
 */
export const sections: Section[] = [
  { key: "pubg", href: "/pubg", icon: "pubg", group: "games", status: "on", badge: "instant" },
  { key: "efootball", href: "/efootball", icon: "efoot", group: "games", status: "on", badge: "manual" },
  { key: "efootballAccounts", href: "/efootball-accounts", icon: "efoot", group: "accounts", status: "on", badge: "manual" },
  { key: "tiktok", href: "/tiktok", icon: "tiktok", group: "accounts", status: "on", badge: "manual" },
];

/** أقسام المجموعة الظاهرة فقط (تستبعد off) */
export const visibleSections = (group: Section["group"]) =>
  sections.filter((s) => s.group === group && s.status !== "off");

/** هل القسم مفتوح فعلاً؟ يمنع فتح صفحة قسم موقوف */
export const isSectionOpen = (key: string) =>
  sections.find((s) => s.key === key)?.status === "on";

/**
 * رابط خدمة التحقق من آيدي ببجي — تُدار من: الإدارة ← عام ← الإعدادات
 * تُقرأ من متغيّر البيئة أولاً حتى لا يُرفع الرابط على GitHub إن كان خاصاً.
 */
export const pubgIdApi = process.env.PUBG_ID_API ?? "";

/**
 * قسم "كيف يعمل المتجر" بصفحة الدعم — تُدار من: الإدارة ← الموقع ← النصوص
 * `youtubeId` فارغ ⇒ يُخفى الفيديو وتبقى الخطوات الثلاث ظاهرة.
 */
export const howItWorks = {
  youtubeId: "",
  steps: ["choose", "pay", "receive"] as const,
};

/** قنوات الدعم بصفحة المساعدة — الترتيب هنا هو ترتيب العرض */
export const supportChannels = [
  { key: "whatsapp", icon: "whatsapp" },
  { key: "email", icon: "email" },
  { key: "hours", icon: "clock" },
  { key: "inquiries", icon: "chat" },
] as const;

/** الأسئلة الشائعة — تُعدَّل من: الإدارة ← الموقع ← الأسئلة */
export const faqKeys = ["delivery", "efootball", "payment", "track", "refund"] as const;

/** بنود السياسات — تُعدَّل من: الإدارة ← الموقع ← السياسات */
export const policyKeys = ["terms", "privacy", "refund", "delivery"] as const;

/** ضمانات الثقة — تُعدَّل من: الإدارة ← الموقع ← النصوص */
export const trustKeys = ["instant", "secure", "support", "trusted"] as const;

/** حالة المتجر — تُعدَّل من: الإدارة ← المتابعة ← حالة المتجر */
export const storeStatus = {
  closed: false,
  closedNote: { en: "", ar: "", so: "" } as Multilang,
};
