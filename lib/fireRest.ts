/**
 * Firestore وAuth من **الخادم** بـREST — بلا حزمة Firebase وبلا Service Account.
 *
 * 🔑 **لماذا REST لا الحزمة**: الحزمة تفتح اتّصالاً حيّاً وتُحمّل مئات
 *    الكيلوبايتات، والخادم هنا يسأل سؤالاً واحداً ويمضي. و`storeOpenServer.ts`
 *    يفعل هذا منذ البداية — وهذا الملف يجمع ما تكرّر منه ليقرأه غيره.
 *
 * 🔒 **وكيف يقرأ الخادم بياناتٍ محميّة بلا مفتاح سرّي**: يسجّل الدخول
 *    بحسابٍ حقيقيّ (بريد وكلمة سرّ في متغيّرات Vercel) فيحصل على رمزٍ
 *    مؤقّت، ثم يقرأ به كما يقرأ أي متصفّح. فالقواعد تبقى هي الحارس نفسه —
 *    لا بابَ خلفيّاً يتجاوزها، ولا مفتاحَ يفتح كل شيء لو تسرّب.
 *
 * ⚠️ **ولا يُطبع شيء من هذا في السجلّ**: الرموز وكلمات السرّ تمرّ هنا،
 *    وسجلّ Vercel يُقرأ.
 */

import { fbApiKey, fbProjectId } from "./firebase";

const DOCS =
  `https://firestore.googleapis.com/v1/projects/${fbProjectId}` +
  `/databases/(default)/documents`;

export type RestValue = Record<string, unknown>;

/** قيمة Firestore الموسومة (`{stringValue:"…"}`) ⇐ قيمةٌ عادية */
export function decode(v: RestValue): unknown {
  if (!v) return null;
  if ("booleanValue" in v) return v.booleanValue === true;
  if ("stringValue" in v) return String(v.stringValue ?? "");
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("timestampValue" in v) return String(v.timestampValue ?? "");
  if ("mapValue" in v)
    return decodeFields((v.mapValue as { fields?: Record<string, RestValue> })?.fields ?? {});
  if ("arrayValue" in v)
    return ((v.arrayValue as { values?: RestValue[] })?.values ?? []).map(decode);
  return null;
}

export function decodeFields(f: Record<string, RestValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(f ?? {})) out[k] = decode(v ?? {});
  return out;
}

export type Signed = { idToken: string; uid: string; email: string };

/**
 * دخولٌ ببريدٍ وكلمة سرّ — يعيد رمزاً صالحاً ساعة.
 * وأي فشل (كلمة سرّ خاطئة · حسابٌ موقوف · شبكة) يعيد `null` بلا تفصيل:
 * من يجرّب كلمات السرّ لا يُعطى دليلاً على أيّها اقترب.
 */
export async function signIn(email: string, password: string): Promise<Signed | null> {
  if (!fbApiKey || !email || !password) return null;
  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${fbApiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      },
    );
    if (!r.ok) return null;
    const d = (await r.json()) as { idToken?: string; localId?: string; email?: string };
    if (!d.idToken || !d.localId) return null;
    return { idToken: d.idToken, uid: d.localId, email: d.email ?? email };
  } catch {
    return null;
  }
}

/**
 * وثيقةٌ واحدة. **و`null` جوابان لا واحد**: غير موجودة، أو منعتها
 * القواعد — وكلاهما هنا سواء: لا نملك قراءتها فلا نبني عليها.
 */
export async function getDocRest(
  path: string,
  idToken?: string,
): Promise<Record<string, unknown> | null> {
  if (!fbProjectId) return null;
  try {
    const r = await fetch(`${DOCS}/${path}?key=${fbApiKey}`, {
      headers: idToken ? { authorization: `Bearer ${idToken}` } : {},
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { fields?: Record<string, RestValue> };
    return decodeFields(d.fields ?? {});
  } catch {
    return null;
  }
}

export type QueryRow = { id: string; data: Record<string, unknown> };

/**
 * سردٌ مرتّب من مجموعةٍ واحدة.
 *
 * ⚠️ **بترتيبٍ واحد بلا شرط `where`** — عمداً: أيّ شرطٍ مع ترتيبٍ على
 *    حقلٍ آخر يستلزم فهرساً مركّباً تُنشئه صاحبة المتجر بيدها من Firebase
 *    Console. والتصفية في الكود على ثلاثين وثيقة أرخص من خطوةٍ تُنسى
 *    فيصمت التنبيه بلا أن يعرف أحدٌ لماذا.
 */
export async function recentDocs(
  collection: string,
  orderBy: string,
  take: number,
  idToken: string,
): Promise<QueryRow[]> {
  if (!fbProjectId) return [];
  try {
    const r = await fetch(`${DOCS}:runQuery?key=${fbApiKey}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collection }],
          orderBy: [{ field: { fieldPath: orderBy }, direction: "DESCENDING" }],
          limit: take,
        },
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!r.ok) return [];
    const rows = (await r.json()) as {
      document?: { name?: string; fields?: Record<string, RestValue> };
    }[];
    return rows
      .filter((x) => x.document?.name)
      .map((x) => ({
        id: String(x.document!.name).split("/").pop() ?? "",
        data: decodeFields(x.document!.fields ?? {}),
      }));
  } catch {
    return [];
  }
}

/**
 * كتابةُ حقلٍ واحد بلا لمس ما حوله (`updateMask`).
 * ⚠️ **حقلٌ واحد لا وثيقة**: لو أرسلنا الوثيقة كاملةً لَمحونا ما تغيّر
 *    فيها بين قراءتنا وكتابتنا — وهي طلباتٌ تتحرّك بينما نحن نقرأ.
 */
export async function patchField(
  path: string,
  field: string,
  value: RestValue,
  idToken: string,
): Promise<boolean> {
  if (!fbProjectId) return false;
  try {
    const r = await fetch(
      `${DOCS}/${path}?key=${fbApiKey}&updateMask.fieldPaths=${field}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ fields: { [field]: value } }),
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      },
    );
    return r.ok;
  } catch {
    return false;
  }
}
