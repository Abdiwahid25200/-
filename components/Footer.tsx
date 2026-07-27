import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";

const links = [
  { key: "help", href: "/help" },
  { key: "policy", href: "/policy" },
  { key: "account", href: "/account" },
] as const;

export default async function Footer() {
  const t = await getTranslations("footer");
  const th = await getTranslations("header");

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <Logo className="size-11 rounded-xl shadow-sm" />
            <span className="leading-tight">
              <span className="block font-bold">{th("brand")}</span>
              <span className="block text-sm text-muted">{th("tagline")}</span>
            </span>
          </div>

          <nav aria-label={t("links")} className="flex flex-col gap-1">
            {links.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className="flex min-h-12 items-center text-sm text-muted transition-colors hover:text-orange"
              >
                {t(key)}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
          {t("rights")}
        </p>
      </div>
    </footer>
  );
}
