/**
 * دمج الباقات والمنتجات: الأصل الثابت + ما تعدّله أو تضيفه صاحبة المتجر.
 *
 * كل الأصناف في مجموعة واحدة `packages` يميّزها حقل `kind`، لا مجموعة
 * لكل قسم: قراءة واحدة تكفي الموقع كلّه، وإضافة قسم لاحقاً لا تحتاج
 * مجموعة جديدة ولا قاعدة أمان جديدة.
 *
 * والأصل الثابت يبقى: التعديل يعلوه حقلاً بحقل، والحذف من اللوحة يخفيه
 * (`hidden`) ولا يمسحه — فأي ندم يُصلَح بضغطة.
 */

import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { fbDb } from "./firebase";
import {
  accounts,
  elec,
  icons,
  pubg,
  tiktok,
  type ItemStatus,
} from "./data";

/**
 * أقسام الأصناف. الخمسة الأولى لها ملفّات ثابتة، وأي نصّ آخر هو **قسم
 * أضافته صاحبة المتجر من اللوحة** — أصنافه كلّها في Firestore، فيعمل
 * بلا سطر كود جديد. `string & {}` تُبقي الاقتراح في المحرّر وتسمح بالباقي.
 */
export type ItemKind =
  | "pubg"
  | "efootball"
  | "tiktok"
  | "accounts"
  | "elec"
  | (string & {});

/** الشكل الموحّد الذي تعرضه البطاقات مهما اختلف القسم */
export type ShopItem = {
  id: string;
  kind: ItemKind;
  /** ما يُكتب كبيراً على البطاقة: "660 UC" أو اسم الحساب أو المنتج */
  title: string;
  /** سطر صغير تحته */
  sub?: string;
  price: number;
  old?: number;
  disc?: number;
  img?: string;
  instant?: boolean;
  popular?: boolean;
  status: ItemStatus;
  order?: number;
  /** نقاط الولاء التي يربحها الزبون بشرائه — بلا قيمة يأخذ الافتراضي العام */
  points?: number;
  /** أُضيف من اللوحة لا من الملفات — يجوز حذفه نهائياً */
  custom?: boolean;
  /** محذوف من الموقع — تراه اللوحة وحدها ليمكن إرجاعه */
  hidden?: boolean;
};

/* ── تحويل الأصل الثابت إلى الشكل الموحّد ── */

const fromStatic: Record<string, () => ShopItem[]> = {
  pubg: () =>
    pubg.map((p) => ({
      id: p.id, kind: "pubg" as const,
      title: `${p.amount.toLocaleString("en")} UC`,
      price: p.price, old: p.old, disc: p.disc, img: p.img,
      instant: p.instant, popular: p.popular,
      status: p.status ?? "on", order: p.order,
    })),
  efootball: () =>
    icons.map((c) => ({
      id: c.id, kind: "efootball" as const,
      // نفس ترتيب العرض الحالي: اسم الباقة كبيراً والكمّية تحته
      title: c.name, sub: `${c.amount.toLocaleString("en")} 🪙`,
      price: c.price, old: c.old, img: c.img,
      instant: c.instant, popular: c.popular,
      status: c.status ?? "on", order: c.order,
    })),
  tiktok: () =>
    tiktok.map((a) => ({
      id: a.id, kind: "tiktok" as const,
      title: a.title, sub: a.note, price: a.price, img: a.img,
      status: a.status ?? "on", order: a.order,
    })),
  accounts: () =>
    accounts.map((a) => ({
      id: a.id, kind: "accounts" as const,
      title: a.title, sub: a.note, price: a.price, img: a.img,
      status: a.status ?? "on", order: a.order,
    })),
  elec: () =>
    elec.map((p) => ({
      id: p.id, kind: "elec" as const,
      title: p.name, sub: p.desc, price: p.price, old: p.old, disc: p.disc,
      img: p.img, status: p.status ?? "on", order: p.order,
    })),
};

/** ما يُحفظ في Firestore — كل الحقول اختيارية، والمذكور وحده يعلو الأصل */
export type ItemDoc = Partial<Omit<ShopItem, "id">> & { hidden?: boolean };

const READ_MS = 2500;

/**
 * ذاكرة قصيرة **في المتصفّح وحده**.
 * لوحة الإدارة كانت تقرأ المجموعة كاملة عند كل تبديل قسم، فيشعر
 * بالتأخير عند كل ضغطة. ثلاثون ثانية تكفي جلسة تحرير وتُلغى عند كل حفظ.
 * ولا تُستعمل على السيرفر: الذاكرة هناك تعيش عبر الطلبات فتُقدّم بيانات قديمة.
 */
let cache: { at: number; data: Record<string, ItemDoc> } | null = null;
const CACHE_MS = 30_000;

/** يُستدعى بعد كل حفظ أو حذف فتُقرأ البيانات من جديد */
export function clearItemsCache() {
  cache = null;
}

async function readItems(): Promise<Record<string, ItemDoc>> {
  const db = fbDb();
  if (!db) return {};

  const onClient = typeof window !== "undefined";
  if (onClient && cache && Date.now() - cache.at < CACHE_MS) return cache.data;

  try {
    const snap = await Promise.race([
      getDocs(collection(db, "packages")),
      new Promise<never>((_, r) => setTimeout(() => r(new Error("slow")), READ_MS)),
    ]);
    const out: Record<string, ItemDoc> = {};
    snap.docs.forEach((d) => (out[d.id] = d.data() as ItemDoc));
    if (onClient) cache = { at: Date.now(), data: out };
    return out;
  } catch {
    // بطء أو انقطاع ⇒ الموقع يعمل بالأصل الثابت بلا أن يشعر الزبون
    return {};
  }
}

/** أصناف قسم واحد بعد الدمج — مرتّبة، وبلا المحذوف */
export async function mergedItems(kind: ItemKind): Promise<ShopItem[]> {
  const over = await readItems();

  const base = (fromStatic[kind] ?? (() => []))().map((i) => {
    const o = over[i.id];
    return o ? ({ ...i, ...strip(o) } as ShopItem) : i;
  });

  // ما أضافته صاحبة المتجر من اللوحة ولا أصل له في الملفات
  const added: ShopItem[] = Object.entries(over)
    .filter(([id, o]) => o.kind === kind && !base.some((b) => b.id === id))
    .map(([id, o]) => ({
      id,
      kind,
      title: o.title ?? "",
      sub: o.sub,
      price: Number(o.price ?? 0),
      old: o.old,
      disc: o.disc,
      img: o.img,
      instant: o.instant,
      popular: o.popular,
      status: (o.status ?? "on") as ItemStatus,
      order: o.order,
      custom: true,
    }));

  return [...base, ...added]
    .filter((i) => !over[i.id]?.hidden && i.status !== "off")
    .map((i, idx) => ({ i, idx }))
    .sort((a, b) => (a.i.order ?? a.idx) - (b.i.order ?? b.idx) || a.idx - b.idx)
    .map(({ i }) => i);
}

/**
 * كل الأصناف بلا فلترة — للوحة الإدارة.
 *
 * وتحمل علامة `hidden` معها: بدونها كان المحذوف يعود للقائمة بنفس شكله
 * تماماً بعد الحذف، فتظنّ صاحبة المتجر أن الزرّ لا يعمل — وهو قد عمل.
 */
export async function allItems(kind: ItemKind): Promise<ShopItem[]> {
  const over = await readItems();
  const base = (fromStatic[kind] ?? (() => []))().map((i) => {
    const o = over[i.id];
    return o ? ({ ...i, ...strip(o), hidden: o.hidden === true } as ShopItem) : i;
  });
  const added: ShopItem[] = Object.entries(over)
    .filter(([id, o]) => o.kind === kind && !base.some((b) => b.id === id))
    .map(([id, o]) => ({
      id, kind, title: o.title ?? "", sub: o.sub,
      price: Number(o.price ?? 0), img: o.img,
      status: (o.status ?? "on") as ItemStatus, order: o.order, custom: true,
      hidden: o.hidden === true,
    }));
  return [...base, ...added];
}

/**
 * يُهمل الحقول الفارغة فلا تمحو قيمة الأصل بقيمة فارغة.
 *
 * ⚠️ إلا **الصورة**: فراغها قرارٌ صريح — لا تُحفظ فارغة إلا حين تضغط
 * صاحبة المتجر "Remove" ثم "Save". ولولا هذا الاستثناء لعادت الصورة
 * الأصلية بعد كل محاولة حذف، فتظنّ أن الحذف لا يعمل.
 */
function strip(o: ItemDoc): Partial<ShopItem> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    if (v === "" && k !== "img") continue;
    out[k] = v;
  }
  delete out.hidden;
  return out as Partial<ShopItem>;
}

/**
 * ⚠️ Firestore **يرمي خطأ** على أي حقل قيمته `undefined` — لا يتجاهله.
 * حقلٌ تركته صاحبة المتجر فارغاً (الترتيب مثلاً) كان يُفشل الحفظ كلّه
 * برسالة "تعذّر الحفظ" لا تقول أين الخطأ. فنحذف غير المعرّف قبل الكتابة.
 */
function clean(data: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) if (v !== undefined) out[k] = v;
  return out;
}

export async function saveItem(id: string, data: ItemDoc): Promise<boolean> {
  const db = fbDb();
  if (!db) return false;
  try {
    await setDoc(doc(db, "packages", id), clean(data as Record<string, unknown>), {
      merge: true,
    });
    clearItemsCache();
    return true;
  } catch {
    return false;
  }
}

/**
 * حذف صنف.
 * المضاف من اللوحة يُمحى نهائياً، والأصلي يُخفى فقط — لأن مسحه من
 * Firestore لا يمحوه من الملفات، فيعود عند أول تحديث ويحتار من حذفه.
 */
export async function removeItem(item: ShopItem): Promise<boolean> {
  const db = fbDb();
  if (!db) return false;
  try {
    if (item.custom) await deleteDoc(doc(db, "packages", item.id));
    else await setDoc(doc(db, "packages", item.id), { hidden: true }, { merge: true });
    clearItemsCache();
    return true;
  } catch {
    return false;
  }
}

/** إرجاع صنفٍ أصلي حُذف — يعود للزبون كما كان بضغطة */
export async function restoreItem(item: ShopItem): Promise<boolean> {
  const db = fbDb();
  if (!db) return false;
  try {
    await setDoc(doc(db, "packages", item.id), { hidden: false }, { merge: true });
    clearItemsCache();
    return true;
  } catch {
    return false;
  }
}

/** معرّف جديد لصنف تضيفه صاحبة المتجر — لا يصطدم بمعرّفات الملفات */
export const newItemId = (kind: ItemKind) =>
  `${kind}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** تحويل الصنف الموحّد إلى بطاقة الشراء — نفس الحقول باسمَين مختلفين */
export function toPack(i: ShopItem) {
  return {
    id: i.id,
    soon: i.status !== "on",
    title: i.title,
    sub: i.sub,
    price: i.price,
    old: i.old,
    disc: i.disc,
    img: i.img,
    instant: i.instant,
    popular: i.popular,
  };
}
