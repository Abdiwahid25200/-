import { getTranslations } from "next-intl/server";
import { partners } from "@/lib/data";

/** شركاء الدفع — يبني ثقة الزبون الصومالي بعرض الوسائل المقبولة */
export default async function PayPartners() {
  const t = await getTranslations("partners");

  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h2 className="mb-1 text-center font-bold">{t("title")}</h2>
      <p className="mb-4 text-center text-sm text-muted">{t("note")}</p>

      <div className="flex flex-wrap justify-center gap-2">
        {partners.map((p) => (
          <span
            key={p}
            dir="ltr"
            className="rounded-card border border-line bg-bg px-3.5 py-2 text-sm font-semibold text-muted"
          >
            {p}
          </span>
        ))}
      </div>
    </section>
  );
}
