import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fmt } from "@/lib/format";
import { IconBall, IconBolt, IconDevice, IconMusic } from "@/components/icons";

/**
 * 🎟️ تذكرة الهديّة — **ما يريده أخوك، بلا زخرفة**.
 *
 * نفس تذكرة الرئيسية بالضبط: النصف الأعلى **ماذا**، والأسفل **بكم**
 * وزرُّ الفعل. لأنّ من فتح هذا الرابط قد يزور المتجر بعد يومين —
 * فليجد ما رآه أوّل مرّة.
 *
 * ⚠️ و**الآيدي داخلها**: الدافع ليس صاحب الحساب، فأوّلُ ما يتحقّق منه
 *    أن الرقم رقمُ أخيه لا رقمٌ آخر. إخفاؤه يجعل الدفع قفزةً في الظلام.
 */

const icons: Record<string, (p: { className?: string }) => React.ReactElement> = {
  pubg: IconBolt,
  efootball: IconBall,
  tiktok: IconMusic,
  accounts: IconBall,
  elec: IconDevice,
};

export default async function GiftTicket({
  title,
  sub,
  price,
  account,
  from,
  kind,
  href,
  open,
}: {
  title: string;
  sub?: string;
  price: number;
  account: string;
  from: string;
  kind: string;
  href: string;
  /** الباقة متاحة الآن؟ مغلقةٌ ⇒ زرٌّ معطّل لا وعدٌ كاذب */
  open: boolean;
}) {
  const t = await getTranslations("gift");
  const Icon = icons[kind] ?? IconDevice;

  return (
    <section
      className="ticket relative flex flex-col overflow-visible rounded-card text-white"
      style={{ ["--tear-y" as string]: "62%" }}
    >
      <div
        className="relative flex flex-col overflow-hidden rounded-card"
        style={{
          background:
            "radial-gradient(120% 120% at 88% 0%, #0e8a7c 0%, transparent 60%), linear-gradient(155deg, #078578 0%, #05655c 55%, #044f48 100%)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -start-14 size-56 rounded-full border border-white/10"
        />

        {/* ── ماذا يريد ── */}
        <div className="relative flex flex-col items-center gap-3.5 p-5 pb-4 text-center">
          <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold">
            {from ? t("wants", { name: from }) : t("wantsAnon")}
          </span>

          <span
            aria-hidden
            className="flex size-14 items-center justify-center rounded-card border border-white/20 bg-white/12"
          >
            <Icon className="size-7" />
          </span>

          <span className="min-w-0">
            <span className="block text-2xl font-bold leading-tight">{title}</span>
            {/* ⚠️ الآيدي وحده يُجبَر على `ltr` و`num` — نصٌّ عربيّ داخلهما
                يتباعد حروفُه ويُقرأ مقلوباً */}
            {account ? (
              <span className="num mt-1 block break-all text-xs opacity-80" dir="ltr">
                {account}
              </span>
            ) : sub ? (
              <span className="mt-1 block text-xs opacity-80">{sub}</span>
            ) : null}
          </span>
        </div>

        <div aria-hidden className="ticket-tear relative mx-4" />

        {/* ── بكم، وزرّ الفعل ── */}
        <div className="relative flex items-center gap-3 p-5 pt-4">
          <span className="min-w-0">
            <span className="num block text-3xl font-bold leading-none">{fmt(price)}</span>
            <span className="block text-xs opacity-70">{t("once")}</span>
          </span>

          {open ? (
            <Link
              href={href}
              className="lift ms-auto flex min-h-12 shrink-0 items-center rounded-full bg-surface px-6 font-bold text-orange"
            >
              {t("give")}
            </Link>
          ) : (
            <span className="ms-auto flex min-h-12 shrink-0 items-center rounded-full bg-white/20 px-6 font-bold opacity-70">
              {t("give")}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
