"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import PackageCard from "./PackageCard";
import PaySection from "./PaySection";
import { fin, fmt } from "@/lib/format";

export type Pack = {
  id: string;
  title: string;
  sub?: string;
  price: number;
  old?: number;
  disc?: number;
};

/**
 * تدفّق الشراء المدمج بأسلوب Midasbuy — كل شيء بصفحة واحدة، بلا درج:
 * ① بيانات الحساب  ②اختيار الباقة  ③ قسم الدفع يظهر تلقائياً  ④ شريط سفلي ثابت
 */
export default function BuyFlow({
  packs,
  accountForm,
  accountReady,
  Icon,
}: {
  packs: Pack[];
  /** بطاقة بيانات الحساب — تختلف بين ببجي و eFootball */
  accountForm: React.ReactNode;
  /** هل اكتملت بيانات الحساب؟ يمنع التأكيد قبلها */
  accountReady: boolean;
  Icon: (p: { className?: string }) => React.ReactElement;
}) {
  const t = useTranslations("buy");
  const tc = useTranslations("common");
  const [packId, setPackId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);

  const pack = packs.find((p) => p.id === packId) ?? null;
  const total = pack ? fin(pack) : 0;
  const canConfirm = !!pack && accountReady;

  return (
    <div className="flex flex-col gap-5 pb-24">
      {accountForm}

      <section>
        <h2 className="mb-3 text-lg font-bold">{t("selectPackage")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {packs.map((p) => (
            <PackageCard
              key={p.id}
              title={p.title}
              sub={p.sub}
              price={p.price}
              old={p.old}
              disc={p.disc}
              selected={p.id === packId}
              onSelect={() => setPackId(p.id)}
              discLabel={tc("discount")}
              Icon={Icon}
            />
          ))}
        </div>
      </section>

      {/* قسم الدفع يظهر تلقائياً بعد اختيار الباقة */}
      {pack && <PaySection amount={total} selected={payId} onSelect={setPayId} />}

      {/* الشريط السفلي الثابت — فوق قائمة التنقّل مباشرة */}
      {pack && (
        <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <div className="leading-tight">
              <div className="text-xs text-muted">{t("total")}</div>
              <div className="text-xl font-bold text-orange" dir="ltr">
                {fmt(total)}
              </div>
            </div>
            <button
              type="button"
              disabled={!canConfirm}
              className="ms-auto min-h-12 rounded-card bg-orange px-7 font-bold text-white transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("confirm")}
            </button>
          </div>
          {!accountReady && (
            <p className="pb-2 text-center text-xs text-muted">
              {t("accountFirst")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
