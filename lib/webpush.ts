import webpush from "web-push";
import type { RestValue } from "./fireRest";

/**
 * 📤 **إرسال الدفعات** — مشتركٌ بين بابَين: `notify-customer` (تُنادَى
 * من اللوحة عند تغيير الحالة) و`push-test` (يُنادَى من جوّال الزبون).
 *
 * ⚠️ **ونسخةٌ واحدة لا نسختان**: بابان يوقّعان ويرسلان بكودَين مختلفَين
 *    يعني أنّ اختبار أحدهما لا يثبت شيئاً عن الآخر — وهو بالضبط ما
 *    نحتاجه هنا: أن يكون نجاحُ الاختبار دليلاً على أنّ الإشعار الحقيقيّ
 *    يعمل.
 */

const PUB = (process.env.NEXT_PUBLIC_VAPID_KEY ?? "").trim();
const PRIV = (process.env.VAPID_PRIVATE ?? "").trim();
const SUBJ = (process.env.VAPID_SUBJECT ?? "mailto:support@eramaan.com").trim();

export const pushReady = Boolean(PUB && PRIV);
if (pushReady) webpush.setVapidDetails(SUBJ, PUB, PRIV);

export type Device = { endpoint: string; p256dh: string; auth: string };

/** ما قرأناه من Firestore قد يكون أيّ شيء — يُقبل الكامل وحده */
export function devicesOf(raw: unknown): Device[] {
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
export const encodeDevices = (list: Device[]): RestValue => ({
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

export type SendResult = {
  /** كم جهازاً قبِل الدفعة فعلاً */
  sent: number;
  /** اشتراكاتٌ ماتت (مُسح التطبيق أو أُفرغت بياناته) — تُنظَّف */
  dead: string[];
  /** أوّلُ خطأٍ غير «ميّت» — يُقال للزبون بدل صمتٍ لا يُفسَّر */
  error?: string;
};

export async function sendToDevices(
  devices: Device[],
  payload: string,
): Promise<SendResult> {
  const dead: string[] = [];
  let sent = 0;
  let error: string | undefined;

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
        const code = (e as { statusCode?: number })?.statusCode;
        /* ⚠️ `404`/`410` = اشتراكٌ ميّت لا عطلٌ عندنا */
        if (code === 404 || code === 410) dead.push(d.endpoint);
        else if (!error) error = `${code ?? "?"}`;
      }
    }),
  );

  return { sent, dead, error };
}
