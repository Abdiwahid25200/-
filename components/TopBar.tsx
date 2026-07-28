import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site as store } from "@/lib/content";

/** شريط تواصل علوي رفيع — يظهر فقط عند تعبئة بيانات التواصل */
export default async function TopBar() {
  const t = await getTranslations("topbar");
  if (!store.whatsapp && !store.email) return null;

  return (
    <div className="bg-navy text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-1.5 text-[0.8rem]">
        {store.whatsapp && (
          <a href={`tel:${store.whatsapp}`} className="flex items-center gap-1.5">
            <span aria-hidden>📞</span>
            <span dir="ltr">{store.whatsapp}</span>
          </a>
        )}
        {store.email && (
          <a href={`mailto:${store.email}`} className="flex items-center gap-1.5">
            <span aria-hidden>✉️</span>
            <span dir="ltr">{store.email}</span>
          </a>
        )}
        <Link href="/help" className="ms-auto font-medium">
          {t("help")}
        </Link>
      </div>
    </div>
  );
}
