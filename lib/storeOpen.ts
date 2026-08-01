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

export type OpenSettings = {
  /** إغلاق يدويّ — للمعاينة والتحديث */
  closed: boolean;
  /** سطرٌ يشرح سبب الإغلاق (اختياري) */
  closedNote: Partial<Multilang>;
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
