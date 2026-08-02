"use client";

/**
 * تنزيل الجداول لإكسل — من اللوحة إلى ملفٍ على جهازها.
 *
 * ⚠️ **الأرقام تُقرأ في اللوحة، والحسابُ يُعمل في إكسل.** كانت كل قراءةٍ
 *    تنتهي بتصوير الشاشة ونقل الأرقام بيدها. الملف يُفتح في إكسل أو
 *    Numbers فتجمع وتفرز وتُرسل لمحاسبٍ إن شاءت.
 *
 * ⚠️ **وBOM في أوّل الملف لازم**: بدونه يقرأ إكسل الأسماء العربية
 *    والصومالية طلاسمَ (Ø§Ù„Ø±). حرفٌ واحد في البداية يحلّ ذلك.
 */

export type Cell = string | number | null | undefined;

/**
 * 🔒 خليّة تبدأ بـ`=` أو `@` **معادلةٌ في إكسل لا نصّ**.
 *
 * واسم الزبون يأتي من حساب جوجل الذي يكتبه بيده: من سمّى نفسه
 * `=HYPERLINK("http://…","اضغط")` صار في ملفكِ رابطاً يعمل حين تفتحينه.
 * فتُسبَق هذه البداياتُ بفاصلة عليا تُبقيها كلاماً.
 *
 * ⚠️ والرقمُ يمرّ كما هو: `-1.50` سالبٌ لا هجوم، ولو سُبق لصار نصّاً
 *    لا يُجمَع في عمود.
 */
const RISKY = /^[=@\t\r]/;
const NUMLIKE = /^[+-]?\d+(\.\d+)?$/;

/** خليّة آمنة: كل شيء بين علامتَي اقتباس، والاقتباس بداخله يُضاعَف */
function cell(v: Cell): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (typeof v === "string" && RISKY.test(s) && !NUMLIKE.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** جدول نصّي بصيغة CSV — صفّ العناوين ثم الصفوف */
export function toCsv(headers: string[], rows: Cell[][]): string {
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

/** تاريخٌ للجدول — إكسل يفهم `2026-08-02 14:30` بلا لبس بين الشهر واليوم */
export function csvDate(d: Date | null | undefined): string {
  if (!d) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * حفظ الملف على جهازها.
 *
 * ⚠️ الرابط يُصنع ويُضغط ثم يُتلف: بلا `revokeObjectURL` يبقى الملف في
 *    ذاكرة المتصفّح حتى تُغلق الصفحة، وتنزيلاتٌ متتابعة تُثقلها.
 */
export function downloadCsv(name: string, headers: string[], rows: Cell[][]): void {
  if (typeof window === "undefined") return;

  const blob = new Blob(["﻿" + toCsv(headers, rows)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".csv") ? name : `${name}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** اسم ملفٍ يقول ما فيه ومتى: `ramaan-orders-2026-08-02.csv` */
export function csvName(what: string, from = "", to = ""): string {
  const span = from && to ? (from === to ? from : `${from}_${to}`) : from || to || "all";
  return `ramaan-${what}-${span}`;
}
