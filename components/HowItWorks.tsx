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

      {/* ⚠️ **الخطوات الثلاث في بطاقةٍ واحدة** كما في النموذج، لا ثلاث
          بطاقاتٍ متجاورة: هي شيءٌ واحد يُقرأ من أوّله إلى آخره، وثلاثة
          إطاراتٍ تقطعه ثلاثاً وتُطيل الصفحة بشاشةٍ بلا أن تزيد خبراً.
          والترقيم هنا تسلسلٌ حقيقيّ لا زينة. */}
      <ol className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
        {steps.map((k, i) => (
          <li key={k} className="flex items-start gap-3">
            <span
              aria-hidden
              className="num flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-orange/10 text-sm font-bold text-orange"
            >
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{tx(d, `steps.${k}.title`, locale, t(`steps.${k}.title`))}</span>
              <span className="mt-0.5 block text-xs text-muted">
                {tx(d, `steps.${k}.note`, locale, t(`steps.${k}.note`))}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
