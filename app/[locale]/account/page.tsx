import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";
import { IconChevron } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { IconCart, IconDoc, IconGift, IconSupport } from "@/components/icons";
import AccountPanel from "@/components/AccountPanel";
import { privateMeta } from "@/lib/seo";

/**
 * ⚠️ «طلباتي» كان يشير إلى `/account` — أي إلى الصفحة نفسها: تضغطينه
 *    فلا يحدث شيء. صار يفتح `/orders`، وأُضيفت النقاط بجانبه.
 */
const links = [
  { key: "orders", href: "/orders", Icon: IconDoc },
  { key: "points", href: "/points", Icon: IconGift },
  { key: "cart", href: "/cart", Icon: IconCart },
  { key: "help", href: "/help", Icon: IconSupport },
] as const;

/** صفحة الزبون الخاصّة — لا تُفهرَس */
export const metadata = privateMeta;

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("accountPage");
  const te = await getTranslations("eyebrow");

  return (
    <main className="page-w flex flex-col gap-5 px-4 py-6">
      <BackLink href="/" />
      <SectionHead
        eyebrow={te("account")} title={t("title")} note={t("note")} />

      <AccountPanel />

      <section className="rounded-card border border-line bg-surface p-2">
        {links.map(({ key, href, Icon }) => (
          <Link
            key={key}
            href={href}
            className="flex min-h-14 items-center gap-3 rounded-card px-3 font-medium transition-colors hover:bg-bg"
          >
            <Icon className="size-5 text-muted" />
            <span className="min-w-0 flex-1 truncate">{t(`links.${key}`)}</span>
            <IconChevron className="size-4 shrink-0 text-muted rtl:rotate-180" />
          </Link>
        ))}
      </section>
    </main>
  );
}
