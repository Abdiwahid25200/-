"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { cancelMyOrder, canCancel } from "@/lib/orders";
import { fmt } from "@/lib/format";
import { wa } from "@/lib/data";
import type { SavedOrder } from "@/lib/orders";
import {
  IconBall,
  IconBolt,
  IconCheckCircle,
  IconDevice,
  IconMusic,
  IconSpinner,
  IconUser,
  IconWhatsApp,
} from "@/components/icons";

/**
 * بطاقة طلب واحد.
 *
 * ليست سطراً واحداً بحالة: كل قسم يُسلَّم بطريقة مختلفة، فالزبون يحتاج
 * جواباً مختلفاً عن سؤال واحد — "ماذا يحدث الآن؟":
 *   شدات ببجي  ⇐ يصلك على آيدي حسابك
 *   الحسابات   ⇐ نراسلك على واتساب لتسليم البيانات
 *   إلكترونيات ⇐ تُشحن إلى عنوانك
 * فالبطاقة تعرض أيقونة القسم واسمه وسطر "ما التالي" الخاص به،
 * ومسار الطلب الثلاثي، وزرّ متابعة يحمل رمز الطلب جاهزاً.
 */

/**
 * لكل قسم أيقونته واسمه — و**كلمة نهايته**.
 * "تم التسليم" لا تصف شحن شدات: الألعاب تُشحن، والحسابات تُسلَّم،
 * والإلكترونيات تُوصَّل. كلمة واحدة لكل الأقسام تجعل الجملة غريبة.
 */
const kinds = {
  pubg: { Icon: IconBolt, page: "pubg", done: "toppedUp" },
  efootball: { Icon: IconBall, page: "efootball", done: "toppedUp" },
  tiktok: { Icon: IconMusic, page: "tiktok", done: "handedOver" },
  accounts: { Icon: IconBall, page: "efootballAccounts", done: "handedOver" },
  elec: { Icon: IconDevice, page: "electronics", done: "shipped" },
} as const;

type KindKey = keyof typeof kinds;

/** مراحل الطلب — الملغى خارجها فيُعرض وحده */
const STEPS = ["pending", "paid", "done"] as const;

export default function OrderCard({
  order,
  onChanged,
}: {
  order: SavedOrder;
  /** يُنادى بعد الإلغاء ليُعاد تحميل الطلبات */
  onChanged?: () => void;
}) {
  const { user } = useAuth();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function cancel() {
    setBusy(true);
    setFailed(false);
    const ok = await cancelMyOrder(user, order.id, reason);
    setBusy(false);
    if (!ok) return setFailed(true);
    setAsking(false);
    onChanged?.();
  }

  const t = useTranslations("accountPage");
  const tp = useTranslations("pages");
  const locale = useLocale();

  const kind = (order.kind in kinds ? order.kind : "elec") as KindKey;
  const { Icon, page, done: doneKey } = kinds[kind];

  const cancelled = order.status === "cancelled";
  const at = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const done = order.status === "done";

  const waHref = wa
    ? `https://wa.me/${wa.replace(/\D/g, "")}?text=${encodeURIComponent(
        `${t("askAbout")} ${order.code}`,
      )}`
    : null;

  return (
    <li className="rounded-card border border-line bg-surface p-4">
      {/* الترويسة: القسم ثم الرمز ثم المبلغ */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`flex size-11 shrink-0 items-center justify-center rounded-card ${
            done ? "bg-yellow/15 text-yellow" : "bg-orange/10 text-orange"
          }`}
        >
          <Icon className="size-6" />
        </span>

        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate font-bold">{tp(page)}</span>
          <span className="num block truncate text-xs text-muted" dir="ltr">
            {order.code}
          </span>
        </span>

        <span className="num shrink-0 font-bold text-yellow" dir="ltr">
          {fmt(order.total)}
        </span>
      </div>

      {/* مسار الطلب — الزبون يرى موضعه لا كلمة مجرّدة */}
      {cancelled ? (
        <p className="mt-3 rounded-card bg-bg px-3 py-2 text-sm font-medium text-muted">
          {t("status.cancelled")}
          {order.cancelReason && (
            <span className="mt-1 block font-normal">
              {t("cancelReason", { reason: order.cancelReason })}
            </span>
          )}
        </p>
      ) : (
        <ol className="mt-3.5 flex items-center gap-1.5">
          {STEPS.map((s, i) => {
            const reached = i <= at;
            return (
              <li key={s} className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span
                    aria-hidden
                    className={`flex size-5 items-center justify-center rounded-full ${
                      reached ? "bg-orange text-onaccent" : "bg-bg text-muted"
                    }`}
                  >
                    {i < at || done ? (
                      <IconCheckCircle className="size-3.5" />
                    ) : reached ? (
                      <IconSpinner className="size-3.5" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span
                    className={`w-full truncate text-center text-xs ${
                      reached ? "font-bold text-text" : "text-muted"
                    }`}
                  >
                    {s === "done" ? t(`done.${doneKey}`) : t(`status.${s}`)}
                  </span>
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className={`mb-5 h-0.5 w-4 shrink-0 rounded-full ${
                      i < at ? "bg-orange" : "bg-line"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* ماذا اشترى — كل صنف داخل <bdi> فلا ينقلب "660 UC" إلى "UC 660"
          بالعربية، وتبقى الأصناف العربية بعكسها سليمة */}
      <p className="mt-3.5 flex flex-wrap gap-x-2 gap-y-1 border-t border-line pt-3 text-sm">
        {order.items.map((i, n) => (
          <span key={i.id ?? n} className="inline-flex items-center gap-2">
            {n > 0 && <span className="text-muted">·</span>}
            <bdi>
              {i.title}
              {i.qty > 1 && ` ×${i.qty}`}
            </bdi>
          </span>
        ))}
      </p>

      {/* بيانات التسليم كما أدخلها الزبون — بها يتأكّد أنه كتبها صحيحة */}
      {order.account && (
        <p className="mt-1.5 flex items-start gap-2 text-sm text-muted">
          <IconUser className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 break-words">{order.account}</span>
        </p>
      )}

      {/* "ماذا يحدث الآن؟" — جواب يخصّ هذا القسم لا جملة عامّة */}
      {!cancelled && !done && (
        <p className="mt-2.5 rounded-card bg-bg px-3 py-2 text-sm text-muted">
          {t(`next.${kind}`)}
        </p>
      )}

      {/* الإلغاء — ما دام الطلب لم يصل صاحبه بعد، وبسببٍ مكتوب */}
      {canCancel(order) &&
        (asking ? (
          <div className="mt-3 flex flex-col gap-2 rounded-card border border-line p-3">
            <label className="text-sm font-bold" htmlFor={`why-${order.id}`}>
              {t("cancelWhy")}
            </label>
            <textarea
              id={`why-${order.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder={t("cancelPlaceholder")}
              className="w-full rounded-card border border-line bg-bg p-3 text-sm outline-none focus:border-orange"
            />
            {failed && <p className="text-sm text-danger">{t("cancelError")}</p>}
            {reason.trim().length < 3 && (
              <p className="text-sm text-muted">{t("cancelHint")}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || reason.trim().length < 3}
                onClick={() => void cancel()}
                className="min-h-11 flex-1 rounded-card bg-danger px-3 font-bold text-white disabled:opacity-50"
              >
                {t("cancelConfirm")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setAsking(false)}
                className="min-h-11 flex-1 rounded-card border border-line px-3 font-bold"
              >
                {t("cancelBack")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAsking(true)}
            className="mt-3 min-h-11 w-full rounded-card border border-line text-sm font-bold text-danger transition-colors hover:border-danger"
          >
            {t("cancel")}
          </button>
        ))}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {order.createdAt && (
          <time className="num text-xs text-muted">
            {order.createdAt.toLocaleString(locale === "ar" ? "ar" : "en", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
        )}

        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="ms-auto flex min-h-11 items-center gap-2 rounded-card border border-line px-3.5 text-sm font-medium transition-colors hover:border-orange hover:text-orange"
          >
            <IconWhatsApp className="size-5 rounded-md" />
            {t("askAbout")}
          </a>
        )}
      </div>
    </li>
  );
}
