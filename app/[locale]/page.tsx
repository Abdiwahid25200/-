import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import HeroSlider from "@/components/HeroSlider";
import GameTile from "@/components/GameTile";
import VoucherLink from "@/components/VoucherLink";
import TrustRow from "@/components/TrustRow";
import PayChips from "@/components/PayChips";
import { sections, slides } from "@/lib/content";
import { icons, live, pubg } from "@/lib/data";

/**
 * الرئيسية بترتيب المعاينة التي اعتمدتها صاحبة المشروع:
 * ① الوعد وزرّان ونبض المتجر  ② شبكة المتجر  ③ الأكثر طلباً  ④ الضمانات والدفع
 */
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("hero2");
  const tp = await getTranslations("short");
  const tc = await getTranslations("common");

  // شبكة المتجر: كل الأقسام الظاهرة — ألعاب وحسابات معاً كما بالمعاينة
  const shop = sections.filter((s) => s.status !== "off");

  // الأكثر طلباً: أبرز الباقات لا القائمة كاملة
  const uc = live(pubg);
  const coins = live(icons);
  const top = [
    ...uc.filter((p) => p.popular),
    ...uc.filter((p) => p.disc && !p.popular),
    ...coins.filter((c) => c.popular),
  ].slice(0, 4);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-9 px-4 py-6">
      <HeroSlider slides={slides} />

      <section>
        <div className="mb-3.5 flex items-baseline gap-3">
          <h2 className="text-xl font-bold">{t("shop")}</h2>
          <Link
            href="/games"
            className="ms-auto text-sm font-bold text-orange hover:underline"
          >
            {t("all")}
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {shop.map((s) => (
            <GameTile
              key={s.key}
              href={s.href}
              icon={s.icon}
              img={s.img}
              title={tp(s.key)}
              badge={s.badge}
              badgeLabel={s.badge ? tc(s.badge) : undefined}
              soon={s.status === "soon"}
              soonLabel={tc("soon")}
            />
          ))}
        </div>
      </section>

      {top.length > 0 && (
        <section>
          <div className="mb-3.5 flex items-baseline gap-3">
            <h2 className="text-xl font-bold">{t("popular")}</h2>
            <Link
              href="/games"
              className="ms-auto text-sm font-bold text-orange hover:underline"
            >
              {t("all")}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {top.map((p) => (
              <VoucherLink
                key={p.id}
                href={"name" in p ? "/efootball" : "/pubg"}
                amount={p.amount.toLocaleString("en")}
                unit={"name" in p ? "eFootball" : "PUBG UC"}
                price={p.price}
                old={p.old}
                disc={"disc" in p ? p.disc : undefined}
                popular={p.popular}
                popularLabel={tc("popular")}
              />
            ))}
          </div>
        </section>
      )}

      <TrustRow />
      <PayChips />
    </main>
  );
}
