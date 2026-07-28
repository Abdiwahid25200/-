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
  tagline: { en: "Top-ups & electronics", ar: "شدات وإلكترونيات", so: "Buuxin & elektaroonig" } as Multilang,
  /** رقم واتساب بصيغة دولية بلا رموز — مثال: 252612345678 */
  whatsapp: "",
  email: "",
  telegram: "",
  hours: { en: "Sat – Thu · 9am – 11pm", ar: "السبت – الخميس · ٩ص – ١١م", so: "Sabti – Khamiis · 9am – 11pm" } as Multilang,
  /** يُعرض بصفحة الدعم والفوتر */
  address: { en: "", ar: "", so: "" } as Multilang,
};

/** قنوات الدعم المعروضة بصفحة المساعدة — الترتيب هنا هو ترتيب العرض */
export const supportChannels = [
  { key: "whatsapp", icon: "whatsapp", field: "whatsapp" },
  { key: "email", icon: "email", field: "email" },
  { key: "hours", icon: "clock", field: "hours" },
  { key: "inquiries", icon: "chat", field: "email" },
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
