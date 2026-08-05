"use client";

import { useEffect, useState } from "react";
import { onIdle } from "@/lib/share";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import {
  DEFAULT_POINTS,
  myPoints,
  pointsToUsd,
  readPointsSettings,
  type PointsSettings,
} from "@/lib/points";
import { IconBarwaaqo } from "@/components/icons";

/**
 * شريط برواقو في الرئيسية — **الخيط الذي يشدّه للعودة**.
 *
 * ⚠️ الرقم الناقص هو الرسالة لا الرصيد: «تبقّت ٢٠ نقطة لأوّل خصم»
 *    والشريط ممتلئٌ تقريباً. صغيرٌ يُطمع لا كبيرٌ يُيئس — وشراؤه القادم
 *    يُكمله، وهو يرى ذلك كلّما فتح الرئيسية.
 *
 * ⚠️ ولا يظهر لزائرٍ بلا حساب ولا لمن رصيدُه صفر: شريطٌ فارغ يقول
 *    «ليس لك شيء» — ودعوةُ التسجيل مكانها القائمة لا الرئيسية.
 */
export default function HomeBarwaaqo() {
  const t = useTranslations("points");
  const { user } = useAuth();

  const [pts, setPts] = useState(0);
  const [s, setS] = useState<PointsSettings>(DEFAULT_POINTS);

  useEffect(() => {
    if (!user) return setPts(0);
    /* ⏳ بطاقةٌ تحت البطل — تُقرأ بعد أن يُرسم ما فوقها */
    return onIdle(() => {
      void myPoints(user).then(setPts).catch(() => {});
      void readPointsSettings().then(setS).catch(() => {});
    });
  }, [user]);

  if (!user || !s.on || pts <= 0) return null;

  const short = Math.max(0, s.minRedeem - pts);
  const pct = s.minRedeem > 0 ? Math.min(100, Math.round((pts / s.minRedeem) * 100)) : 100;

  return (
    <Link
      href="/points"
      className="lift flex flex-col gap-2.5 rounded-card border border-line bg-surface p-3.5"
    >
      <span className="flex items-center gap-3">
        <IconBarwaaqo className="size-8 shrink-0 text-orange" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="num block text-lg font-bold">
            {pts} <span className="text-xs font-medium text-muted">{t("unit")}</span>
          </span>
          <span className="block truncate text-xs text-muted">
            {short > 0 ? t("toRedeem", { n: short, min: s.minRedeem }) : t("canRedeem")}
          </span>
        </span>
        <span className="num shrink-0 text-sm font-bold text-yellow" dir="ltr">
          ${pointsToUsd(pts).toFixed(2)}
        </span>
      </span>

      <span aria-hidden className="h-2 overflow-hidden rounded-full bg-surface2">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-yellow/70 to-yellow transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </span>
    </Link>
  );
}
