/**
 * قراءة إعدادات الفتح **على الخادم** — قبل أن تُرسَل الصفحة أصلاً.
 *
 * 🔒 **ولهذا وُجد هذا الملف**: قالت «إذا أغلقتُ الموقع لا يرى العميل ما
 *    فيه ولو لحظة». ولو قرأنا الإعدادات في المتصفّح وحده لوصلت الصفحةُ
 *    كاملةً ثم اختفت بعد جزءٍ من الثانية — يراها من ينظر، وتلتقطها
 *    لقطةُ الشاشة، ويقرؤها جوجل. فالحاجز يُرسَم في HTML من الخادم.
 *
 * ⚠️ **وبـREST لا بحزمة Firebase**: الحزمة تفتح اتّصالاً وتحمل مئات
 *    الكيلوبايتات لأجل حقلٍ واحد، وهنا يكفي طلبُ `fetch` واحد يخزّنه
 *    Next دقيقةً كاملة — فألف زائرٍ في الدقيقة لا يكلّفون ألف قراءة.
 *
 * ⚠️ **وتعذّر القراءة يعني: المتجر مفتوح.** عطلُ شبكةٍ يجب ألّا يقفل
 *    متجراً — الخسارة في الاتّجاه الآخر أكبر بكثير.
 */

import { fbApiKey, fbProjectId } from "./firebase";
import { DEFAULT_OPEN, normalizeOpen, type OpenSettings } from "./openCore";

/**
 * كم يبقى الجواب محفوظاً قبل أن يُسأل Firestore ثانيةً.
 *
 * ⚠️ **ستّون كبقيّة الموقع عمداً**: صفحات المتجر تُبنى كل ٦٠ ثانية
 *    (`revalidate = 60`)، ورقمٌ أصغر هنا يجرّها كلَّها إلى إيقاعه —
 *    فتُعاد كل صفحةٍ أربع مرّاتٍ في الدقيقة وتُقرأ الأقسام والمنتجات معها.
 *
 * 🏷️ ولا تنتظر صاحبةُ المتجر الدقيقة: **الوسم** يُبطِل هذا الحفظ لحظة
 *    ضغطها «Save» (`app/api/revalidate-store/route.ts`).
 */
const CACHE_S = 60;

/** وسم الحفظ — تُنادى `revalidateTag` به فيسقط المحفوظ فوراً */
export const OPEN_TAG = "store-open";

type RestValue = Record<string, unknown>;

/** قيمة Firestore الموسومة (`{stringValue:"…"}`) ⇐ قيمةٌ عادية */
function decode(v: RestValue): unknown {
  if ("booleanValue" in v) return v.booleanValue === true;
  if ("stringValue" in v) return String(v.stringValue ?? "");
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("mapValue" in v)
    return fields((v.mapValue as { fields?: Record<string, RestValue> })?.fields ?? {});
  if ("arrayValue" in v)
    return ((v.arrayValue as { values?: RestValue[] })?.values ?? []).map(decode);
  return null;
}

function fields(f: Record<string, RestValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(f)) out[k] = decode(v ?? {});
  return out;
}

export async function readOpenSettingsServer(): Promise<OpenSettings> {
  if (!fbProjectId || !fbApiKey) return DEFAULT_OPEN;

  const url =
    `https://firestore.googleapis.com/v1/projects/${fbProjectId}` +
    `/databases/(default)/documents/settings/store?key=${fbApiKey}`;

  try {
    const r = await fetch(url, { next: { revalidate: CACHE_S, tags: [OPEN_TAG] } });
    // ٤٠٤ = لم تُحفظ الإعدادات بعد ⇒ الافتراضي (مفتوح)
    if (!r.ok) return DEFAULT_OPEN;
    const doc = (await r.json()) as { fields?: Record<string, RestValue> };
    return normalizeOpen(fields(doc.fields ?? {}) as Partial<OpenSettings>);
  } catch {
    return DEFAULT_OPEN;
  }
}
