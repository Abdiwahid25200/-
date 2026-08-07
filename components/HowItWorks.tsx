import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { howItWorks } from "@/lib/content";
import { isBuyable } from "@/lib/data";
import { readTexts, tx } from "@/lib/overrides";
import { mergedPay } from "@/lib/payments";
import { youtubeId } from "@/lib/video";
import VideoCard from "@/components/VideoCard";
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
  /* ⚠️ **رابطاً كان أو رمزاً** — طلبها (٠٧-٠٨). و`youtubeId()` تقرأ
     الاثنين، فلا تُطالَب باقتطاع أحدَ عشرَ محرفاً من وسط رابط. */
  const videoId = youtubeId(tx(d, "youtubeId", locale, howItWorks.youtubeId ?? ""));

  /**
   * 💳 **«ادفع بأمان» يقول طرقَ دفعها هي** — قرارها (٠٤-٠٨).
   *
   * كان السطر نصّاً ثابتاً في الترجمات: «بطاقة أو PayPal أو USDT أو
   * تحويل محلي» — **وعدٌ لا يقابله شيء**. فمن قرأه ومشى إلى الدفع لم
   * يجد PayPal ولا USDT، ووعدٌ يُخلف في الخطوة التالية أسوأ من ألّا
   * يُقال. فصار يُبنى من الطرق **المفعَّلة فعلاً** في لوحتها: تفعّل
   * طريقةً فتظهر هنا، وتُطفئها فتختفي — بلا لمس هذا الملف.
   *
   * ⚠️ **والمفعَّلة وحدها** (`isBuyable`): ما وُسم «قريباً» لا يُعدّ
   *    وسيلةَ دفعٍ اليوم.
   * ⚠️ **وأربعةٌ بحدٍّ أقصى ثمّ «+٣»**: السطر تحت العنوان صغير، وعشرة
   *    أسماءٍ فيه تلتفّ ثلاثة أسطر فتُغرق الخطوة التي تشرحها.
   * ⚠️ **وبلا طريقةٍ واحدة يُحذف السطر** ولا يُستبدل بوعدٍ عام: المتجر
   *    لا يستقبل دفعاً أصلاً حتى تُفعَّل واحدة، فالصمت أصدق.
   */
  const methods = (await mergedPay()).filter(isBuyable);
  const names = methods.map((m) =>
    (locale === "ar" ? m.nameAr : m.nameEn) || m.nameEn || m.id,
  );
  const shown = names.slice(0, 4);
  const extra = names.length - shown.length;

  /**
   * ⚠️ **كل اسمٍ داخل `bdi`** — ولولاها لَظهر «EVC+» في العربية
   *    **«+EVC»**: السطر عربيّ الاتجاه، و«+» محرفٌ محايد فينجرف إلى
   *    يسار الكلمة. و`bdi` تعزل كل اسمٍ باتجاهه هو، فيُقرأ اسمُ الطريقة
   *    كما كتبته صاحبته — عربياً كان أو لاتينياً — في اللغات الثلاث.
   */
  const payNode = names.length ? (
    <>
      {shown.map((n, i) => (
        <span key={`${n}-${i}`}>
          {i > 0 ? " · " : ""}
          <bdi>{n}</bdi>
        </span>
      ))}
      {extra > 0 ? <bdi>{` +${extra}`}</bdi> : null}
    </>
  ) : null;

  /** نصّها المكتوب في اللوحة يعلو كلَّ شيء · ثمّ الطرق · ثمّ الترجمة */
  function noteOf(k: string): React.ReactNode {
    const manual = tx(d, `steps.${k}.note`, locale, "");
    if (manual) return manual;
    if (k === "pay") return payNode;
    return t(`steps.${k}.note`);
  }

  return (
    <section className="flex flex-col gap-4">
      {videoId && (
        <VideoCard
          id={videoId}
          eyebrow={tx(d, "videoEyebrow", locale, t("videoEyebrow"))}
          title={tx(d, "videoTitle", locale, t("videoTitle"))}
          play={t("videoPlay")}
        />
      )}

      {/* ⚠️ **الخطوات الثلاث في بطاقةٍ واحدة** كما في النموذج، لا ثلاث
          بطاقاتٍ متجاورة: هي شيءٌ واحد يُقرأ من أوّله إلى آخره، وثلاثة
          إطاراتٍ تقطعه ثلاثاً وتُطيل الصفحة بشاشةٍ بلا أن تزيد خبراً.
          والترقيم هنا تسلسلٌ حقيقيّ لا زينة. */}
      <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
        <h2 className="text-sm font-bold">{tx(d, "title", locale, t("title"))}</h2>
        <ol className="flex flex-col gap-3">
          {steps.map((k, i) => {
            const note = noteOf(k);
            return (
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
                {note && (
                  <span className="mt-0.5 block text-xs text-muted">{note}</span>
                )}
              </span>
            </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
