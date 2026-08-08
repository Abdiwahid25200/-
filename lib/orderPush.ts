import { patchField, type RestValue } from "./fireRest";
import en from "@/messages/en.json";
import so from "@/messages/so.json";

/**
 * 🔔 **نصُّ إشعار الطلب وختمُه** — مشتركٌ بين طريقَين إلى الزبون:
 *
 * | الطريق | متى | يعتمد على |
 * |---|---|---|
 * | `/api/notify-customer` | **فوراً** عند ضغط الزرّ | متصفّح اللوحة |
 * | `/api/late-orders` (الجدولة) | خلال دقيقة | **الخادم وحده** |
 *
 * 🚨 **ولماذا طريقان؟** بلاغها (٠٧-٠٨): رفضت طلباً ولم يصلها شيء —
 *    والسجلّ أثبت أنّ باب الإشعار **لم يُنادَ أصلاً**. فالنداءُ من
 *    المتصفّح هشٌّ بطبعه: تبويبٌ يحمل كوداً قديماً · شبكةٌ تنقطع ·
 *    صفحةٌ تُغلق قبل أن يخرج النداء — وفي كلٍّ منها يصمت الإشعار بلا
 *    أن يدري أحد. والجدولةُ تمرّ كل دقيقة فتلتقط ما سقط.
 */

/** الحالات التي تستحقّ إشعاراً — و`pending` ليست منها: هي البداية */
export const TELL = ["paid", "done", "cancelled"] as const;
export type Tell = (typeof TELL)[number];

export const isTell = (v: unknown): v is Tell =>
  typeof v === "string" && (TELL as readonly string[]).includes(v);

const PACKS: Record<string, Record<string, string>> = {
  en: en.push,
  so: so.push,
};

/** نصُّ الإشعار بلغة الزبون — من `messages/` لا من هذا الملفّ */
export function payloadFor(
  status: Tell,
  code: string,
  lang: string,
  fallbackId: string,
): string {
  const pack = PACKS[lang] ?? PACKS.en;
  return JSON.stringify({
    title: pack.title,
    body: (pack[status] ?? "").replace("{code}", code),
    lang,
    /* وسمُه رمزُ الطلب: «قُبِل» ثم «سُلّم» يحلّ أحدهما محلّ الآخر */
    tag: `order-${code || fallbackId}`,
    url: "/orders",
  });
}

/* ═══════════════════════════════════════════════════════════════
   ختمُ «أُشعر بهذه الحالة» — **في وثيقة الزبون لا في الطلب**
   ═══════════════════════════════════════════════════════════════

   🚨 **ولماذا لا في الطلب؟** القاعدة تقفل الحالة النهائية:

     statusOk() = isAdmin() || !finalState() || settlingOnly()

   وحسابُ المراقبة (`WATCH_USER`) مساعدٌ لا أدمن. فطلبٌ حالتُه `done`
   يقع في `finalState()` ولا يُنقذه `settlingOnly()` (تلك للملغى وحده)
   ⇒ **كلُّ كتابةٍ عليه مرفوضة، ولو كانت حقلاً لا علاقة له بالحالة**.

   ولو خُتم هناك لَرُفض الختم على كل طلبٍ سُلّم، فأعادت الجدولةُ إشعار
   «تم التسليم» **كل دقيقة إلى الأبد**. (وهذا ما كشفه فحصُ القواعد قبل
   الرفع لا بعده.)

   ووثيقةُ الزبون تقبل كتابة الإدارة والمساعد بلا شرط:
     allow create, update: if canDo('customers') || canDo('orders') || …
   فالختمُ فيها يعمل للحالات الثلاث معاً.

   ⚠️ **ويُختم بعد الإرسال لا قبله** — ولو خُتم أوّلاً وتعثّر الإرسال
      لَصمت الطريقان معاً عن هذا الطلب إلى الأبد. */

/** آخرُ ما أُشعر به عن هذا الطلب — فراغٌ يعني «لم يُشعر بعد» */
export function toldOf(
  user: Record<string, unknown> | null | undefined,
  orderId: string,
): string {
  const m = user?.told;
  if (!m || typeof m !== "object") return "";
  return String((m as Record<string, unknown>)[orderId] ?? "");
}

/** ⚠️ لا تنتفخ الوثيقة: آخرُ عشرين طلباً تكفي، والأقدم لن يُشعر ثانيةً */
const KEEP = 20;

export async function markTold(
  uid: string,
  user: Record<string, unknown> | null | undefined,
  orderId: string,
  status: string,
  token: string,
): Promise<Record<string, string>> {
  const prev =
    user?.told && typeof user.told === "object"
      ? (user.told as Record<string, unknown>)
      : {};

  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(prev)) merged[k] = String(v);
  merged[orderId] = status;

  const keys = Object.keys(merged);
  const kept =
    keys.length > KEEP
      ? Object.fromEntries(keys.slice(-KEEP).map((k) => [k, merged[k]]))
      : merged;

  const fields: Record<string, RestValue> = {};
  for (const [k, v] of Object.entries(kept)) fields[k] = { stringValue: v };

  await patchField(`users/${uid}`, "told", { mapValue: { fields } }, token);
  /* تُعاد الخريطة كي يتابع النداءُ التالي على ما كُتب فعلاً */
  return kept;
}
