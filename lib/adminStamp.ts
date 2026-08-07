import { STAMP_MS } from "./adminLogin";
import { patchField, signIn } from "./fireRest";

/**
 * 🔒 **خَتْمُ الأدمن** — الحقل `otpUntil` في `admins/{uid}`.
 *
 * القواعد لا تعرف «هل مرّ بشاشة الرمز»، وهذا ما جعل من عرف كلمة السرّ
 * وكان مبرمجاً يخاطب Firebase رأساً فيتخطّى الشاشة كلّها. فصارت تسأل عن
 * **أثرٍ في البيانات** لا عن نيّةٍ في المتصفّح: تاريخٌ في المستقبل.
 *
 * ⚠️ **ولا يكتبه الأدمن نفسه** — ولو استطاع لَختم لنفسه وعاد الباب
 *    مفتوحاً. يكتبه **حسابُ البوّاب** وحده (`GATE_USER`)، والقواعد تسمح
 *    له بحقلٍ واحد لا غير، ولا تسمح له بإنشاء وثيقةٍ ولا حذفها.
 *
 * 🔒 **وبابٌ لكل مفتاح** (قرارها ٠٧-٠٨): حسابٌ مستقلٌّ لا `WATCH_USER`،
 *    فلو تسرّب أحدهما لم يفتح الآخر. وكلمتُه في Vercel وحدها — لم تُطبع
 *    ولم تُكتب في مستودعٍ ولا وثيقة.
 *
 * ⚠️ **وحتى من سرق كلمة البوّاب لا يدخل**: الخَتْم لا يمنح صلاحية، بل
 *    يرفع مانعاً. ويبقى عليه أن يعرف كلمة سرّ الأدمن — طبقتان لا واحدة.
 */

const GATE_USER = (process.env.GATE_USER ?? "").trim();
const GATE_PASSWORD = process.env.GATE_PASSWORD ?? "";

/** بلا الحسابين لا يُختم شيء — ويُقال ذلك في السجلّ لا بالصمت */
export const stampReady = Boolean(GATE_USER && GATE_PASSWORD);

/**
 * رمز البوّاب يعيش ساعةً عند جوجل. ونحفظه خمسين دقيقة فلا ندفع دخولاً
 * كاملاً عند كل تجديدٍ صامت — والدالّة تُنادى كل عشرين دقيقة لكل لوحة.
 */
let cached: { token: string; until: number } | null = null;

async function gateToken(): Promise<string> {
  if (cached && Date.now() < cached.until) return cached.token;
  const who = await signIn(GATE_USER, GATE_PASSWORD);
  if (!who) {
    cached = null;
    return "";
  }
  cached = { token: who.idToken, until: Date.now() + 50 * 60_000 };
  return who.idToken;
}

/**
 * يمدّ خَتْم هذا الأدمن ساعةً من الآن.
 *
 * ⚠️ **ولا يُنادى إلا لمن ثبت أنه أدمن**: `patchField` تُنشئ الوثيقة إن
 *    غابت، فختمُ معرّفٍ غريب يعني **صناعة أدمن جديد**. والقواعد تمنع
 *    الإنشاء أيضاً (`allow create: if false`) — حارسان لا واحد.
 */
export async function stampAdmin(uid: string): Promise<boolean> {
  if (!stampReady || !uid) return false;
  const token = await gateToken();
  if (!token) return false;

  const ok = await patchField(
    `admins/${uid}`,
    "otpUntil",
    { timestampValue: new Date(Date.now() + STAMP_MS).toISOString() },
    token,
  );
  /* رمزٌ منتهٍ قبل أوانه؟ يُنسى ويُعاد الدخول في النداء التالي */
  if (!ok) cached = null;
  return ok;
}
