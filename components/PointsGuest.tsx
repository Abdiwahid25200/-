"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import PointsBrand from "./PointsBrand";
import { DEFAULT_POINTS, readPointsSettings, type PointsSettings } from "@/lib/points";

/**
 * 🐞 **صفحة بَرْواقو كانت بيضاء لمن لم يسجّل دخوله** — عطلٌ وجدتُه في
 *    الفحص (٠٤-٠٨).
 *
 * `PointsCard` و`ReferralCard` كلتاهما تختفيان بلا حساب، فلا يبقى في
 * الصفحة إلا كلمة «رجوع». **وهي تبويبٌ في القائمة السفلية داخل
 * التطبيق**: يضغطها الزبون فيجد صفحةً فارغة، فيظنّ التطبيق مكسوراً
 * ويخرج — ولا يعرف أن للمتجر برنامج نقاطٍ أصلاً.
 *
 * وهذه الشاشة تقلب الفراغ دعوةً: تقول ما هو البرنامج، وكم يُكسب منه،
 * وتضع زرّ الدخول تحته مباشرة.
 *
 * ⚠️ **ولا تظهر لمن دخل** (`user`) — فتحلّ محلّها بطاقتُه ورصيدُه.
 * ⚠️ **ولا تظهر إن أُطفئ البرنامج** من اللوحة (`settings.on`): صفحةٌ
 *    تدعو إلى برنامجٍ مغلق أسوأ من صفحةٍ فارغة.
 * ⚠️ **ولا شيء قبل انتهاء فحص الدخول** (`ready`) — وإلّا ومض «سجّل
 *    دخولك» في وجه من هو داخلٌ أصلاً.
 */
export default function PointsGuest({ settings: given }: { settings?: PointsSettings }) {
  const t = useTranslations("points");
  const { user, ready } = useAuth();
  /**
   * ⚠️ **تبدأ بالافتراضيّ لا بالفراغ**: قراءة الإعدادات تمرّ بالشبكة،
   *    وبدايةٌ فارغة تعني صفحةً بيضاء ثانيةً حتى تصل — وهي بالضبط
   *    العلّة التي نصلحها. فتظهر الدعوة فوراً باسم البرنامج وشعاره،
   *    ثم يصحّحهما ما يصل من اللوحة.
   */
  const [loaded, setLoaded] = useState<PointsSettings>(DEFAULT_POINTS);
  const settings = given ?? loaded;

  /* ⚠️ **ولا تُقرأ حين تصل من الخادم**: الصفحة تقرؤها مرّةً وتمرّرها،
     فلا ثلاث قراءاتٍ لوثيقةٍ واحدة في متصفّح الزبون (بلاغ التقطيع). */
  useEffect(() => {
    if (given) return;
    let alive = true;
    void readPointsSettings()
      .then((s) => alive && setLoaded(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [given]);

  if (!ready || user || !settings.on) return null;

  return (
    <section className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface p-5 text-center">
      <PointsBrand settings={settings} size={56} showName={false} />

      <h1 className="text-lg font-bold">{settings.brand}</h1>
      <p className="text-sm text-muted">{t("guestNote")}</p>

      {/* ثلاثة أسطرٍ تقول ما يربحه — لا فقرةٌ تُقرأ ولا تُحفظ */}
      <ul className="flex w-full flex-col gap-2 text-start text-sm">
        {["guestEarn", "guestSpend", "guestSend"].map((k) => (
          <li key={k} className="flex items-start gap-2.5 rounded-card bg-bg p-3">
            <span
              aria-hidden
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange"
            />
            <span className="min-w-0">{t(k)}</span>
          </li>
        ))}
      </ul>

      {/* ⚠️ زرٌّ واحد لا زرّان: من فتح هذه الصفحة يريد الدخول، ولا يُقسَّم
          انتباهه بين «الدخول» و«تصفّح المتجر» — والقائمة السفلية أمامه. */}
      <Link
        href="/login"
        className="lift flex min-h-12 w-full items-center justify-center rounded-card bg-orange font-bold text-onaccent"
      >
        {t("guestCta")}
      </Link>
    </section>
  );
}
