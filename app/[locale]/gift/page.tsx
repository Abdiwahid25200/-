import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { mergedItems } from "@/lib/items";
import { buyHref, readGift } from "@/lib/gift";
import { mergedSite } from "@/lib/overrides";
import GiftProof from "@/components/GiftProof";
import GiftTicket from "@/components/GiftTicket";
import { IconGift } from "@/components/icons";

/**
 * 🎁 **صفحة الهديّة** — يفتحها من طُلب منه الدفع.
 *
 * ⚠️ **وهي أهمّ شاشةٍ في المتجر كلّه**، وأصعبُها: يراها **غريبٌ لأوّل
 *    مرّة**، جاءه رابطٌ على واتساب من أخيه الصغير، ويُطلب منه أن يدفع
 *    لمتجرٍ لم يسمع به. فليس فيها كلامٌ عنّا، بل ثلاثة أشياء:
 *      ① ما يريده أخوه بالضبط — بالصنف والآيدي والسعر
 *      ② أرقامُنا الحقيقية: كم سُلّم، وكم يستغرق، وهل نردّ الآن
 *      ③ بابُ سؤالٍ قبل الدفع — من شكّ فليسأل، لا فليخرج
 *
 * ⚠️ **ولا تُخزَّن**: السعر يُقرأ من `mergedItems` عند كل فتحة، فلو
 *    غيّرتِ السعر أو أغلقتِ الباقة رأى الحقيقة لا رقماً محفوظاً من أمس.
 */
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "gift" });
  return {
    title: t("wantsAnon"),
    /* 🔒 لا يُفهرَس: رابطٌ يخصّ شخصين، وفيه آيدي لعبة */
    robots: { index: false, follow: false },
  };
}

export default async function GiftPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) flat[k] = Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

  const t = await getTranslations("gift");
  const gift = readGift(flat);

  /* رابطٌ مقصوصٌ بالنسخ — عذرٌ صريح وبابٌ إلى المتجر، لا شاشة نصف فارغة */
  if (!gift) return <Broken t={t} />;

  const items = await mergedItems(gift.kind);
  const item = items.find((i) => i.id === gift.item);
  if (!item) return <Broken t={t} />;

  const store = await mergedSite();
  const open = item.status === "on";

  return (
    <main className="seq page-w scr-body pt-3.5">
      <GiftTicket
        title={item.title}
        sub={item.sub}
        price={item.price}
        account={gift.account}
        from={gift.from}
        kind={gift.kind}
        href={buyHref(gift)}
        open={open}
      />

      {/* أرقامنا — لا وعودنا. الغريب لا يصدّق كلامنا عن أنفسنا */}
      <GiftProof brand={store.brand} />

      {!open && (
        <p className="rounded-card border border-line bg-surface2 px-4 py-3 text-center text-sm font-bold text-muted">
          {t("soonPack")}
        </p>
      )}

      <Link
        href="/"
        className="text-center text-sm font-bold text-muted underline-offset-4 hover:underline"
      >
        {t("browse")}
      </Link>
    </main>
  );
}

/** رابطٌ ناقص — يحدث حين يُقصّ بالنسخ على واتساب */
function Broken({ t }: { t: (k: string) => string }) {
  return (
    <main className="page-w flex flex-col items-center gap-4 px-6 py-20 text-center">
      <span
        aria-hidden
        className="flex size-16 items-center justify-center rounded-card bg-orange/10 text-orange"
      >
        <IconGift className="size-8" />
      </span>
      <h1 className="text-xl font-bold">{t("gone")}</h1>
      <p className="max-w-sm text-muted">{t("goneNote")}</p>
      <Link
        href="/"
        className="lift mt-2 flex min-h-12 items-center rounded-card bg-orange px-6 font-bold text-onaccent"
      >
        {t("browse")}
      </Link>
    </main>
  );
}
