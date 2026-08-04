"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeNames, routing, type Locale } from "@/i18n/routing";
import Logo from "./Logo";
import {
  IconChevron,
  IconClose,
  IconMenu,
  IconUser,
  IconWhatsApp,
} from "./icons";
import SectionIcon, { type SectionIconKey } from "./SectionIcon";
import { showsGroup, useIsApp } from "@/lib/platform";
import { IconBarwaaqo } from "@/components/icons";
import { sections } from "@/lib/content";
import { myPoints } from "@/lib/points";
import { useAuth } from "@/lib/auth";
import { customSections, readSections } from "@/lib/overrides";
import { POINTS_BRAND, POINTS_ICON, readPointsSettings } from "@/lib/points";

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
      group: s.group as string | undefined,
    })),
  {
    key: "games",
    href: "/games",
    icon: "games" as SectionIconKey,
    img: undefined as string | undefined,
    group: "games" as string | undefined,
  },
];

export default function MenuDrawer({ phone }: { phone?: string }) {
  const active = useLocale();
  const isApp = useIsApp();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  /** الأقسام التي أضافتها صاحبة المتجر — تُقرأ مرّة عند أول فتح للقائمة */
  const [added, setAdded] = useState<
    {
      key: string;
      href: string;
      icon: SectionIconKey;
      img?: string;
      label: string;
      group?: string;
    }[]
  >([]);
  /** الأقسام الأصلية بعد تطبيق صور اللوحة عليها */
  const [base, setBase] = useState(shop);
  /** هويّة برنامج النقاط — اسمه وشعاره كما ضبطتهما صاحبة المتجر */
  const [pts, setPts] = useState({ brand: POINTS_BRAND, logo: POINTS_ICON, on: true });
  const [mounted, setMounted] = useState(false);
  /** رصيده — يُقرأ عند أوّل فتحٍ للقائمة، فلا يدفع ثمنَه من لم يفتحها */
  const [balance, setBalance] = useState("");

  useEffect(() => setMounted(true), []);

  /**
   * الأقسام المضافة من اللوحة تُقرأ **عند أول فتح للقائمة** لا عند تحميل
   * الصفحة — فلا يدفع كلُّ زائر ثمن قراءةٍ قد لا يفتح القائمة أصلاً.
   */
  useEffect(() => {
    if (!open || added.length) return;

    /* ⚠️ نقرأ التعديلات مرّةً واحدة لغرضين: صور الأقسام **الأصلية**
       (كانت تُقرأ من الملفات فلا تظهر الصورة التي رفعتها من اللوحة)،
       والأقسام المضافة كلّها. */
    void myPoints(user).then((n) => n > 0 && setBalance(String(n))).catch(() => {});

    void readSections().then((o) =>
      setBase(
        shop.map((x) => ({ ...x, img: o[x.key]?.img || x.img })),
      ),
    );

    void readPointsSettings().then((v) =>
      setPts({ brand: v.brand, logo: v.logo, on: v.on }),
    );

    void customSections().then((list) =>
      setAdded(
        list
          .filter((c) => (c.over?.status ?? "on") === "on")
          .map((c) => ({
            key: c.key,
            href: c.href,
            icon: (c.over?.icon ?? "games") as SectionIconKey,
            img: c.over?.img,
            group: c.over?.group ?? "games",
            label:
              c.over?.title?.[active as "ar" | "en" | "so"] ||
              c.over?.title?.en ||
              c.key,
          })),
      ),
    );
  }, [open, added.length, active]);
  const t = useTranslations("menu");
  const tp = useTranslations("pages");
  const tl = useTranslations("lang");
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

  /** قائمةٌ واحدة مسطّحة — بلا عنوان مجموعة، كما في النموذج */
  function Flat({
    items,
  }: {
    items: readonly {
      key: string;
      href: string;
      Icon?: (p: { className?: string }) => React.ReactElement;
      icon?: SectionIconKey;
      /** اسمٌ جاهز — للأقسام المضافة من اللوحة، فلا مفتاح ترجمة لها */
      label?: string;
      /** صورة القسم متى رُفعت — تحلّ محلّ الأيقونة المرسومة */
      img?: string;
      /** رقمٌ في طرف الصفّ — الرصيد مثلاً */
      right?: string;
    }[];
  }) {
    return (
      <ul className="flex flex-col gap-0.5">
          {items.map(({ key, href, Icon, icon, img, label, right }) => (
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
                <span className="min-w-0 flex-1 truncate">{label ?? tp(key)}</span>
                {right && (
                  <span className="num shrink-0 text-sm font-bold text-yellow">{right}</span>
                )}
              </Link>
            </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        aria-expanded={open}
        /* بلون النصّ لا رماديّاً باهتاً — كما في النموذج، وكأختها السلّة */
        className="flex size-12 shrink-0 items-center justify-center rounded-xl text-text transition-colors hover:text-orange"
      >
        <IconMenu className="size-[21px]" />
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
              <Logo className="size-9 shrink-0 rounded-xl shadow-sm" />
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate font-bold">Ramaan Store</span>
                <span className="block truncate text-xs text-muted">{t("title")}</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="flex size-11 shrink-0 items-center justify-center rounded-card text-muted transition-colors hover:bg-bg hover:text-orange"
              >
                {/* ⚠️ كان المحرف ✕ — يتبدّل شكلُه بين جهازٍ وجهاز ولا يقبل
                    سماكةً ولا حجماً، وقد يظهر مربّعاً فارغاً. أيقونةٌ مرسومة. */}
                <IconClose className="size-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-4 p-3">
              {/* ⚠️ **بطاقة الحساب أوّلاً** كما في النموذج — لا عنوانَ
                  «حسابي» فوق ثلاثة صفوف. من فتح القائمة يبحث عن نفسه
                  أوّلاً: طلباتُه ورصيدُه. */}
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-card bg-surface2 p-3"
              >
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-card bg-surface text-orange"
                >
                  <IconUser className="size-5" />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate font-bold">{t("account")}</span>
                  <span className="block truncate text-xs text-muted">{t("mine")}</span>
                </span>
                <IconChevron className="size-4 shrink-0 text-muted rtl:rotate-180" />
              </Link>

              {/* ⚠️ **قائمةٌ واحدة مسطّحة** — كانت ثلاث مجموعاتٍ بعناوين
                  («المتجر»، «حسابي»، «معلومات»)، فصار في القائمة ستّة
                  أسطر عنوانٍ فوق أحد عشر سطر وجهة. النموذج قائمةٌ تُمسح
                  بالعين مرّةً واحدة. */}
              <Flat
                items={[
                  ...[...base, ...added].filter((x) => showsGroup(x.group, isApp)),
                  ...(pts.on
                    ? [
                        {
                          key: "points",
                          href: "/points",
                          img: pts.logo,
                          /* بلا صورةٍ مرفوعة تُرسم القطرة — لا فراغ */
                          Icon: IconBarwaaqo,
                          label: pts.brand,
                          /* رصيدُه في طرف الصفّ — يراه بلا أن يفتح صفحة */
                          right: balance,
                        },
                      ]
                    : []),
                ]}
              />

              <span aria-hidden className="h-px bg-line" />

              {/* اللغات ثلاث حبّاتٍ في صفّ — كما في النموذج */}
              <div className="flex gap-2">
                {routing.locales.map((l) => (
                  <Link
                    key={l}
                    href={pathname}
                    locale={l}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-11 flex-1 items-center justify-center rounded-full border text-sm font-bold transition-colors ${
                      l === active
                        ? "border-orange bg-orange text-onaccent"
                        : "border-line text-muted hover:border-orange/50"
                    }`}
                  >
                    {localeNames[l as Locale]}
                  </Link>
                ))}
              </div>

              {/* ⚠️ **زرّ واتساب بلون واتساب، وبأيقونةٍ مرسومة.**
                  كان أصفر وعليه الإيموجي 💬 — والإيموجي ممنوع بقرارها:
                  يختلف شكله بين آيفون وأندرويد وويندوز. */}
              {phone && (
                <a
                  href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lift mt-auto flex min-h-12 items-center justify-center gap-2 rounded-card bg-[#25d366] font-bold text-white"
                >
                  <IconWhatsApp className="size-5 rounded-md" />
                  {t("whatsapp")}
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
