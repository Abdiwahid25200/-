import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";
import CartButton from "./CartButton";
import SearchButton from "./SearchButton";
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
    // بلا خلفية بيضاء ولا خطّ فاصل — يجلس على أرضية الصفحة كما بالمعاينة.
    // ولأنه شفّاف فهو لا يلتصق بالأعلى، وإلا ظهر المحتوى من خلفه عند التمرير؛
    // التنقّل الدائم مكانه القائمة السفلية.
    <header className="coast-glow relative z-30">
      <div className="page-w flex items-center gap-3 px-4 py-3">
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

        {/* السلة بجانب زرّ القائمة — بطلب صاحبة المشروع.
            وجودها هنا يجعل عدّاد المشتريات مرئياً في كل صفحة بلا فتح القائمة. */}
        <div className="ms-auto flex items-center gap-1">
          {/* البحث قبل السلة: من يبحث لم يشترِ بعد */}
          <SearchButton />
          <CartButton />
          <MenuDrawer phone={store.whatsapp} />
        </div>
      </div>
    </header>
  );
}
