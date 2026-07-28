import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";
import { Link } from "@/i18n/navigation";
import { IconCart, IconDoc, IconSupport, IconUser } from "@/components/icons";

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

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
      <BackLink href="/" />
      <SectionHead title={t("title")} note={t("note")} />

      <section className="rounded-card border border-line bg-surface p-6 text-center">
        <span
          aria-hidden
          className="mx-auto flex size-16 items-center justify-center rounded-full bg-orange/10 text-orange"
        >
          <IconUser className="size-8" />
        </span>
        <h2 className="mt-3 text-lg font-bold">{t("guest")}</h2>
        <p className="mt-1 text-sm text-muted">{t("guestNote")}</p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled
            className="min-h-12 flex-1 rounded-card bg-orange font-bold text-white opacity-40"
          >
            {t("login")}
          </button>
          <button
            type="button"
            disabled
            className="min-h-12 flex-1 rounded-card border border-line font-bold text-muted opacity-60"
          >
            {t("register")}
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">{t("soon")}</p>
      </section>

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
