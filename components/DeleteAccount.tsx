"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { myPoints } from "@/lib/points";
import { deleteMyAccount } from "@/lib/deleteAccount";
import { IconTrash } from "@/components/icons";

/**
 * حذف الحساب — **شرطُ نشرٍ في متاجر التطبيقات لا زينة**.
 *
 * 🔒 Google Play تشترط منذ ٢٠٢٣ سبيلاً **داخل التطبيق** يمحو الحساب،
 *    وبدونه يُرفض مهما كان سليماً.
 *
 * ⚠️ **ولا يُحذف من أوّل ضغطة.** ثلاث خطوات مقصودة: زرٌّ باهت ⇒ ما
 *    سيُمحى وما سيبقى **بالأرقام** ⇒ ثم تأكيد. لأن هذا الفعل بلا رجعة،
 *    ورصيدُ نقاطه يذهب معه — ولا يُكتشف ذلك بعد شهر.
 */
export default function DeleteAccount() {
  const { user, signOut } = useAuth();
  const t = useTranslations("deleteAccount");

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pts, setPts] = useState(0);

  /* الرصيد يُقرأ عند فتح السؤال وحده — لا في كل زيارةٍ لصفحة الحساب */
  useEffect(() => {
    if (!open || !user) return;
    void myPoints(user).then(setPts).catch(() => {});
  }, [open, user]);

  if (!user) return null;

  async function remove() {
    setBusy(true);
    setErr(null);
    const r = await deleteMyAccount(user);
    setBusy(false);

    if (r.ok) {
      await signOut();
      window.location.href = "/";
      return;
    }
    setErr(r.reason === "recent" ? t("again") : t("failed"));
  }

  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center justify-center gap-2 text-sm font-medium text-muted underline-offset-4 hover:text-danger hover:underline"
      >
        <IconTrash className="size-4" />
        {t("open")}
      </button>
    );

  return (
    <section className="flex flex-col gap-3 rounded-card border-2 border-danger bg-danger/5 p-4">
      <h2 className="font-bold text-danger">{t("title")}</h2>

      {/* ما يُمحى وما يبقى — قبل الضغط لا بعده */}
      <ul className="flex flex-col gap-1.5 text-sm">
        <li>{t("goesAccount")}</li>
        <li>{t("goesPhone")}</li>
        {pts > 0 && (
          <li className="font-bold text-danger">
            {t("goesPoints", { n: pts })}
          </li>
        )}
        <li className="text-muted">{t("staysOrders")}</li>
      </ul>

      {err && <p className="text-sm font-medium text-danger">{err}</p>}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void remove()}
          className="min-h-12 rounded-card bg-danger px-4 font-bold text-white disabled:opacity-50"
        >
          {busy ? t("working") : t("confirm")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setOpen(false)}
          className="min-h-12 rounded-card border border-line px-4 font-bold"
        >
          {t("keep")}
        </button>
      </div>
    </section>
  );
}
