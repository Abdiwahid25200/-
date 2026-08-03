/**
 * أوراقٌ موقّعة — يصنعها الخادم ويتحقّق منها، ولا يستطيع المتصفّح تزويرها.
 *
 * 🔑 **الفكرة**: لا نحفظ رمز التحقّق في قاعدة بيانات. الخادم يصنع رمزاً
 *    من ستّة أرقام، يرسله بالبريد، ويعطي المتصفّح **ورقةً موقّعة لا
 *    الرمز**. وحين تُكتب الأرقام يعيد الخادم حساب التوقيع بها: طابق ⇒
 *    الرمز صحيح، وإلّا فلا.
 *
 * ⚠️ **والرمز ليس داخل الورقة** — وهذا بيت القصيد: الورقة تمرّ بالمتصفّح
 *    وتُقرأ بأدوات المطوّر. لو كُتب الرمز فيها لَقرأه من فتحها وتخطّى
 *    بريدَه كلّه. التوقيع وحده هو ما يحمل الرمز، والتوقيع لا يُعكَس.
 *
 * ⚠️ **ولا مقارنة نصّيّة عادية**: `timingSafeEqual` — المقارنة العادية
 *    تتوقّف عند أوّل حرفٍ مختلف، وفارق الزمن بين محاولةٍ وأخرى يكشف
 *    التوقيع حرفاً حرفاً لمن يقيس.
 *
 * 🔒 **السرّ في Vercel**: `ADMIN_AUTH_SECRET` — أيّ نصٍّ عشوائيّ طويل.
 *    وبدونه لا توقيع أصلاً، فيبقى الدخول كما هو اليوم بلا رمز (`ready`).
 */

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const SECRET = (process.env.ADMIN_AUTH_SECRET ?? "").trim();

/** سرٌّ قصير سرٌّ مكسور — عشرون حرفاً حدٌّ أدنى معقول */
export const signReady = SECRET.length >= 20;

const b64 = (v: string) => Buffer.from(v, "utf8").toString("base64url");
const unb64 = (v: string) => Buffer.from(v, "base64url").toString("utf8");

const mac = (data: string) =>
  createHmac("sha256", SECRET).update(data).digest("base64url");

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** رمزٌ من ستّة أرقام — `randomInt` لا `Math.random`: هذا رمزُ دخول */
export const newCode = (): string => String(randomInt(0, 1_000_000)).padStart(6, "0");

type Payload = Record<string, unknown> & { x: number };

/**
 * ورقةٌ موقّعة تنتهي بعد `ttlMs`.
 * و`extra` سرٌّ يدخل في التوقيع ولا يُكتب في الورقة — هو رمز التحقّق.
 */
export function sign(data: Record<string, unknown>, ttlMs: number, extra = ""): string {
  if (!signReady) return "";
  const body = b64(JSON.stringify({ ...data, x: Date.now() + ttlMs }));
  return `${body}.${mac(body + "|" + extra)}`;
}

/**
 * فتحُ ورقةٍ والتحقّق منها. `null` تعني: مزوّرةٌ أو منتهية أو بسرٍّ مختلف.
 * ولا تُفرَّق هذه الأحوال في الجواب — من يجرّب لا يُعان.
 */
export function open<T extends Payload = Payload>(token: string, extra = ""): T | null {
  if (!signReady || !token) return null;
  const [body, tag] = String(token).split(".");
  if (!body || !tag) return null;
  if (!same(tag, mac(body + "|" + extra))) return null;
  try {
    const data = JSON.parse(unb64(body)) as T;
    if (!data || typeof data.x !== "number" || Date.now() > data.x) return null;
    return data;
  } catch {
    return null;
  }
}
