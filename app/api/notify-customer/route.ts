import { NextResponse } from "next/server";
import webpush from "web-push";
import { getDocRest, patchField, type RestValue } from "@/lib/fireRest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import so from "@/messages/so.json";

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

const PUB = (process.env.NEXT_PUBLIC_VAPID_KEY ?? "").trim();
const PRIV = (process.env.VAPID_PRIVATE ?? "").trim();
const SUBJ = (process.env.VAPID_SUBJECT ?? "mailto:support@eramaan.com").trim();

const ready = Boolean(PUB && PRIV);
if (ready) webpush.setVapidDetails(SUBJ, PUB, PRIV);

/** الحالات التي تستحقّ إشعاراً — و`pending` ليست منها: هي البداية */
const SAY = ["paid", "done", "cancelled"] as const;
type Say = (typeof SAY)[number];

/** نصُّ الإشعار بلغة الزبون — من `messages/` لا من هذا الملفّ */
const PACKS: Record<string, { title: string } & Record<Say, string>> = {
  en: en.push,
  ar: ar.push,
  so: so.push,
};

type Device = { endpoint: string; p256dh: string; auth: string };

/** ما قرأناه من Firestore قد يكون أيّ شيء — يُقبل الكامل وحده */
function devicesOf(raw: unknown): Device[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d) => d as Record<string, unknown>)
    .map((d) => ({
      endpoint: String(d?.endpoint ?? ""),
      p256dh: String(d?.p256dh ?? ""),
      auth: String(d?.auth ?? ""),
    }))
    .filter((d) => d.endpoint && d.p256dh && d.auth);
}

/** مصفوفةٌ بصيغة Firestore REST — لإعادة كتابة ما بقي بعد التنظيف */
const encode = (list: Device[]): RestValue => ({
  arrayValue: {
    values: list.map((d) => ({
      mapValue: {
        fields: {
          endpoint: { stringValue: d.endpoint },
          p256dh: { stringValue: d.p256dh },
          auth: { stringValue: d.auth },
        },
      },
    })),
  },
});

export async function POST(request: Request) {
  if (!ready) return NextResponse.json({ ok: false, reason: "off" });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const orderId = String(body.orderId ?? "").slice(0, 80);
  const status = String(body.status ?? "") as Say;
  const idToken = String(body.idToken ?? "").slice(0, 4000);

  if (!orderId || !idToken || !SAY.includes(status))
    return NextResponse.json({ ok: false }, { status: 400 });

  /* 🔒 الحارس: من لا يقرأ الطلب لا يُرسل عنه شيئاً */
  const order = await getDocRest(`orders/${orderId}`, idToken);
  if (!order) return NextResponse.json({ ok: false }, { status: 401 });

  const uid = String(order.uid ?? "");
  if (!uid) return NextResponse.json({ ok: false, reason: "no-uid" });

  const user = await getDocRest(`users/${uid}`, idToken);
  const devices = devicesOf(user?.push);
  /* لم يُفعّل الإشعارات — وهذا هو الحال الغالب، ولا شيء يُقال عنه */
  if (devices.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const lang = String(user?.lang ?? "en");
  const pack = PACKS[lang] ?? PACKS.en;
  const code = String(order.code ?? "");

  const payload = JSON.stringify({
    title: pack.title,
    body: pack[status].replace("{code}", code),
    lang,
    /* وسمُه رمزُ الطلب: «قُبِل» ثم «سُلّم» يحلّ أحدهما محلّ الآخر */
    tag: `order-${code || orderId}`,
    url: "/orders",
  });

  const dead: string[] = [];
  let sent = 0;

  await Promise.all(
    devices.map(async (d) => {
      try {
        await webpush.sendNotification(
          { endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } },
          payload,
          /* يوم واحد: إشعارُ طلبٍ بعد ثلاثة أيام خبرٌ قديم يُربك */
          { TTL: 86400 },
        );
        sent += 1;
      } catch (e) {
        /* ⚠️ `404`/`410` = اشتراكٌ ميّت: مسح التطبيق أو أفرغ بياناته.
           ويبقى في وثيقته إلى الأبد ما لم يُمحَ — فيُجمَع ويُنظَّف. */
        const code2 = (e as { statusCode?: number })?.statusCode;
        if (code2 === 404 || code2 === 410) dead.push(d.endpoint);
      }
    }),
  );

  if (dead.length > 0) {
    const alive = devices.filter((d) => !dead.includes(d.endpoint));
    /* بتوكن الإدارة نفسه — والقاعدة تسمح لها بالكتابة في `users` */
    await patchField(`users/${uid}`, "push", encode(alive), idToken);
  }

  return NextResponse.json({ ok: true, sent });
}
