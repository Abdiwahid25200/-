import { NextResponse } from "next/server";
import { getDocRest, patchField } from "@/lib/fireRest";
import {
  devicesOf,
  encodeDevices,
  pushReady,
  sendToDevices,
} from "@/lib/webpush";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import so from "@/messages/so.json";

/**
 * 🧪 **«جرّبي الإشعار»** — بلاغها (٠٧-٠٨): «فعّلتُ الإشعارات ورفضتُ
 * طلباً ولم يصلني شيء».
 *
 * **ولماذا بابٌ للاختبار أصلاً**: سلسلةُ الإشعار خمسُ حلقات — إذنُ
 * المتصفّح · اشتراكٌ في الجهاز · حفظُه في وثيقة الزبون · إرسالٌ من
 * الخادم · عرضٌ في عامل الخدمة. وحين لا يصل شيء **لا يُعرف أيُّ حلقةٍ
 * انقطعت**، فيبقى العطل تخميناً. وهذا الباب يقطع السلسلة نفسها
 * بضغطةٍ واحدة من الجهاز، ويقول أين وقفت بالحرف.
 *
 * 🔒 **والتصريحُ هو القراءةُ نفسها**: يُقرأ `users/{uid}` بتوكن صاحبه.
 *    والقاعدة لا تسمح لأحدٍ بقراءة وثيقة غيره (إلا الإدارة) — فمن
 *    أرسل معرّفاً ليس معرّفَه رُدَّ بـ`401`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PACKS: Record<string, Record<string, string>> = {
  en: en.push,
  ar: ar.push,
  so: so.push,
};

export async function POST(request: Request) {
  if (!pushReady) return NextResponse.json({ ok: false, reason: "off" });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad" }, { status: 400 });
  }

  const uid = String(body.uid ?? "").slice(0, 128);
  const idToken = String(body.idToken ?? "").slice(0, 4000);
  const lang = String(body.lang ?? "en");
  if (!uid || !idToken)
    return NextResponse.json({ ok: false, reason: "bad" }, { status: 400 });

  const user = await getDocRest(`users/${uid}`, idToken);
  /* لا وثيقة أو لا صلاحية — والاثنان يعنيان أنّ الحفظ لم يقع أصلاً */
  if (!user)
    return NextResponse.json({ ok: false, reason: "no-doc" }, { status: 401 });

  const devices = devicesOf(user.push);
  /**
   * ⚠️ **وهذه هي الحلقة التي كانت تنقطع بصمت**: المتصفّح يشترك بنجاح
   *    فتقول البطاقة «مفعّلة»، والحفظُ في Firestore يفشل — فلا جهازَ
   *    عند الخادم يُرسل إليه. وكان الباب يردّ `{sent: 0}` ولا يخبر أحداً.
   */
  if (devices.length === 0)
    return NextResponse.json({ ok: false, reason: "no-device" });

  const pack = PACKS[lang] ?? PACKS.en;
  const out = await sendToDevices(
    devices,
    JSON.stringify({
      title: pack.title,
      body: pack.testBody,
      lang,
      tag: "ramaan-test",
      url: "/orders",
    }),
  );

  if (out.dead.length > 0) {
    const alive = devices.filter((d) => !out.dead.includes(d.endpoint));
    await patchField(`users/${uid}`, "push", encodeDevices(alive), idToken);
  }

  if (out.sent === 0)
    return NextResponse.json({
      ok: false,
      reason: out.dead.length > 0 ? "expired" : (out.error ?? "send"),
    });

  return NextResponse.json({ ok: true, sent: out.sent });
}
