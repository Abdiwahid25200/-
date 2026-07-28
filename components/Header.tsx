import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";
import MenuDrawer from "./MenuDrawer";
import { site as store } from "@/lib/content";

/**
 * الهيدر — كما بالمعاينة التي اعتمدتها صاحبة المشروع بالضبط:
 * صفيحة الشعار، ثم الاسم والوسم، ثم زرّ القائمة وحده.
 *
 * الحساب والسلة انتقلا داخل القائمة الجانبية، فلا يزدحم الشريط
 * ويبقى اسم المتجر هو أول ما تقع عليه العين.
 */
export default async function Header() {
  const t = await getTranslations("header");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Logo solid className="size-11 shrink-0 rounded-[13px] shadow-sm" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[1.05rem] font-bold">
              {t("brand")}
            </span>
            <span className="block truncate text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted rtl:tracking-normal">
              {t("tagline")}
            </span>
          </span>
        </Link>

        <div className="ms-auto">
          <MenuDrawer phone={store.whatsapp} />
        </div>
      </div>
    </header>
  );
}
