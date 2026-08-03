import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { howItWorks } from "@/lib/content";
import { readTexts, tx } from "@/lib/overrides";
/**
 * "كيف يعمل المتجر" — **بطاقةٌ بعنوانٍ صغير** وفيها الخطوات الثلاث، كما في النموذج.
 * الفيديو يظهر فقط عند وضع `youtubeId` في lib/content.ts، فلا تبقى فجوة فارغة.
 *
 * ⚠️ **لا وسمَ ولا عنوانَ صفحةٍ ولا فقرةَ شرح**: صفحة الدعم ترويسةٌ واحدة
 *    («المساعدة») وتحتها بطاقات. وكانت هذه الكتلة تحمل ترويسةً كاملة بحجم
 *    ترويسة الصفحة، فصارت الشاشة أربع ترويسات تتنافس على العين — والنموذج
 *    يجعل عنوان الكتلة سطراً صغيراً غامقاً داخل البطاقة نفسها.
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
      <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
        <h2 className="text-sm font-bold">{tx(d, "title", locale, t("title"))}</h2>
        <ol className="flex flex-col gap-3">
          {steps.map((k, i) => (
            <li key={k} className="flex items-start gap-3">
              <span
                aria-hidden
                className="num flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-orange/10 text-sm font-bold text-orange"
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">
                  {tx(d, `steps.${k}.title`, locale, t(`steps.${k}.title`))}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {tx(d, `steps.${k}.note`, locale, t(`steps.${k}.note`))}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
