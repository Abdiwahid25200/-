"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { fmt } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { checkPromo, type Promo } from "@/lib/promos";
import { IconCheckCircle, IconSpinner, IconTicket } from "./icons";

export type PromoState = { code: string; off: number; promo: Promo } | null;

/**
 * 🎟️ **«عندك كود خصم؟»** — طلبها (٠٤-٠٨).
 *
 * صفٌّ واحد مطويّ: سطرٌ صغير يُضغط فيفتح حقلاً وزرّاً. **ولا يُفتح
 * افتراضاً**: حقلُ كودٍ فارغ أمام كل زبون يقول له «هناك سعرٌ أقلّ لا
 * تعرفه» — فيخرج يبحث عن كودٍ في جوجل بدل أن يُتمّ طلبه. من معه كودٌ
 * يبحث عن مكانه، ومن ليس معه لا يراه.
 *
 * ⚠️ **والفحص عند الضغط لا مع كل حرف**: كل حرفٍ قراءةٌ من قاعدة
 *    البيانات، وعشرون حرفاً عشرون قراءةً لطلبٍ واحد.
 * ⚠️ **والمبلغ يُمرَّر إلى الفحص** لأن بعض الرموز لها أقلّ مبلغ —
 *    فيُقال له «هذا الرمز لطلبٍ من كذا فأكثر» بدل «رمز خاطئ».
 */
export default function PromoBox({
  amount,
  value,
  onChange,
  hasSale = false,
}: {
  /** المبلغ الذي يُخصم منه — قبل النقاط والضريبة */
  amount: number;
  value: PromoState;
  onChange: (v: PromoState) => void;
  /** في الطلب صنفٌ عليه خصمٌ أصلاً ⇒ الكود لا يجتمع معه إلا بإذنها */
  hasSale?: boolean;
}) {
  const t = useTranslations("promo");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function apply() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setErr(null);
    const r = await checkPromo(text, amount, { uid: user?.uid, hasSale });
    setBusy(false);
    if (!r.ok) return setErr(t(r.why));
    onChange({ code: r.promo.code, off: r.off, promo: r.promo });
    setText("");
  }

  /* ── رمزٌ مطبَّق: سطرٌ أخضر باسمه وقيمته وزرُّ إزالة ── */
  if (value) {
    return (
      <div className="flex items-center gap-2.5 rounded-card border border-success/40 bg-success/5 p-3">
        <IconCheckCircle className="size-5 shrink-0 text-success" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="num block truncate font-bold" dir="ltr">
            {value.code}
          </span>
          <span className="num block text-xs text-success">
            −{fmt(value.off)}
          </span>
        </span>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setOpen(true);
          }}
          className="min-h-11 shrink-0 rounded-card px-3 text-sm font-bold text-muted"
        >
          {t("remove")}
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center gap-2 self-start text-sm font-bold text-orange"
      >
        <IconTicket className="size-4" />
        {t("have")}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setErr(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && void apply()}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          dir="ltr"
          autoCapitalize="characters"
          className="num min-h-12 min-w-0 flex-1 rounded-card border border-line bg-bg px-3 text-start uppercase outline-none focus:border-orange"
        />
        <button
          type="button"
          onClick={() => void apply()}
          disabled={busy || !text.trim()}
          className="flex min-h-12 shrink-0 items-center gap-2 rounded-card border-2 border-orange px-4 font-bold text-orange disabled:opacity-50"
        >
          {busy && <IconSpinner className="size-4" />}
          {t("apply")}
        </button>
      </div>
      {err && <p className="text-xs text-danger">{err}</p>}
    </div>
  );
}
