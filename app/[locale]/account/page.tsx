import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";
import { Link } from "@/i18n/navigation";
import { IconCart, IconDoc, IconSupport } from "@/components/icons";
import AccountPanel from "@/components/AccountPanel";

const links = [
  { key: "orders", href: "/account", Icon: IconDoc },
  { key: "cart", href: "/cart", Icon: IconCart },
  { key: "help", href: "/help", Icon: IconSupport },
] as const;

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
    <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
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
            {t(`links.${key}`)}
          </Link>
        ))}
      </section>
    </main>
  );
}
