import { NextResponse } from "next/server";
import {
  ADMIN_DOMAIN,
  CODE_TTL_MS,
  DEVICE_TTL_MS,
  toAdminEmail,
} from "@/lib/adminLogin";
import { stampAdmin } from "@/lib/adminStamp";
import { emailReady, looksLikeEmail, sendEmail } from "@/lib/email";
import { getDocRest, lookupToken, signIn } from "@/lib/fireRest";
import { newCode, open, sign, signReady } from "@/lib/signed";

/**
 * 🔒 **رمز التحقّق لدخول لوحة الإدارة** — طلبها (٠٣-٠٨):
 * «بدي رمز تحقق لموقع الإدارة بس بدي الرمز يقف في إيميل».
 *
 * **الترتيب مقصود**: كلمة السرّ تُفحص **هنا في الخادم أوّلاً**، ثم يُرسل
 * الرمز. ولو أرسلناه قبل الفحص لَاستطاع أي عابرٍ أن يغرق بريدها برموزٍ
 * لم تطلبها — ويستنفد المئة المجّانية في دقيقة.
 *
 * **وإلى أين يذهب الرمز؟** إلى بريد صاحبه لا إلى بريدٍ يكتبه من يطلبه:
 *
 * | من يدخل | إلى أين يُرسل |
 * |---|---|
 * | صاحبة المتجر (وثيقة في `admins`) | `OWNER_OTP_EMAIL` من متغيّرات Vercel |
 * | مساعدٌ باسمٍ وكلمة سرّ | حقل `mail` في وثيقته — تكتبه صاحبة المتجر في شاشة Helpers |
 * | مساعدٌ ببريدٍ حقيقيّ (جوجل) | بريدُ دخوله نفسه |
 *
 * ⚠️ **ولأن اسم صاحبة المتجر ليس بريداً حقيقياً** (`…@eramaan.com` حيلةٌ
 *    لتدخل باسمٍ تحفظه) لزم متغيّرٌ يقول: أين تقرأ بريدها فعلاً.
 *
 * 🔒 **وأُقفلت ثغرة المبرمج (٠٧-٠٨)**: كانت هذه البوّابة في الشاشة وحدها،
 *    فمن عرف كلمة السرّ وخاطب Firebase رأساً تخطّاها. والآن **كلُّ بابٍ
 *    يُفتح هنا يُوضع معه خَتْمٌ في البيانات** (`lib/adminStamp.ts`)،
 *    والقواعد لا تقبل أدمناً بلا خَتْمٍ حيّ. فالشاشة والبيانات صارتا
 *    بوّابةً واحدة. واختيرت هذه على مفتاح Service Account: لا مفتاحَ
 *    سيّداً يتجاوز القواعد، ولا شاشةَ إدارةٍ تُعاد كتابتها.
 *
 * ⚠️ **ولذلك يُختم في كل مخرجٍ يفتح الباب** — لا عند الرمز الصحيح وحده.
 *    ولو فتحنا الشاشة بلا ختم لَرأت لوحةً كاملةً ترفض كل حفظ.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ⚠️ الرمز والورقة يعيشان في التوقيع لا في قاعدة بيانات — `lib/signed.ts` */

/* ── حدّ المحاولات ──
   ستّة أرقامٍ مليونُ احتمال، ومن يجرّبها آلياً يصل. الحدّ هنا يجعل ذلك
   مستحيلاً عملياً، والمهلة عشر دقائق تقفل ما بقي. */
const hits = new Map<string, { n: number; until: number }>();
const WINDOW_MS = 10 * 60_000;

function tooMany(key: string, limit: number): boolean {
  const now = Date.now();
  /* تنظيفٌ كسول: الخريطة في ذاكرة الخادم، وبلا مسحٍ تكبر مع الأيام */
  if (hits.size > 500) {
    for (const [k, v] of hits) if (now > v.until) hits.delete(k);
  }
  const rec = hits.get(key);
  if (!rec || now > rec.until) {
    hits.set(key, { n: 1, until: now + WINDOW_MS });
    return false;
  }
  rec.n += 1;
  return rec.n > limit;
}

const ipOf = (r: Request) =>
  r.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

/** `abdi***@gmail.com` — يكفي لتعرف أي بريدٍ تفتح، ولا يكشفه لغيرها */
function mask(email: string): string {
  const [name = "", host = ""] = email.split("@");
  const head = name.slice(0, Math.min(4, Math.max(1, name.length - 1)));
  return `${head}${"*".repeat(3)}@${host}`;
}

const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);

/** ما لا يُشترط فيه رمز: خدمةٌ غير مضبوطة ⇒ الدخول كما كان قبل اليوم */
const skip = () => NextResponse.json({ ok: true, skip: true });

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip = ipOf(request);

  /* ── ② كتابة الرمز ── */
  if (body.step === "verify") {
    if (!signReady) return skip();
    if (tooMany(`v:${ip}`, 8)) {
      return NextResponse.json({ ok: false, reason: "busy" }, { status: 429 });
    }
    const token = clip(body.token, 600);
    const code = clip(body.code, 6).replace(/\D/g, "");
    const data = open<{ x: number; u?: string; o?: number }>(token, code);
    if (!data?.u) return NextResponse.json({ ok: false }, { status: 401 });

    /* ⚠️ **`o` كُتب عند إرسال الرمز لا هنا**: من ثبتت أدمنيّتُه ساعتَها.
       ولو سألنا الآن لَاحتجنا رمزَ دخولٍ لا نملكه في هذه الخطوة. */
    if (data.o) await stampAdmin(data.u);

    return NextResponse.json({
      ok: true,
      ticket: sign({ u: data.u, o: data.o ?? 0 }, DEVICE_TTL_MS),
    });
  }

  /* ── ① الاسم وكلمة السرّ ── */
  if (tooMany(`s:${ip}`, 10)) {
    return NextResponse.json({ ok: false, reason: "busy" }, { status: 429 });
  }

  /**
   * 🔑 **طريقان إلى الهويّة، والباقي واحد** — قرارها (٠٨-٠٨): دخولٌ
   *    بجوجل بلا كلمة سرّ تُنسى.
   *
   *    كلمةُ السرّ تُفحص هنا فيُعرف صاحبُها؛ ودخولُ جوجل يتمّ في
   *    المتصفّح فيصل ومعه توكن — **يُفكّ عند Firebase** فيُعرف صاحبُه.
   *    وما بعد ذلك سواء: الرمزُ والبريدُ والورقةُ والخَتْم.
   *
   * ⚠️ **ولا يُصدَّق معرّفٌ يرسله المتصفّح**: التوكنُ وحده ما لا يُزوَّر.
   */
  const given = clip(body.idToken, 4000);

  const who = given
    ? await lookupToken(given)
    : await (async () => {
        const email = toAdminEmail(clip(body.u, 120));
        const password = clip(body.p, 200);
        if (!email.includes("@") || !password) return null;
        return signIn(email, password);
      })();

  // كلمة سرّ خاطئة أو توكنٌ غير صالح: لا رمز ولا بريد
  if (!who) return NextResponse.json({ ok: false, reason: "bad" }, { status: 401 });

  /* وثيقة `admins` لا يقرأها إلا الأدمن نفسه، فنجاح القراءة **هو** الجواب.
     ⚠️ وقراءتُها لا تشترط الخَتْم عمداً (`isAdminRaw` في القواعد) — ولو
     اشترطته لَما عرفنا إلى أين نرسل الرمز لمن انتهى ختمُه، وهي حالُ كل
     من يطلب الرمز أصلاً. */
  const owner = await getDocRest(`admins/${who.uid}`, who.idToken);

  /**
   * 🔒 **بابٌ يُفتح ⇒ خَتْمٌ يُوضع.** كل مخرجٍ يقول «ادخلي بلا رمز» يمرّ
   *    من هنا، وإلّا فُتحت الشاشة على لوحةٍ ترفض كل حفظ.
   *
   * ⚠️ **ولا يُختم إلا أدمن**: `patchField` تُنشئ الوثيقة إن غابت، فختمُ
   *    غيرِ الأدمن يصنع أدمناً جديداً. والقواعد تمنع الإنشاء كذلك.
   */
  const pass = async () => {
    if (owner) await stampAdmin(who.uid);
    return skip();
  };

  /* ⚠️ **بلا سرٍّ أو بلا بريدٍ مضبوط لا يُقفل الباب** — يُفتح كما كان.
     صاحبة المتجر تضبط متغيّرات Vercel بنفسها، وحرفٌ خاطئ يجب ألّا يحبسها
     خارج متجرها بلا طريق عودة. */
  if (!signReady || !emailReady) return pass();

  /**
   * ⚠️ **الجهاز المعروف يُعرف قبل أن نرسل شيئاً**: ورقةٌ حيّة باسم هذا
   *    الحساب ⇒ لا رمز ولا رسالة. وهذا هو «مرّة كل يوم» عملياً.
   */
  const dev = open<{ x: number; u?: string }>(clip(body.dev, 600));
  if (dev?.u === who.uid) return pass();

  /* ── إلى أين يُرسل؟ ── */
  let to = "";
  if (owner) {
    to = (process.env.OWNER_OTP_EMAIL ?? process.env.ALERT_EMAIL ?? "").trim();
  } else {
    const staff = await getDocRest(`staff/${who.email}`, who.idToken);
    // موقوفٌ أو غير مساعد ⇒ لا رمز: تكمل الشاشةُ فتقول له «لا صلاحية»
    if (staff && staff.active !== false) {
      const mail = String(staff.mail ?? "").trim();
      /**
       * ⚠️ **بريد الدخول ليس صندوقاً**: `sara@eramaan.com` حيلةٌ ليدخل
       *    المساعد باسمٍ يحفظه، ولا أحد يقرأ ما يصله. فالرمز يذهب إلى
       *    بريده المكتوب في شاشة «Helpers»، ومن دخل ببريدٍ حقيقيّ
       *    (جوجل) يذهب إلى بريده هو.
       */
      to = looksLikeEmail(mail)
        ? mail
        : who.email.endsWith(`@${ADMIN_DOMAIN}`)
          ? ""
          : who.email;
    }
  }

  if (!looksLikeEmail(to)) return pass();

  const code = newCode();
  const token = sign({ u: who.uid, o: owner ? 1 : 0 }, CODE_TTL_MS, code);

  const sent = await sendEmail({
    to,
    subject: `Ramaan Admin — your code is ${code}`,
    text: [
      `Your sign-in code is: ${code}`,
      "",
      "It expires in 10 minutes and works once.",
      "If you did not try to sign in, someone knows your password — change it.",
      "",
      `رمز الدخول إلى لوحة الإدارة: ${code}`,
      "ينتهي بعد عشر دقائق. وإن لم تكن أنتِ من حاول الدخول، فأحدهم يعرف كلمة السرّ — غيّريها.",
    ].join("\n"),
  });

  /* ⚠️ **وتعثّرُ البريد لا يقفل الباب**: عطلٌ عند المزوّد أو نفادُ الرصيد
     المجّاني يجب ألّا يمنعها من متجرها. الخسارة في الاتّجاه الآخر أكبر. */
  if (!sent) return pass();

  return NextResponse.json({ ok: true, token, sent: mask(to) });
}
