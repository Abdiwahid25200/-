import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { store } from "@/lib/data";

/** شريط تواصل علوي رفيع — يظهر فقط عند تعبئة بيانات التواصل */
export default async function TopBar() {
  const t = await getTranslations("topbar");
  if (!store.phone && !store.email) return null;

  return (
    <div className="bg-navy text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-1.5 text-[0.8rem]">
        {store.phone && (
          <a href={`tel:${store.phone}`} className="flex items-center gap-1.5">
            <span aria-hidden>📞</span>
            <span dir="ltr">{store.phone}</span>
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
