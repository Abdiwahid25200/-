import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";
import { IconTelegram, IconWhatsApp } from "./icons";
import { footerLinks, site } from "@/lib/content";
import { mergedSite } from "@/lib/overrides";
import type { Locale } from "@/i18n/routing";

/**
 * ختام الصفحة — في **صفحة الدعم وحدها**، قرار صاحبة المتجر.
 *
 * كان فوتراً بأربعة أعمدة أسفل كل صفحة، فتكرّرت روابطه في القائمة السفلية
 * والجانبية، ومرّ الشريط العائم فوقها فظهرت مقصوصة. الآن يُختم به موضعٌ
 * واحد يليق به: صفحة المساعدة، حيث يبحث الزبون عن هذه الروابط أصلاً.
 *
 * ولا يكرّر ما فوقه في تلك الصفحة: التواصل وساعات العمل ووسائل الدفع
 * معروضة هناك بالفعل — فبقي هنا **ما لا مكان له غيره**: العلامة، والسياسات،
 * وسطر الحقوق.
 *
 * ولغة التصميم كما هي: خطّ تقطيع منقّط كقسيمة، وصفيحة سداسية كوجه عملة،
 * وأرقام `.num` المتساوية.
 */
export default async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations("footer");
  const L = locale as Locale;

  /* ⚠️ من اللوحة لا من الملف: `site.whatsapp` في `lib/content.ts` فارغ،
     فكانت أيقونتا التواصل لا تظهران مهما كُتب الرقم في Store info */
  const store = await mergedSite();

  const socials = [
    store.whatsapp && {
      key: "wa",
      label: "WhatsApp",
      href: `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`,
      Icon: IconWhatsApp,
    },
    store.telegram && {
      key: "tg",
      label: "Telegram",
      href: `https://t.me/${store.telegram.replace(/^@/, "")}`,
      Icon: IconTelegram,
    },
  ].filter(Boolean) as {
    key: string;
    label: string;
    href: string;
    Icon: (p: { className?: string }) => React.ReactElement;
  }[];

  return (
    <footer className="mt-12">
      {/* خطّ التقطيع — نفس خطّ القسيمة، فيُقرأ الختام كجزء من العائلة */}
      <span
        aria-hidden
        className="block border-t border-dashed border-line"
      />

      <div className="flex flex-col items-center gap-4 px-4 pt-8 text-center">
        {/* صفيحة سداسية = وجه عملة، كبلاطات الأقسام */}
        <span
          aria-hidden
          className="flex aspect-square w-16 items-center justify-center bg-surface2"
          style={{
            clipPath: "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
          }}
        >
          <Logo className="size-9" />
        </span>

        <span className="leading-tight">
          <span className="block font-bold">{store.brand}</span>
          <span className="mt-0.5 block text-sm text-muted">
            {store.taglineOf(L)}
          </span>
        </span>

        {/* السياسات — أقراص صغيرة تلتفّ بلا عمود طويل */}
        <nav
          aria-label={t("policies")}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {footerLinks.policies.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="lift min-h-11 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-muted transition-colors hover:border-orange hover:text-orange"
            >
              {t(`policy.${key}`)}
            </Link>
          ))}
        </nav>

        {socials.length > 0 && (
          <div className="flex gap-2">
            {socials.map(({ key, label, href, Icon }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="lift"
              >
                <Icon className="size-11 rounded-2xl shadow-sm" />
              </a>
            ))}
          </div>
        )}

        <p className="pt-2 text-xs text-muted">
          <span className="num">{new Date().getFullYear()}</span> © {store.brand}{" "}
          — {t("rights")}
        </p>
      </div>
    </footer>
  );
}
