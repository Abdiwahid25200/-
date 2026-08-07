import { NextResponse } from "next/server";
import { getDocRest, patchField } from "@/lib/fireRest";
import {
  devicesOf,
  encodeDevices,
  pushReady,
  sendToDevices,
} from "@/lib/webpush";
import { isTell, markTold, payloadFor, toldOf, type Tell } from "@/lib/orderPush";

/**
 * 🔔 **إشعارُ الزبون بحالة طلبه** — طلبها (٠٧-٠٨):
 * «بدي العميل إذا نزل التطبيق يحصل على إشعارات طلبه من موبايله».
 *
 * **ولماذا خادمٌ أصلاً**: مفتاح VAPID الخاصّ يوقّع كل دفعة، ولا يجوز
 * أن يصل إلى المتصفّح. فاللوحة تنادي هذا الباب، وهو يوقّع ويرسل.
 *
 * 🔒 **والتصريحُ هو القراءةُ نفسها** — نفسُ نمط `/api/admin-otp`:
 * لا سرَّ جديدٌ يُحفظ ولا بابَ يُفتح. من أرسل `idToken` لا يستطيع به
 * قراءةَ الطلب رُدَّ بـ`401`، وقراءةُ الطلب لا تكون إلا لمن يملك
 * `canDo('orders')` في `firestore.rules`. فالقاعدةُ هي الحارس، لا شرطٌ
 * نكتبه هنا ويُنسى غداً.
 *
 * ⚠️ **وفشلُ الإشعار لا يُفشل الطلب أبداً**: اللوحة تناديه بـ`void`
 *    بلا انتظار، والحالةُ محفوظةٌ في Firestore قبل أن يُنادى.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* النصّ والختم في `lib/orderPush.ts` — تشاركهما الجدولةُ أيضاً */

export async function POST(request: Request) {
  if (!pushReady) return NextResponse.json({ ok: false, reason: "off" });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const orderId = String(body.orderId ?? "").slice(0, 80);
  const status = body.status as Tell;
  const idToken = String(body.idToken ?? "").slice(0, 4000);

  if (!orderId || !idToken || !isTell(status))
    return NextResponse.json({ ok: false }, { status: 400 });

  /* 🔒 الحارس: من لا يقرأ الطلب لا يُرسل عنه شيئاً */
  const order = await getDocRest(`orders/${orderId}`, idToken);
  if (!order) return NextResponse.json({ ok: false }, { status: 401 });

  const uid = String(order.uid ?? "");
  if (!uid) return NextResponse.json({ ok: false, reason: "no-uid" });

  const user = await getDocRest(`users/${uid}`, idToken);

  /* أُشعر بهذه الحالة من قبل — لا يُعاد (ولو ضُغط الزرّ مرّتين) */
  if (toldOf(user, orderId) === status)
    return NextResponse.json({ ok: true, sent: 0, reason: "already" });

  const devices = devicesOf(user?.push);
  /* لم يُفعّل الإشعارات — وهذا هو الحال الغالب، ولا شيء يُقال عنه.
     ويُختم كي لا تقرأه الجدولةُ كل دقيقةٍ إلى الأبد. */
  if (devices.length === 0) {
    await markTold(uid, user, orderId, status, idToken);
    return NextResponse.json({ ok: true, sent: 0, reason: "no-device" });
  }

  const out = await sendToDevices(
    devices,
    payloadFor(
      status,
      String(order.code ?? ""),
      String(user?.lang ?? "en"),
      orderId,
    ),
  );

  /* ⚠️ **ويُختم كي لا تعيده الجدولة**: `/api/late-orders` تمرّ كل دقيقة
     وتلتقط كل طلبٍ لم يُشعر بحالته — فبلا ختمٍ هنا يصل الإشعار مرّتين. */
  if (out.sent > 0) await markTold(uid, user, orderId, status, idToken);

  /* ⚠️ اشتراكٌ ميّت (مُسح التطبيق أو أُفرغت بياناته) يبقى في وثيقته إلى
     الأبد ما لم يُمحَ — فيُنظَّف بتوكن الإدارة نفسه، والقاعدة تسمح لها
     بالكتابة في `users`. */
  if (out.dead.length > 0) {
    const alive = devices.filter((d) => !out.dead.includes(d.endpoint));
    await patchField(`users/${uid}`, "push", encodeDevices(alive), idToken);
  }

  return NextResponse.json({ ok: true, sent: out.sent });
}
