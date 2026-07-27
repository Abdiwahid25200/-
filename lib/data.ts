/**
 * ⚠️ بيانات تجريبية مؤقتة — تُستبدل ببيانات Firestore الحقيقية في المرحلة ٣.
 *
 * الأشكال هنا مطابقة لبنية كائن DB في الموقع القديم، حتى يكون الاستبدال
 * لاحقاً مجرد تغيير مصدر البيانات دون لمس أي صفحة.
 */

export type Product = {
  id: string;
  name: string;
  /** مسار الصورة داخل public/ — مثال: "/images/elec/headset.jpg" */
  img?: string;
  price: number;
  old?: number;
  disc?: number;
  desc?: string;
};

export type UcPack = {
  id: string;
  amount: number;
  img?: string;
  price: number;
  old?: number;
  disc?: number;
};

export type CoinPack = {
  id: string;
  name: string;
  amount: number;
  img?: string;
  price: number;
  old?: number;
};

export type GameAccount = {
  id: string;
  title: string;
  img?: string;
  price: number;
  note?: string;
};

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
  { id: "u1", amount: 60, price: 1.2 },
  { id: "u2", amount: 325, price: 6, disc: 10 },
  { id: "u3", amount: 660, price: 10.5 },
  { id: "u4", amount: 1800, price: 30, disc: 10 },
  { id: "u5", amount: 3850, price: 54 },
  { id: "u6", amount: 8100, price: 120, disc: 10 },
];

/** كوينز eFootball */
export const icons: CoinPack[] = [
  { id: "c1", name: "باقة صغيرة", amount: 100, price: 1.5 },
  { id: "c2", name: "باقة فضية", amount: 550, price: 7.5, old: 8 },
  { id: "c3", name: "باقة ذهبية", amount: 1300, price: 16 },
  { id: "c4", name: "باقة بلاتينية", amount: 2800, price: 33, old: 36 },
  { id: "c5", name: "باقة ماسية", amount: 5900, price: 68 },
  { id: "c6", name: "الباقة الكبرى", amount: 12000, price: 130, old: 145 },
];

/** خدمات تيك توك */
export const tiktok: Product[] = [
  { id: "t1", name: "١٠٠٠ متابع", price: 8, disc: 25, desc: "متابعون حقيقيون · تسليم تدريجي" },
  { id: "t2", name: "٥٠٠٠ متابع", price: 25, desc: "تسليم خلال ٢٤ ساعة" },
  { id: "t3", name: "١٠٬٠٠٠ مشاهدة", price: 3, desc: "مشاهدات سريعة لأي فيديو" },
  { id: "t4", name: "١٠٠٠ لايك", price: 5, disc: 20, desc: "تفاعل حقيقي" },
  { id: "t5", name: "عملات تيك توك ٧٠٠", price: 9, desc: "شحن مباشر للحساب" },
  { id: "t6", name: "عملات تيك توك ١٤٠٠", price: 20, disc: 15, desc: "شحن مباشر للحساب" },
];

/** حسابات eFootball الجاهزة — كل حساب فريد ويُباع مرة واحدة */
export const accounts: GameAccount[] = [
  { id: "a1", title: "حساب eFootball — ٥ نجوم", price: 45, note: "فريق كامل · لاعبون مميزون" },
  { id: "a2", title: "حساب eFootball — ٤ نجوم", price: 28, note: "رصيد كوينز إضافي" },
  { id: "a3", title: "حساب مبتدئ + ٢٠٠٠ كوينز", price: 15, note: "مناسب للبداية" },
];

/** طرق الدفع — نفس شكل DB.pay في الموقع القديم */
export type PayMethod = {
  id: string;
  nameAr: string;
  nameEn: string;
  numbers: string[];
  ussd: string;
  on: boolean;
};

export const pay: PayMethod[] = [
  { id: "p1", nameAr: "EVC Plus", nameEn: "EVC Plus", numbers: ["612345678"], ussd: "*712*{num}*{amt}#", on: true },
  { id: "p2", nameAr: "JEEB", nameEn: "JEEB", numbers: ["901234567"], ussd: "*789*{num}*{amt}#", on: true },
  { id: "p3", nameAr: "E-Dahab", nameEn: "E-Dahab", numbers: ["651234567"], ussd: "*770*{num}*{amt}#", on: true },
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
