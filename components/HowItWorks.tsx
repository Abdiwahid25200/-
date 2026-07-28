import { getTranslations } from "next-intl/server";
import { howItWorks } from "@/lib/content";
import { IconBolt, IconCart, IconShieldCheck } from "@/components/icons";

const STEP_ICONS = {
  choose: IconCart,
  pay: IconShieldCheck,
  receive: IconBolt,
} as const;

/**
 * "كيف يعمل المتجر" — شارة علوية، عنوان، شرح، فيديو اختياري، ثم ثلاث خطوات.
 * الفيديو يظهر فقط عند وضع `youtubeId` في lib/content.ts، فلا تبقى فجوة فارغة.
 */
export default async function HowItWorks() {
  const t = await getTranslations("how");
  const { youtubeId, steps } = howItWorks;

  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <span className="rounded-full border border-orange/40 bg-orange/8 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange">
        {t("badge")}
      </span>

      <h2 className="text-2xl font-bold leading-tight">{t("title")}</h2>
      <p className="max-w-xl text-muted">{t("note")}</p>

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

      <ol className="mt-2 grid w-full gap-3 sm:grid-cols-3">
        {steps.map((k, i) => {
          const Icon = STEP_ICONS[k];
          return (
            <li
              key={k}
              className="relative flex flex-col items-center gap-2 rounded-card border border-line bg-surface p-5"
            >
              <span
                aria-hidden
                className="absolute end-3 top-2 text-3xl font-black text-line"
                dir="ltr"
              >
                {i + 1}
              </span>
              <span
                aria-hidden
                className="flex size-12 items-center justify-center rounded-card bg-orange text-white"
              >
                <Icon className="size-6" />
              </span>
              <span className="font-bold">{t(`steps.${k}.title`)}</span>
              <span className="text-sm text-muted">{t(`steps.${k}.note`)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
