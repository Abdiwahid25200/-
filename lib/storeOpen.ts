"use client";

/**
 * هل المتجر مفتوح الآن؟ — إغلاقٌ يدويّ أو خارج ساعات العمل.
 *
 * ⚠️ **الوقت يُحسب بتوقيت متجرك لا بتوقيت جهاز الزبون.**
 *    زبونٌ في لندن ساعتُه غير ساعتك؛ لو حسبنا بجهازه لفُتح المتجر
 *    وأُغلق في أوقاتٍ لا تعرفينها. فنأخذ التوقيت العالمي ونضيف إليه
 *    فارق بلدك (٣+ افتراضاً) — فالنتيجة واحدة لكل زبائن الأرض.
 *
 * ⚠️ ولا يُخفى المتجر: الزبون يتصفّح ويرى الأسعار، ويُمنع **الطلب**
 *    وحده. متجرٌ مقفلٌ بالكامل يخسر زائراً كان سيعود صباحاً.
 */

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { fbDb } from "./firebase";
import type { Multilang } from "./content";

/**
 * شكل صفحة الإغلاق — ثلاثة، تختار صاحبة المتجر واحداً:
 *
 * | | |
 * |---|---|
 * | `curtain` | ستارةٌ بلون العلامة وعدّادٌ تنازليّ — تحجب المتجر |
 * | `sign` | لافتةٌ ورقية على بابٍ زجاجيّ — مألوفةٌ تُفهم بلا قراءة |
 * | `queue` | المتجر يصير طابوراً: **يحجز** ويُنفَّذ أوّل ما تفتحين |
 *
 * ⚠️ و`queue` وحده **لا يمنع الطلب** — يحوّله إلى حجز. فلا تضيع طلبات
 *    الليل، وتفتحين صباحاً على طابورٍ جاهز لا على صفر.
 */
export type ClosedStyle = "curtain" | "sign" | "queue";

export type OpenSettings = {
  /** إغلاق يدويّ — للمعاينة والتحديث */
  closed: boolean;
  /** سطرٌ يشرح سبب الإغلاق (اختياري) */
  closedNote: Partial<Multilang>;
  /** شكل الصفحة التي يراها الزبون */
  style: ClosedStyle;
  /** عنوانٌ يكتبه صاحب المتجر — فارغٌ ⇒ نصّ الترجمة */
  closedTitle: Partial<Multilang>;
  /** وعنوانُ ونصُّ «انتهى الدوام» */
  hoursTitle: Partial<Multilang>;
  hoursNote: Partial<Multilang>;
  /** الشعار أو الصورة في وسط الصفحة — فارغةٌ ⇒ شعار المتجر */
  closedImage: string;
  /** رقم واتساب من نفس الوثيقة — فزرّ التواصل يعمل في صفحة الإغلاق */
  whatsapp: string;
  /** تطبيق ساعات العمل */
  hoursOn: boolean;
  /** `09:00` · `23:00` */
  openFrom: string;
  openTo: string;
  /** أيام العطلة: ٠ الأحد … ٦ السبت. الافتراضي: الجمعة */
  offDays: number[];
  /** فارق توقيت بلدك عن غرينتش */
  tzOffset: number;
};

export const DEFAULT_OPEN: OpenSettings = {
  closed: false,
  closedNote: {},
  style: "curtain",
  closedTitle: {},
  hoursTitle: {},
  hoursNote: {},
  closedImage: "",
  whatsapp: "",
  hoursOn: false,
  openFrom: "09:00",
  openTo: "23:00",
  offDays: [5],
  tzOffset: 3,
};

export type OpenState = {
  open: boolean;
  /** `closed` مُقفل بيدك · `day` يوم عطلة · `hours` خارج الدوام */
  reason: "closed" | "day" | "hours" | null;
  settings: OpenSettings;
};

const mins = (t: string) => {
  const [h, m] = (t || "0:0").split(":").map((x) => Number(x) || 0);
  return h * 60 + m;
};

/** يُحسب من الإعدادات وحدها — بلا شبكة، فيصلح للاختبار والعرض معاً */
export function openNow(s: OpenSettings, at = Date.now()): OpenState {
  if (s.closed) return { open: false, reason: "closed", settings: s };
  if (!s.hoursOn) return { open: true, reason: null, settings: s };

  const local = new Date(at + s.tzOffset * 3_600_000);
  if (s.offDays.includes(local.getUTCDay()))
    return { open: false, reason: "day", settings: s };

  const now = local.getUTCHours() * 60 + local.getUTCMinutes();
  const from = mins(s.openFrom);
  const to = mins(s.openTo);
  // دوامٌ يعبر منتصف الليل (٩م – ٢ص) يُحسب على شقّين
  const inside = from <= to ? now >= from && now < to : now >= from || now < to;

  return inside
    ? { open: true, reason: null, settings: s }
    : { open: false, reason: "hours", settings: s };
}

export async function readOpenSettings(): Promise<OpenSettings> {
  const db = fbDb();
  if (!db) return DEFAULT_OPEN;
  try {
    const snap = await getDoc(doc(db, "settings", "store"));
    const v = (snap.exists() ? snap.data() : {}) as Partial<OpenSettings>;
    return {
      closed: v.closed === true,
      closedNote: v.closedNote ?? {},
      style:
        v.style === "sign" || v.style === "queue" || v.style === "curtain"
          ? v.style
          : DEFAULT_OPEN.style,
      closedTitle: v.closedTitle ?? {},
      hoursTitle: v.hoursTitle ?? {},
      hoursNote: v.hoursNote ?? {},
      closedImage: (v.closedImage ?? "").trim(),
      whatsapp: (v.whatsapp ?? "").replace(/\D/g, ""),
      hoursOn: v.hoursOn === true,
      openFrom: v.openFrom || DEFAULT_OPEN.openFrom,
      openTo: v.openTo || DEFAULT_OPEN.openTo,
      offDays: Array.isArray(v.offDays) ? v.offDays : DEFAULT_OPEN.offDays,
      tzOffset: Number.isFinite(Number(v.tzOffset))
        ? Number(v.tzOffset)
        : DEFAULT_OPEN.tzOffset,
    };
  } catch {
    // تعذّرت القراءة ⇒ **المتجر مفتوح**: خطأٌ في الشبكة يجب ألّا يقفل متجراً
    return DEFAULT_OPEN;
  }
}

/**
 * هل يستطيع الزبون إرسال طلبٍ الآن؟
 *
 * مفتوح ⇒ نعم. مغلقٌ بنمط **الطابور** ⇒ نعم، لكنه **حجز** يُنفَّذ عند
 * الفتح. وما عدا ذلك ⇒ لا.
 */
export const canOrderNow = (st: OpenState) =>
  st.open || st.settings.style === "queue";

/** هذا الطلب حجزٌ لا طلبٌ فوريّ؟ */
export const isReservation = (st: OpenState) =>
  !st.open && st.settings.style === "queue";

/** متى نفتح؟ نصٌّ قصير: «09:00» — أو غداً إن كان اليوم عطلة */
export function opensAt(s: OpenSettings): string {
  return s.openFrom || "09:00";
}

/** كم بقي على الفتح — بالدقائق. صفرٌ إن كان الحساب غير ممكن */
export function minutesToOpen(s: OpenSettings, at = Date.now()): number {
  if (!s.hoursOn) return 0;
  const local = new Date(at + s.tzOffset * 3_600_000);
  const now = local.getUTCHours() * 60 + local.getUTCMinutes();
  const from = mins(s.openFrom);
  const left = from - now;
  return left > 0 ? left : left + 24 * 60;
}

/** الحالة الحيّة — تُراجَع كل دقيقة فينقلب الحال عند رأس الساعة */
export function useStoreOpen(): OpenState {
  const [s, setS] = useState<OpenSettings>(DEFAULT_OPEN);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    void readOpenSettings().then((v) => alive && setS(v));
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return openNow(s, Date.now() + tick * 0);
}
