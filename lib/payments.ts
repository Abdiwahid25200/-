/**
 * طرق الدفع — الأصل في `lib/data.ts` وتعلوه تعديلات اللوحة.
 *
 * ⚠️ هذه أهمّ قائمة في المتجر: ما دامت كلّها `soon` لا تظهر خطوة الدفع
 *    أصلاً. تشغيل طريقة واحدة من اللوحة يفتح الخطوة فوراً في السلة
 *    وفي صفحات الألعاب معاً.
 *
 * والأرقام تُكتب في اللوحة مفصولةً بفاصلة — لأن كتابة مصفوفة JSON
 * على الجوال مصيدة أخطاء لا تُغتفر (فاصلة زائدة تُفشل الحفظ كلّه).
 */

import { collection, getDocs } from "firebase/firestore";
import { fbDb } from "./firebase";
import { pay as staticPay, type PayMethod } from "./data";

export type PayOverride = Partial<
  Omit<PayMethod, "numbers"> & { numbers: string[]; hidden: boolean; custom: boolean; order: number }
>;

let cache: { at: number; data: Record<string, PayOverride> } | null = null;
const TTL = 60_000;

export async function readPayOverrides(): Promise<Record<string, PayOverride>> {
  const db = fbDb();
  if (!db) return {};
  if (cache && Date.now() - cache.at < TTL) return cache.data;

  try {
    const snap = await getDocs(collection(db, "payments"));
    const out: Record<string, PayOverride> = {};
    snap.docs.forEach((d) => (out[d.id] = d.data() as PayOverride));
    cache = { at: Date.now(), data: out };
    return out;
  } catch {
    return {};
  }
}

export const clearPayCache = () => (cache = null);

/** نصّ الأرقام في اللوحة ⇐ مصفوفة نظيفة */
export const toNumbers = (s: string) =>
  s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

/** طرق الدفع بعد الدمج — الأصلية ثمّ ما أضافته صاحبة المتجر */
export async function mergedPay(): Promise<PayMethod[]> {
  const over = await readPayOverrides();

  const base = staticPay
    .filter((p) => !over[p.id]?.hidden)
    .map((p) => ({ ...p, ...clean(over[p.id]) }) as PayMethod);

  const added = Object.entries(over)
    .filter(([id, o]) => o.custom === true && !staticPay.some((p) => p.id === id) && !o.hidden)
    .map(
      ([id, o]) =>
        ({
          id,
          nameAr: o.nameAr ?? id,
          nameEn: o.nameEn ?? id,
          operator: o.operator,
          numbers: o.numbers ?? [],
          ussd: o.ussd ?? "",
          scope: o.scope ?? "local",
          mark: o.mark ?? "card",
          status: o.status ?? "on",
        }) as PayMethod,
    );

  return [...base, ...added].sort(
    (a, b) => (over[a.id]?.order ?? 99) - (over[b.id]?.order ?? 99),
  );
}

/** الحقل الفارغ لا يمحو الأصل — إلا الأرقام، ففراغها قرارٌ صريح */
function clean(o?: PayOverride) {
  if (!o) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    if (v === "" && k !== "ussd") continue;
    if (k === "hidden" || k === "custom" || k === "order") continue;
    out[k] = v;
  }
  return out;
}
