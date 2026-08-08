"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import PointsBrand from "./PointsBrand";
import { readSections } from "@/lib/overrides";
import { sections as staticSections } from "@/lib/content";
import { cancelMyOrder, canCancel } from "@/lib/orders";
import { doneWord } from "@/lib/deliver";
import { fmt } from "@/lib/format";
import { useWhatsApp, waLink } from "@/lib/useWhatsApp";
import ShareReceipt from "./ShareReceipt";
import type { SavedOrder } from "@/lib/orders";
import {
  IconBall,
  IconBolt,
  IconCheckCircle,
  IconDevice,
  IconMusic,
  IconShare,
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
 * لكل قسم أيقونته وصفحته.
 *
 * ⚠️ و**كلمة نهايته في `lib/deliver.ts`** لا هنا: تقرؤها اللوحة أيضاً،
 *    فبقاؤها هنا وحدها هو ما جعل اللوحة تقول «Delivered» لشدّات ببجي
 *    بينما يقرأ الزبون «Topped up».
 */
const kinds = {
  pubg: { Icon: IconBolt, page: "pubg" },
  efootball: { Icon: IconBall, page: "efootball" },
  tiktok: { Icon: IconMusic, page: "tiktok" },
  accounts: { Icon: IconBall, page: "efootballAccounts" },
  elec: { Icon: IconDevice, page: "electronics" },
  // شراء نقاط — كان يظهر «إلكترونيات» بأيقونة جهاز، وهو ليس منتجاً أصلاً
  points: { Icon: IconDevice, page: "points" },
  "points-send": { Icon: IconDevice, page: "points" },
  "points-sell": { Icon: IconDevice, page: "points" },
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
  const [sharing, setSharing] = useState(false);

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
  const ts = useTranslations("share");
  const waNum = useWhatsApp();
  const tp = useTranslations("pages");
  const locale = useLocale();

  const kind = (order.kind in kinds ? order.kind : "elec") as KindKey;
  const { Icon, page } = kinds[kind];
  const doneKey = doneWord(order.kind);
  const isPoints = kind.startsWith("points");

  /**
   * صورة القسم كما رفعتها صاحبة المتجر — كانت البطاقة تعرض الأيقونة
   * المرسومة دائماً، فيرى الزبون برقاً مكان صورة ببجي التي يعرفها.
   */
  const [img, setImg] = useState<string | undefined>(
    staticSections.find((s) => s.key === page)?.img,
  );

  useEffect(() => {
    if (isPoints) return;
    let alive = true;
    void readSections()
      .then((o) => alive && setImg(o[page]?.img || staticSections.find((s) => s.key === page)?.img))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [page, isPoints]);

  /** كم استغرق التسليم — للإيصال المشارَك. صفرٌ ⇒ لا يُذكر وقتٌ لا نعرفه */
  const tookMinutes = (() => {
    const from = order.createdAt?.getTime?.() ?? 0;
    const to = order.updatedAt?.getTime?.() ?? 0;
    const m = from && to ? Math.round((to - from) / 60_000) : 0;
    return m > 0 && m < 60 * 24 ? m : 0;
  })();

  const cancelled = order.status === "cancelled";
  const at = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const done = order.status === "done";

  /* الرقم من اللوحة لا من الملف — كان الزرّ لا يظهر مهما كُتب */
  const waHref = waLink(waNum, `${t("askAbout")} ${order.code}`);

  return (
    <li className="card">
      {/* الترويسة: القسم ثم الرمز ثم المبلغ */}
      <div className="row">
        <span aria-hidden className={`plate overflow-hidden${done ? " g" : ""}`}>
          {isPoints ? (
            <PointsBrand size={26} showName={false} />
          ) : img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="size-full object-cover" />
          ) : (
            <Icon />
          )}
        </span>

        <span className="gr leading-tight">
          <span className="block truncate font-bold">{tp(page)}</span>
          <span className="num f11 mu block truncate" dir="ltr">
            {order.code}
          </span>
        </span>

        <span className="num shrink-0 font-extrabold text-yellow" dir="ltr">
          {fmt(order.total)}
        </span>
      </div>

      {/* مسار الطلب — الزبون يرى موضعه لا كلمة مجرّدة */}
      {cancelled ? (
        <p className="f13 mu mt-3 rounded-[12px] bg-bg px-3 py-2 font-medium">
          {t("status.cancelled")}
          {order.cancelReason && (
            <span className="mt-1 block font-normal">
              {t("cancelReason", { reason: order.cancelReason })}
            </span>
          )}
        </p>
      ) : (
        <ol className="path mt-3.5">
          {STEPS.map((s, i) => {
            const reached = i <= at;
            return (
              <li key={s} className="st">
                {/* الخطّ أوّلاً في الترميز والدائرةُ بعده — فتعلوه بلا z-index */}
                {i < STEPS.length - 1 && (
                  <span aria-hidden className={`ln${i < at ? " on" : ""}`} />
                )}
                <span aria-hidden className={`bl${reached ? " on" : ""}`}>
                  {i < at || done ? (
                    <IconCheckCircle />
                  ) : reached ? (
                    <IconSpinner />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                </span>
                {/* ⚠️ **سطران لا قصٌّ بثلاث نقاط** (٠٣-٠٨): كان `truncate`،
                    فلمّا صارت حالة «مدفوع» بالصومالية «Lacagta waa la
                    bixiyay» قُصّت إلى «Lacagta waa la…» — وكلمةٌ مقطوعة
                    في مسار الطلب أسوأ من سطرٍ ثانٍ. و`line-clamp-2`
                    يحدّ النموّ فلا يرتفع المسار بلا حساب. */}
                <span
                  className={`lb line-clamp-2 w-full ${reached ? "font-bold" : "mu"}`}
                >
                  {s === "done" ? t(`done.${doneKey}`) : t(`status.${s}`)}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {/* ماذا اشترى — كل صنف داخل <bdi> فيُقرأ باتجاهه هو مهما اختلطت
          حروفه بالأرقام ("660 UC") */}
      <p className="f13 mt-3.5 flex flex-wrap gap-x-2 gap-y-1 border-t border-line pt-3">
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
        <p className="f13 mu mt-1.5 flex items-start gap-2">
          <IconUser className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 break-words">{order.account}</span>
        </p>
      )}

      {/* 📸 وصلت شحنته ⇒ **الآن** لحظة الفخر، فيُعرض ما يُشارَك.
          ⚠️ ومطويّاً خلف زرّ: البطاقة تتكرّر بعدد طلباته، ولو فُتحت كلّها
             لصارت صفحةُ الطلبات معرضَ صور. */}
      {done &&
        (sharing ? (
          <div className="mt-3.5 flex flex-col gap-3 border-t border-line pt-3.5">
            <span className="f13 font-bold">{ts("title")}</span>
            <span className="f11 mu -mt-2">{ts("note")}</span>
            <ShareReceipt
              kind={order.kind}
              title={order.items?.[0]?.title ?? ""}
              minutes={tookMinutes}
            />
            <button
              type="button"
              onClick={() => setSharing(false)}
              className="f13 min-h-11 font-bold text-muted"
            >
              {t("cancelBack")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSharing(true)}
            className="f13 lift mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-yellow font-bold text-yellow"
          >
            <IconShare className="size-4.5" />
            {ts("open")}
          </button>
        ))}

      {/* "ماذا يحدث الآن؟" — جواب يخصّ هذا القسم لا جملة عامّة */}
      {!cancelled && !done && (
        <p className="f13 mu mt-2.5 rounded-[12px] bg-bg px-3 py-2">
          {t(`next.${kind}`)}
        </p>
      )}

      {/* الإلغاء — ما دام الطلب لم يصل صاحبه بعد، وبسببٍ مكتوب */}
      {canCancel(order) &&
        (asking ? (
          <div className="mt-3 flex flex-col gap-2 rounded-[14px] border border-line p-3">
            <label className="f13 font-bold" htmlFor={`why-${order.id}`}>
              {t("cancelWhy")}
            </label>
            <textarea
              id={`why-${order.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder={t("cancelPlaceholder")}
              className="f13 w-full rounded-[12px] border border-line bg-bg p-3 outline-none focus:border-orange"
            />
            {failed && <p className="f13 text-danger">{t("cancelError")}</p>}
            {reason.trim().length < 3 && (
              <p className="f13 mu">{t("cancelHint")}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || reason.trim().length < 3}
                onClick={() => void cancel()}
                className="f13 min-h-11 flex-1 rounded-[12px] bg-danger px-3 font-bold text-white disabled:opacity-50"
              >
                {t("cancelConfirm")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setAsking(false)}
                className="f13 min-h-11 flex-1 rounded-[12px] border border-line px-3 font-bold"
              >
                {t("cancelBack")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAsking(true)}
            className="f13 mt-3 min-h-11 w-full rounded-[14px] border border-line font-bold text-danger transition-colors hover:border-danger"
          >
            {t("cancel")}
          </button>
        ))}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {order.createdAt && (
          <time className="num f11 mu">
            {order.createdAt.toLocaleString("en", {
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
            className="f13 ms-auto flex min-h-11 items-center gap-2 rounded-[14px] border border-line px-3.5 font-medium transition-colors hover:border-orange hover:text-orange"
          >
            <IconWhatsApp className="size-5 rounded-md" />
            {t("askAbout")}
          </a>
        )}
      </div>
    </li>
  );
}
