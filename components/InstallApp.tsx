"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Logo from "./Logo";
import { IconClose, IconDownload, IconShare } from "./icons";

/**
 * **تطبيق eRamaan** — دعوةُ الزبون إلى تنزيل الموقع كتطبيق.
 *
 * الموقع صار تطبيقاً حقيقياً (`app/manifest.ts` و`public/sw.js`): أيقونةٌ
 * على شاشة الجهاز، يفتح بلا شريط عنوانٍ ولا أزرار متصفّح. وهذه البطاقة
 * هي التي **تقول للزبون إن ذلك ممكن** — وبلا قولٍ لا يعرفه أحد.
 *
 * ⚠️ **وطريقان لا طريق**، لأن الجهازين يختلفان اختلافاً تامّاً:
 *
 * | | |
 * |---|---|
 * | أندرويد | المتصفّح نفسه يعطينا زرّ تثبيتٍ حقيقياً (`beforeinstallprompt`) |
 * | آيفون وآيباد | لا زرّ ولا حدث — سفاري يشترط أن يفعلها الزبون بيده، فنُريه أين |
 *
 * ⚠️ **ولا تظهر لمن ثبّته**: من فتح التطبيق من أيقونته يرى شاشةً بلا
 *    شريط عنوان (`display-mode: standalone`) — ودعوتُه إلى تنزيل ما هو
 *    فيه تجعل المتجر يبدو أعمى.
 *
 * ⚠️ **و«لاحقاً» تعني أسبوعين لا للأبد**: من رفض اليوم قد يقبل بعد
 *    شرائه الثالث. ومن رفض ثم رآها في كل زيارةٍ يكرهها ويكره المتجر معها.
 */

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

const KEY = "install:hide";
const HIDE_MS = 14 * 24 * 60 * 60 * 1000;

export default function InstallApp() {
  const t = useTranslations("install");

  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  /** مخفيّةٌ حتى يثبت العكس — فلا تومض بطاقةٌ ثم تختفي */
  const [hidden, setHidden] = useState(true);

  const hide = useCallback((remember: boolean) => {
    setHidden(true);
    if (!remember) return;
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {}
  }, []);

  useEffect(() => {
    /* ① مثبّتٌ أصلاً؟ لا دعوة */
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    /* ② رفضها قريباً؟ لا نُلحّ */
    try {
      const at = Number(localStorage.getItem(KEY) ?? 0);
      if (at && Date.now() - at < HIDE_MS) return;
    } catch {}

    /* ③ آيفون وآيباد: سفاري وحده يعرف «إضافة إلى الشاشة الرئيسية».
       وأيباد الحديث يقول عن نفسه «Macintosh»، فيُعرف باللمس. */
    const ua = navigator.userAgent;
    const apple =
      /iPad|iPhone|iPod/.test(ua) ||
      (ua.includes("Macintosh") && "ontouchend" in document);
    if (apple && !/CriOS|FxiOS|EdgiOS/.test(ua)) {
      setIos(true);
      setHidden(false);
    }

    /* ④ أندرويد: نمسك زرّ المتصفّح ونؤجّله إلى زرّنا نحن */
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
      setIos(false);
      setHidden(false);
    };
    const onInstalled = () => hide(true);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [hide]);

  if (hidden) return null;

  async function install() {
    if (!evt) return;
    await evt.prompt().catch(() => {});
    /* ⚠️ لا نسأل عن جوابه: رفضَ أم قبل، الزرّ لا يُستعمل مرّتين — ومن
       رفض تعود الدعوة بعد أسبوعين كغيره. */
    setEvt(null);
    hide(true);
  }

  return (
    <section className="page-w px-4 pb-1 pt-4">
      {/**
       * ⚠️ **صفّان لا صفّ واحد** (٠٣-٠٨): كان الشعار والنصّ والزرّ وزرّ
       *    الإغلاق في سطرٍ واحد، وكلّها ثابتةُ العرض إلا النصّ — فبقي له
       *    نحو مئة بكسل على شاشة ٣٩٠، فالتفّ العنوان ثلاثة أسطر وانقصّ
       *    زرّ التثبيت عند الحافة. الآن: السطر الأعلى للتعريف، وزرُّ
       *    التثبيت تحته بعرض البطاقة — أظهرُ وأسهلُ في الإصابة.
       */}
      <div className="lift flex flex-col gap-2.5 rounded-card border border-orange/35 bg-orange/5 p-3">
        <div className="flex items-center gap-3">
          <Logo solid className="size-11 shrink-0 rounded-[14px]" />

          <span className="min-w-0 flex-1">
            <span className="block font-bold leading-tight">{t("title")}</span>
            <span className="block text-sm leading-tight text-muted">
              {ios ? t("ios") : t("note")}
            </span>
          </span>

          {/* آيفون: لا زرّ — الخطوة بيد الزبون في قائمة سفاري، وزرٌّ لا يفعل
              شيئاً أسوأ من لا زرّ. وأيقونة المشاركة نفسها تدلّ على الطريق. */}
          {ios && <IconShare className="size-6 shrink-0 text-orange" />}

          <button
            type="button"
            onClick={() => hide(true)}
            aria-label={t("later")}
            className="flex size-11 shrink-0 items-center justify-center rounded-card text-muted"
          >
            <IconClose className="size-4" />
          </button>
        </div>

        {/* أندرويد وحده: زرٌّ يفتح نافذة التثبيت فعلاً */}
        {!ios && (
          <button
            type="button"
            onClick={install}
            className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-card bg-orange px-3.5 font-bold text-onaccent"
          >
            <IconDownload className="size-4" />
            {t("button")}
          </button>
        )}
      </div>
    </section>
  );
}
