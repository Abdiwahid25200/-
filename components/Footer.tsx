import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";
import { IconTelegram, IconWhatsApp } from "./icons";
import { acceptedPayments, footerLinks, site } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export default async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations("footer");
  const tp = await getTranslations("pages");
  const L = locale as Locale;

  const contact = [
    { icon: "📍", value: site.address[L], href: null },
    { icon: "📞", value: site.whatsapp, href: site.whatsapp ? `tel:${site.whatsapp}` : null, ltr: true },
    { icon: "✉️", value: site.email, href: site.email ? `mailto:${site.email}` : null, ltr: true },
    { icon: "🕐", value: site.hours[L], href: null },
  ].filter((c) => c.value);

  const socials = [
    site.whatsapp && {
      key: "wa",
      href: `https://wa.me/${site.whatsapp.replace(/\D/g, "")}`,
      Icon: IconWhatsApp,
    },
    site.telegram && {
      key: "tg",
      href: `https://t.me/${site.telegram.replace(/^@/, "")}`,
      Icon: IconTelegram,
    },
  ].filter(Boolean) as { key: string; href: string; Icon: (p: { className?: string }) => React.ReactElement }[];

  const col = "flex flex-col gap-2";
  const head = "text-sm font-bold";
  const link =
    "flex min-h-10 items-center text-sm text-muted transition-colors hover:text-orange";

  return (
    <footer className="mt-10 border-t border-line bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* العلامة */}
          <div className={col}>
            <div className="flex items-center gap-3">
              <Logo className="size-11 shrink-0 rounded-xl shadow-sm" />
              <span className="font-bold">{site.brand}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              {site.description[L]}
            </p>
            {socials.length > 0 && (
              <div className="mt-1 flex gap-2">
                {socials.map(({ key, href, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key === "wa" ? "WhatsApp" : "Telegram"}
                  >
                    <Icon className="size-10 rounded-xl shadow-sm transition-opacity hover:opacity-80" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* روابط سريعة */}
          <nav className={col} aria-label={t("quick")}>
            <h3 className={head}>{t("quick")}</h3>
            {footerLinks.quick.map(({ key, href }) => (
              <Link key={key} href={href} className={link}>
                {tp(key === "home" ? "electronics" : key)}
              </Link>
            ))}
          </nav>

          {/* السياسات */}
          <nav className={col} aria-label={t("policies")}>
            <h3 className={head}>{t("policies")}</h3>
            {footerLinks.policies.map(({ key, href }) => (
              <Link key={key} href={href} className={link}>
                {t(`policy.${key}`)}
              </Link>
            ))}
          </nav>

          {/* التواصل */}
          <div className={col}>
            <h3 className={head}>{t("contact")}</h3>
            {contact.length ? (
              contact.map((c) => (
                <div key={c.icon} className="flex items-start gap-2 text-sm text-muted">
                  <span aria-hidden className="mt-0.5 shrink-0">
                    {c.icon}
                  </span>
                  {c.href ? (
                    <a href={c.href} dir={c.ltr ? "ltr" : undefined} className="hover:text-orange">
                      {c.value}
                    </a>
                  ) : (
                    <span dir={c.ltr ? "ltr" : undefined}>{c.value}</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">{t("contactSoon")}</p>
            )}
          </div>
        </div>

        {/* وسائل الدفع — تُعرض هنا فقط، لا تتكرر في الصفحات */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-line pt-6">
          <span className="text-sm font-medium">{t("weAccept")}</span>
          {acceptedPayments.map((p) => (
            <span
              key={p}
              dir="ltr"
              className="rounded-card border border-line bg-bg px-3 py-1.5 text-xs font-semibold text-muted"
            >
              {p}
            </span>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          © {new Date().getFullYear()} {site.brand} — {t("rights")}
        </p>
      </div>
    </footer>
  );
}
