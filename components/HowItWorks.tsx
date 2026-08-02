import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { howItWorks } from "@/lib/content";
import { readTexts, tx } from "@/lib/overrides";
/**
 * "كيف يعمل المتجر" — شارة علوية، عنوان، شرح، فيديو اختياري، ثم ثلاث خطوات.
 * الفيديو يظهر فقط عند وضع `youtubeId` في lib/content.ts، فلا تبقى فجوة فارغة.
 */
export default async function HowItWorks() {
  const t = await getTranslations("how");
  const locale = await getLocale();
  // نصوص اللوحة تعلو الترجمات — والفارغ يُبقي الأصل
  const d = await readTexts("how");
  const { steps } = howItWorks;
  const youtubeId = tx(d, "youtubeId", locale, howItWorks.youtubeId ?? "");

  return (
    <section className="flex flex-col gap-4">
      <p className="eyebrow">{tx(d, "badge", locale, t("badge"))}</p>
      <h2 className="text-2xl font-bold leading-tight">{tx(d, "title", locale, t("title"))}</h2>
      <p className="max-w-prose text-muted">{tx(d, "note", locale, t("note"))}</p>

      {youtubeId && (
        <div className="w-full overflow-hidden rounded-card border border-line bg-navy shadow-sm">
          {/* نسبة 16:9 ثابتة حتى لا يقفز التخطيط أثناء التحميل */}
          <div className="relative aspect-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
              title={t("title")}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 size-full"
            />
          </div>
        </div>
      )}

      {/* خطوات مرقّمة — الترقيم هنا يعني تسلسلاً حقيقياً لا زينة */}
      <ol className="flex flex-col gap-2.5">
        {steps.map((k, i) => (
          <li
            key={k}
            className="flex items-start gap-3.5 rounded-card border border-line bg-surface p-4"
          >
            <span
              aria-hidden
              className="num flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-surface2 font-bold text-orange"
            >
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block font-bold">{tx(d, `steps.${k}.title`, locale, t(`steps.${k}.title`))}</span>
              <span className="mt-0.5 block text-sm text-muted">
                {tx(d, `steps.${k}.note`, locale, t(`steps.${k}.note`))}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
