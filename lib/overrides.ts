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

import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
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

export const readSections = () => readAll<SectionOverride>("sections");
export const readPackages = () => readAll<ItemOverride>("packages");
export const readProducts = () => readAll<ItemOverride>("products");

/** حفظ تعديل — `merge` فلا يمحو حقلاً لم تلمسه صاحبة المتجر */
export async function saveOverride(
  col: "sections" | "packages" | "products" | "settings",
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
  col: "sections" | "packages" | "products",
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

import { sections as staticSections, type Section } from "./content";

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
