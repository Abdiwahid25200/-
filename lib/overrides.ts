/**
 * طبقة التعديلات — ما تغيّره صاحبة المتجر من لوحة الإدارة.
 *
 * ⚠️ **لا تستبدل الملفات الثابتة، بل تعلوها.** الأصل يبقى في
 *    `lib/content.ts` و`lib/data.ts`، وما في Firestore يعلوه حقلاً بحقل.
 *    الفائدة: لو فرغت قاعدة البيانات أو تعذّر الوصول إليها، يظهر الموقع
 *    كما هو اليوم بالضبط — لا صفحة بيضاء ولا أقسام مفقودة.
 *
 * القراءة عامّة (متجر عام)، والكتابة للأدمن وحده — الشرط في
 * `firestore.rules` لا هنا، فلا ينفع تجاوزه من المتصفّح.
 */

import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { fbDb } from "./firebase";
import type { Multilang } from "./content";

/** ما يمكن تعديله في القسم — كل حقل اختياري، والمذكور وحده يعلو الأصل */
export type SectionOverride = {
  /** صورة الترويسة والبلاطة والقائمة الجانبية */
  img?: string;
  /** `on` · `soon` · `off` */
  status?: string;
  badge?: string;
  /** الاسم المكتوب على الخلفية */
  title?: Partial<Multilang>;
  /** السطر تحته */
  note?: Partial<Multilang>;
  /** الوسم الصغير فوق الاسم */
  eyebrow?: Partial<Multilang>;
  /** ترتيب العرض */
  order?: number;
  /** حذف من الموقع دون حذف الملف الأصلي */
  hidden?: boolean;

  /* ── الأقسام المضافة من اللوحة ──
     قسمٌ لا أصل له في `lib/content.ts`: لعبة جديدة أضافتها صاحبة المتجر
     بنفسها. صفحته تُولَد تلقائياً على `/s/{key}` — فلا تحتاج مبرمجاً. */

  /** أُضيف من اللوحة لا من الملفات */
  custom?: boolean;
  /** أين يظهر: `games` · `accounts` · `home` */
  group?: string;
  /** الأيقونة الافتراضية حين لا صورة */
  icon?: string;
  /**
   * كيف يشتري الزبون:
   * `pay` — يدخل آيديه ويدفع بنفسه (شدّات وكوينز)
   * `whatsapp` — يترك رقمه وتُكملين معه (حسابات وأسعار متّفق عليها)
   */
  flow?: string;
};

export type ItemOverride = {
  img?: string;
  price?: number;
  /** نقاط الولاء التي يربحها الزبون بشراء هذا الصنف (`lib/points.ts`) */
  points?: number;
  status?: string;
  order?: number;
  title?: string;
  note?: string;
  hidden?: boolean;
};

/**
 * مهلة قصيرة على القراءة.
 * صفحات المتجر تُبنى على السيرفر، ولو تعلّقت قراءة Firestore لتعلّقت
 * الصفحة كلّها أمام الزبون. ثانيتان ثم نكمل بالأصل الثابت.
 */
const READ_MS = 2500;

async function readAll<T>(col: string): Promise<Record<string, T>> {
  const db = fbDb();
  if (!db) return {};

  try {
    const snap = await Promise.race([
      getDocs(collection(db, col)),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("slow")), READ_MS),
      ),
    ]);
    const out: Record<string, T> = {};
    snap.docs.forEach((d) => (out[d.id] = d.data() as T));
    return out;
  } catch {
    // بطء أو انقطاع ⇒ الموقع يعمل بالأصل الثابت بلا أن يشعر الزبون
    return {};
  }
}

/**
 * تعديلات الأقسام — بذاكرة قصيرة (دقيقة).
 * بطاقات الطلبات تسأل عنها كلٌّ على حدة، فبلا ذاكرةٍ صارت قراءةً
 * لكل بطاقة على شاشة واحدة.
 */
let secCache: { at: number; data: Record<string, SectionOverride> } | null = null;

export async function readSections(): Promise<Record<string, SectionOverride>> {
  if (secCache && Date.now() - secCache.at < 60_000) return secCache.data;
  const data = await readAll<SectionOverride>("sections");
  if (typeof window !== "undefined") secCache = { at: Date.now(), data };
  return data;
}
export const readPackages = () => readAll<ItemOverride>("packages");
export const readProducts = () => readAll<ItemOverride>("products");

/** حفظ تعديل — `merge` فلا يمحو حقلاً لم تلمسه صاحبة المتجر */
export async function saveOverride(
  col: "sections" | "packages" | "products" | "settings" | "slides" | "payments",
  id: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  const db = fbDb();
  if (!db) return false;
  try {
    // Firestore يرمي خطأ على أي حقل undefined — نحذفه قبل الكتابة
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) if (v !== undefined) clean[k] = v;
    await setDoc(doc(db, col, id), clean, { merge: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * حذف تعديلٍ نهائياً — للأقسام التي أنشأتها صاحبة المتجر وحدها.
 *
 * ⚠️ لا يُستعمل مع الأقسام الأصلية: مسحُ تعديلها لا يمحوها من
 * `lib/content.ts` فتعود كما كانت، ويحتار من ظنّ أنه حذفها. إخفاؤها
 * يكون بالحالة `off` لا بالحذف.
 */
export async function deleteOverride(
  col: "sections" | "packages" | "products" | "slides" | "payments",
  id: string,
): Promise<boolean> {
  const db = fbDb();
  if (!db) return false;
  try {
    await deleteDoc(doc(db, col, id));
    return true;
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════
   بيانات المتجر — أرقام التواصل وساعات العمل
   ═══════════════════════════════════════════════════════════ */

export type SiteOverride = {
  /** اسم المتجر ووسمه — يظهران في الترويسة والقائمة */
  brand?: string;
  tagline?: Partial<Multilang>;
  whatsapp?: string;
  email?: string;
  telegram?: string;
  hours?: Partial<Multilang>;
};

/**
 * بيانات المتجر بعد التعديل — `settings/store` يعلو `lib/content.ts`.
 *
 * ⚠️ لا يرمي خطأً أبداً: تعذّر القراءة ⇒ الأصل الثابت. صفحة الدعم
 *    يجب ألّا تنكسر لأن وثيقة إعدادات غائبة أو الشبكة بطيئة.
 */
export async function mergedSite(): Promise<
  typeof siteStatic & {
    hoursOf: (locale: string) => string;
    taglineOf: (locale: string) => string;
  }
> {
  const db = fbDb();
  let o: SiteOverride = {};
  if (db) {
    try {
      const snap = await Promise.race([
        getDoc(doc(db, "settings", "store")),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("slow")), READ_MS)),
      ]);
      if (snap.exists()) o = snap.data() as SiteOverride;
    } catch {
      o = {};
    }
  }

  return {
    ...siteStatic,
    brand: o.brand || siteStatic.brand,
    taglineOf: (locale: string) =>
      pick(o.tagline, locale, siteStatic.tagline[locale as keyof typeof siteStatic.tagline] ?? ""),
    whatsapp: o.whatsapp ?? siteStatic.whatsapp,
    email: o.email ?? siteStatic.email,
    telegram: o.telegram ?? siteStatic.telegram,
    hoursOf: (locale: string) => pick(o.hours, locale, siteStatic.hours[locale as keyof typeof siteStatic.hours] ?? ""),
  };
}

/* ═══════════════════════════════════════════════════════════
   النصوص العامّة — «كيف يعمل المتجر» · السياسات · اسم المتجر
   ═══════════════════════════════════════════════════════════ */

/** وثيقة نصوص: مفتاحٌ مسطّح ⇐ ثلاث لغات. مثال: `steps.choose.title` */
export type TextDoc = Record<string, Partial<Multilang>>;

/**
 * ⚠️ لا ترمي خطأً: تعذّر القراءة ⇒ كائن فارغ ⇒ تظهر نصوص
 * `messages/*.json` الأصلية. صفحةٌ بنصّها الأصلي خيرٌ من صفحة بيضاء.
 */
export async function readTexts(id: string): Promise<TextDoc> {
  const db = fbDb();
  if (!db) return {};
  try {
    const snap = await Promise.race([
      getDoc(doc(db, "settings", id)),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("slow")), READ_MS)),
    ]);
    return snap.exists() ? (snap.data() as TextDoc) : {};
  } catch {
    return {};
  }
}

/** نصّ من الوثيقة بلغة الصفحة، وإلا الأصل من الترجمات */
export function tx(
  d: TextDoc,
  key: string,
  locale: string,
  fallback: string,
): string {
  return pick(d[key], locale, fallback);
}

/* ═══════════════════════════════════════════════════════════
   شرائح البانر
   ═══════════════════════════════════════════════════════════ */

export type SlideOverride = {
  img?: string;
  href?: string;
  kicker?: Partial<Multilang>;
  title?: Partial<Multilang>;
  note?: Partial<Multilang>;
  order?: number;
  hidden?: boolean;
  custom?: boolean;
};

export const readSlides = () => readAll<SlideOverride>("slides");

/** شريحة جاهزة للعرض — النصّ المعدَّل يعلو الترجمة، وبلاه تبقى الترجمة */
export type MergedSlide = {
  key: string;
  href: string;
  img?: string;
  kicker?: string;
  title?: string;
  note?: string;
};

/**
 * شرائح البانر بعد الدمج، ثمّ ما أضافته صاحبة المتجر.
 * الشريحة المضافة تحمل نصّها معها — لا مفتاح ترجمة لها في `messages`.
 */
export async function mergedSlides(locale: string): Promise<MergedSlide[]> {
  const over = await readSlides();

  const base: MergedSlide[] = staticSlides
    .filter((s) => !over[s.key]?.hidden)
    .map((s) => ({
      key: s.key,
      href: over[s.key]?.href || s.href,
      img: over[s.key]?.img || s.img,
      kicker: pick(over[s.key]?.kicker, locale, ""),
      title: pick(over[s.key]?.title, locale, ""),
      note: pick(over[s.key]?.note, locale, ""),
    }));

  const added: MergedSlide[] = Object.entries(over)
    .filter(([key, o]) => o.custom === true && !staticSlides.some((s) => s.key === key) && !o.hidden)
    .map(([key, o]) => ({
      key,
      href: o.href || "/",
      img: o.img,
      kicker: pick(o.kicker, locale, ""),
      title: pick(o.title, locale, key),
      note: pick(o.note, locale, ""),
    }));

  return [...base, ...added].sort(
    (a, b) => (over[a.key]?.order ?? 99) - (over[b.key]?.order ?? 99),
  );
}

/** يختار قيمة اللغة من التعديل، وإلا يرجع الأصل */
export function pick(
  over: Partial<Multilang> | undefined,
  locale: string,
  fallback: string,
): string {
  const v = over?.[locale as keyof Multilang];
  return typeof v === "string" && v.trim() ? v : fallback;
}

/* ═══════════════════════════════════════════════════════════
   الدمج — الأصل الثابت تعلوه تعديلات الإدارة
   ═══════════════════════════════════════════════════════════ */

import {
  sections as staticSections,
  site as siteStatic,
  slides as staticSlides,
  type Section,
} from "./content";

export type MergedSection = Section & {
  over?: SectionOverride;
  /** أُضيف من اللوحة — اسمه في التعديل نفسه لا في `messages/*.json` */
  custom?: boolean;
};

/** تحويل تعديلٍ مضاف من اللوحة إلى قسم كامل بصفحته المولّدة */
function asCustom(key: string, o: SectionOverride): MergedSection {
  return {
    key,
    href: `/s/${key}`,
    icon: (o.icon ?? "games") as Section["icon"],
    group: (o.group ?? "games") as Section["group"],
    status: (o.status ?? "on") as Section["status"],
    badge: o.badge as Section["badge"],
    img: o.img,
    over: o,
    custom: true,
  };
}

/** الأقسام التي أضافتها صاحبة المتجر — بلا فلترة، للوحة والخريطة */
export async function customSections(): Promise<MergedSection[]> {
  const over = await readSections();
  return Object.entries(over)
    .filter(([key, o]) => o.custom === true && !staticSections.some((s) => s.key === key))
    .map(([key, o]) => asCustom(key, o));
}

/**
 * أقسام مجموعة واحدة بعد تطبيق التعديلات.
 * الحالة والصورة والترتيب تُقرأ من التعديل إن وُجد، وإلا من الأصل،
 * **ثم تُضاف الأقسام التي أنشأتها صاحبة المتجر من اللوحة**.
 */
export async function mergedSections(
  group: Section["group"],
): Promise<MergedSection[]> {
  const over = await readSections();

  const base: MergedSection[] = staticSections
    .map((s) => ({ ...s, over: over[s.key] }))
    .filter((s) => {
      const status = s.over?.status ?? s.status;
      return s.group === group && status !== "off" && !s.over?.hidden;
    })
    .map((s) => ({
      ...s,
      status: (s.over?.status ?? s.status) as Section["status"],
      img: s.over?.img || s.img,
      badge: (s.over?.badge ?? s.badge) as Section["badge"],
    }));

  const added = Object.entries(over)
    .filter(
      ([key, o]) =>
        o.custom === true &&
        !staticSections.some((s) => s.key === key) &&
        (o.group ?? "games") === group &&
        (o.status ?? "on") !== "off" &&
        !o.hidden,
    )
    .map(([key, o]) => asCustom(key, o));

  return [...base, ...added].sort(
    (a, b) => (a.over?.order ?? 99) - (b.over?.order ?? 99),
  );
}

/** تعديل قسم واحد بمفتاحه — لترويسة صفحته */
export async function sectionOverride(key: string): Promise<SectionOverride> {
  const all = await readSections();
  return all[key] ?? {};
}
