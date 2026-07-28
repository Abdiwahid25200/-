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
