import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";
import MenuDrawer from "./MenuDrawer";
import { IconCart, IconSearch, IconUser } from "./icons";
import { store } from "@/lib/data";

export default async function Header() {
  const t = await getTranslations("header");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        {/* الشعار */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Logo className="size-10 rounded-xl shadow-sm" />
          <span className="leading-tight">
            <span className="block font-bold">{t("brand")}</span>
            <span className="hidden text-xs text-muted sm:block">
              {t("tagline")}
            </span>
          </span>
        </Link>

        {/* البحث — يظهر بالشاشات المتوسطة فما فوق */}
        <form
          role="search"
          className="hidden flex-1 items-center gap-2 rounded-card border border-line bg-bg px-3 md:flex"
        >
          <IconSearch className="size-5 shrink-0 text-muted" />
          <input
            type="search"
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="min-h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </form>

        <div className="ms-auto flex items-center gap-1 md:ms-0">
          <Link
            href="/account"
            aria-label={t("account")}
            className="flex size-12 items-center justify-center rounded-card text-muted transition-colors hover:bg-bg hover:text-orange"
          >
            <IconUser />
          </Link>

          <Link
            href="/cart"
            aria-label={t("cart")}
            className="relative flex size-12 items-center justify-center rounded-card text-muted transition-colors hover:bg-bg hover:text-orange"
          >
            <IconCart />
            <span className="absolute end-1.5 top-1.5 flex min-w-5 items-center justify-center rounded-full bg-orange px-1 text-[0.7rem] font-bold text-white">
              0
            </span>
          </Link>

          <MenuDrawer phone={store.phone} />
        </div>
      </div>
    </header>
  );
}
