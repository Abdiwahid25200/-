"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import {
  DEFAULT_POINTS,
  myPoints,
  pointsToUsd,
  readPointsSettings,
  usdToPoints,
  type PointsSettings,
} from "@/lib/points";

/**
 * استعمال النقاط خصماً — مشتركٌ بين السلة وتدفّق الألعاب.
 *
 * ⚠️ **الخصم لا يُخصم من الرصيد هنا.** الزبون لا يملك تعديل رصيده
 *    أصلاً (القواعد تمنعه). ما يحدث: يُحفظ مع الطلب كم نقطةً طلب
 *    استعمالها، ثم **تُخصم فعلاً عند تأكيدك الدفع** في اللوحة —
 *    كما تُمنح نقاط الشراء في اللحظة نفسها وبالمعاملة نفسها.
 *
 *    ولهذا لو أرسل زبونٌ طلبين بنفس الرصيد، يأخذ الخصم مرّة واحدة:
 *    التأكيد الثاني لا يجد رصيداً فيخصم ما بقي لا أكثر.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

export type Redeem = {
  balance: number;
  settings: PointsSettings;
  /** يملك رصيداً كافياً ليستعمله */
  eligible: boolean;
  on: boolean;
  setOn: (v: boolean) => void;
  /** كم نقطة ستُستعمل فعلاً */
  spend: number;
  /** قيمة الخصم بالدولار */
  discount: number;
  /** المبلغ بعد الخصم */
  payable: number;
};

export function usePointsRedeem(total: number): Redeem {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [settings, setSettings] = useState<PointsSettings>(DEFAULT_POINTS);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!user) {
      setBalance(0);
      setOn(false);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const [s, p] = await Promise.all([readPointsSettings(), myPoints(user)]);
        if (!alive) return;
        setSettings(s);
        setBalance(p);
      } catch {
        // بلا Firebase أو مع انقطاع: لا خصم، ولا رسالة خطأ تربك الزبون
        if (alive) setBalance(0);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const eligible =
    settings.on && balance > 0 && balance >= settings.minRedeem && total > 0;

  const spend = on && eligible ? Math.min(balance, usdToPoints(total)) : 0;
  const discount = Math.min(pointsToUsd(spend), total);
  const payable = Math.max(0, round2(total - discount));

  return { balance, settings, eligible, on, setOn, spend, discount, payable };
}

/** صفّ الخصم — يظهر فقط لمن يملك رصيداً كافياً */
export default function PointsRedeem({ r }: { r: Redeem }) {
  const t = useTranslations("points");
  if (!r.eligible) return null;

  return (
    <label className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
      <input
        type="checkbox"
        checked={r.on}
        onChange={(e) => r.setOn(e.target.checked)}
        className="size-5 shrink-0 accent-orange"
      />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block font-bold">{t("useTitle")}</span>
        <span className="block text-sm text-muted">
          {t("balanceIs", {
            n: r.balance,
            usd: `$${pointsToUsd(r.balance).toFixed(2)}`,
          })}
        </span>
      </span>
      {r.discount > 0 && (
        <span className="num shrink-0 font-bold text-orange" dir="ltr">
          −${r.discount.toFixed(2)}
        </span>
      )}
    </label>
  );
}
