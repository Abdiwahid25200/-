"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeNames, routing, type Locale } from "@/i18n/routing";
import { ThemeChoice } from "./ThemeToggle";
import Logo from "./Logo";
import { IconCart, IconDoc, IconMenu, IconSupport, IconUser } from "./icons";
import SectionIcon, { type SectionIconKey } from "./SectionIcon";
import { sections } from "@/lib/content";

/**
 * الأقسام تُقرأ من الإعدادات — القسم الموقوف (off) لا يظهر بالقائمة.
 *
 * ولا يُضاف "الإلكترونيات" يدوياً هنا: هو قسمٌ في `sections` أصلاً، وإضافته
 * كانت تُظهره **مرّتين** في القائمة الجانبية.
 */
const shop = [
  ...sections
    .filter((s) => s.status === "on")
    .map((s) => ({
      key: s.key,
      href: s.href,
      icon: s.icon as SectionIconKey,
      img: s.img,
    })),
  { key: "games", href: "/games", icon: "games" as SectionIconKey },
];

const mine = [
  { key: "account", href: "/account", Icon: IconUser },
  { key: "cart", href: "/cart", Icon: IconCart },
] as const;

const info = [
  { key: "help", href: "/help", Icon: IconSupport },
  { key: "policy", href: "/policy", Icon: IconDoc },
] as const;

export default function MenuDrawer({ phone }: { phone?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const t = useTranslations("menu");
  const tp = useTranslations("pages");
  const tl = useTranslations("lang");
  const tth = useTranslations("theme");
  const active = useLocale();
  const pathname = usePathname();

  // إغلاق بمفتاح Escape ومنع تمرير الصفحة خلف القائمة
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const row =
    "flex min-h-12 items-center gap-3 rounded-card px-3 text-sm font-medium transition-colors hover:bg-bg";

  function Group({
    title,
    items,
  }: {
    title: string;
    items: readonly {
      key: string;
      href: string;
      Icon?: (p: { className?: string }) => React.ReactElement;
      icon?: SectionIconKey;
      /** صورة القسم متى رُفعت — تحلّ محلّ الأيقونة المرسومة */
      img?: string;
    }[];
  }) {
    return (
      <div>
        <h3 className="mb-1 px-3 text-xs font-bold uppercase tracking-wide text-muted">
          {title}
        </h3>
        <ul>
          {items.map(({ key, href, Icon, icon, img }) => (
            <li key={key}>
              <Link href={href} onClick={() => setOpen(false)} className={row}>
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt=""
                    className="size-7 shrink-0 rounded-[9px] border border-line object-cover"
                  />
                ) : icon ? (
                  <SectionIcon name={icon} className="size-7 shrink-0" />
                ) : Icon ? (
                  <Icon className="size-5 shrink-0 text-muted" />
                ) : null}
                {tp(key)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        aria-expanded={open}
        className="flex size-12 shrink-0 items-center justify-center rounded-card text-muted transition-colors hover:bg-bg hover:text-orange"
      >
        <IconMenu />
      </button>

      {open && mounted && createPortal(
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm"
            aria-hidden
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            className="fixed inset-y-0 end-0 z-50 flex w-[min(20rem,88vw)] flex-col overflow-y-auto bg-surface shadow-2xl"
          >
            <div className="flex items-center gap-2.5 border-b border-line p-4">
              <Logo className="size-9 rounded-xl shadow-sm" />
              <span className="font-bold">Ramaan Store</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="ms-auto flex size-11 items-center justify-center rounded-card text-2xl leading-none text-muted transition-colors hover:bg-bg hover:text-orange"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-5 p-3">
              <Group title={t("shop")} items={shop} />
              <Group title={t("mine")} items={mine} />
              <Group title={t("info")} items={info} />

              <div>
                <h3 className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-muted">
                  {tl("label")}
                </h3>
                <div className="flex gap-2">
                  {routing.locales.map((l) => (
                    <Link
                      key={l}
                      href={pathname}
                      locale={l}
                      onClick={() => setOpen(false)}
                      className={`flex min-h-12 flex-1 items-center justify-center rounded-card border-2 text-sm font-medium transition-colors ${
                        l === active
                          ? "border-orange bg-orange/5 text-orange"
                          : "border-line text-muted hover:border-orange/50"
                      }`}
                    >
                      {localeNames[l as Locale]}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-muted">
                  {tth("label")}
                </h3>
                <ThemeChoice />
              </div>

              {phone && (
                <a
                  href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 items-center justify-center rounded-card bg-yellow font-bold text-onaccent transition-opacity hover:opacity-90"
                >
                  💬 {t("whatsapp")}
                </a>
              )}
            </nav>
          </aside>
        </>,
        document.body,
      )}
    </>
  );
}
