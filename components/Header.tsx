import { getTranslations, getLocale } from "next-intl/server";
import { mergedSite } from "@/lib/overrides";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";
import CartButton from "./CartButton";
import MenuDrawer from "./MenuDrawer";
import OpenBar from "./OpenBar";
import TopNav from "./TopNav";

/**
 * الترويسة — **مبنيّةٌ على أصناف النموذج** (`.hdr` · `.mk` · `.bn` · `.hi`)
 * لا على مقاساتٍ مشتقّة في Tailwind. الشعار، ثم الاسم والوسم، ثم السلّة
 * وزرّ القائمة.
 *
 * ⚠️ **المقاسات كلّها في `globals.css` لا هنا**: ٣٤px للشعار، ١٧px للاسم،
 *    ٣٨px لأزرار الطرف، ٢١px لأيقوناتها — كما رسمها النموذج. فتعديل
 *    الترويسة في كل الصفحات تعديلُ قاعدةٍ واحدة.
 *
 * ⚠️ **بلا خلفية ولا خطّ فاصل ولا التصاقٍ بالأعلى**: تجلس على أرضية
 *    الصفحة وتمرّ معها. (شفّاف + `sticky` = المحتوى يظهر من خلفها،
 *    والتنقّل الدائم مكانه القائمة السفلية.)
 */
export default async function Header() {
  const t = await getTranslations("header");

  const store = await mergedSite();
  const hLocale = await getLocale();

  return (
    <header className="relative z-30">
      <div className="hdr page-w">
        <Link href="/" className="row gr">
          <span className="mk">
            <Logo bare />
          </span>
          <span className="bn">
            <b className="truncate">{store.brand || t("brand")}</b>
            <i className="truncate">{store.taglineOf(hLocale) || t("tagline")}</i>
          </span>
        </Link>

        {/* 🖥️ أقسام المتجر في الهيدر — على اللابتوب وحده (٠٧-٠٨).
            يظهر حين يختفي الشريط السفلي عند الحدّ نفسه، فلا تبقى شاشةٌ
            بلا تنقّلٍ ولا شاشةٌ بتنقّلَين. */}
        <TopNav />

        {/* السلّة بجانب زرّ القائمة — بطلب صاحبة المشروع: عدّاد المشتريات
            مرئيّ في كل صفحة بلا فتح القائمة. والحساب يبقى داخل القائمة. */}
        <span className="hi">
          <CartButton />
          <MenuDrawer phone={store.whatsapp} />
        </span>
      </div>

      {/* حالة المتجر وسرعته — أوّل ما يسأل عنه الغريب، في كل صفحة */}
      <OpenBar />
    </header>
  );
}
