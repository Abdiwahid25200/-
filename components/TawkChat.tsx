"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { tawk } from "@/lib/content";
import { useAuth } from "@/lib/auth";

/**
 * 💬 **دردشة tawk.to** — قرارها (٠٣-٠٨): تحلّ محلّ دردشتنا المدمجة.
 *
 * **ولماذا بدّلتها**: دردشتنا تعيش في Firestore، فلا تعرف صاحبةُ المتجر
 * أنّ زبوناً كتب إلا إذا فتحت اللوحة. وtawk.to له **تطبيقٌ على جوّالها
 * يرنّ عند كل رسالة** — وهذا هو الفرق الذي يجعل الردّ في دقائق لا في
 * ساعات. وما دام الردّ هو الخدمة، فالأداة التي توقظها أولى.
 *
 * ⚠️ **ويُحمّل بعد أن تُرسم الصفحة** (`lazyOnload`): سكربتٌ خارجيّ في
 *    أوّل الطريق يؤخّر ظهور المتجر نفسه، والدردشة تُطلب بعد النظر لا قبله.
 *
 * ⚠️ **ويُرفع عن القائمة السفلية** (`yOffset`): زرّ tawk يجلس أسفل
 *    اليمين افتراضياً — وهناك بالضبط شريطُ التنقّل (ارتفاعه ٧٣). فيُرفع
 *    ٨٤ ليعلوه بفارقٍ يُرى، ويبقى تحت حشوة الصفحة السفلية فلا يغطّي سطراً.
 *
 * ⚠️ **ولا يظهر في لوحة الإدارة**: هذا المكوّن في تخطيط `[locale]`
 *    وحده، واللوحة خارجه — فلا تُطارد صاحبةَ المتجر نافذةُ دردشةٍ وهي
 *    تشحن الطلبات.
 *
 * 🔧 **وإطفاؤه سطرٌ واحد**: `tawk` في `lib/content.ts` ⇐ فراغ، فتعود
 *    الدردشة المدمجة (`LiveChat`) كما كانت — لم تُحذف.
 */
export default function TawkChat() {
  const { user } = useAuth();

  /**
   * 👤 **من يكلّمك؟** — قرارها (٠٣-٠٨): «أرسل بياناتهم».
   *
   * بلا هذا تصلها المحادثات باسم «Visitor 4821»، فلا تعرف صاحبَ الطلب
   * ولا تربط كلامه بطلبٍ في لوحتها. ومع الاسم والبريد تفتح المحادثة
   * فتعرف من تخاطب من أوّل سطر.
   *
   * ⚠️ **ويعمل قبل تحميل الودجت وبعده**: `Tawk_API` كائنٌ يُنشئه
   *    السكربت بـ`Tawk_API || {}`، فما نكتبه فيه قبل وصوله يبقى ويُقرأ
   *    عند التحميل. ومن دخل بعد التحميل تصله البيانات بـ`setAttributes`.
   *
   * ⚠️ **والزائر غير المسجّل لا يُرسَل عنه شيء** — لا اسم فارغ ولا بريد.
   */
  useEffect(() => {
    if (!tawk || typeof window === "undefined") return;
    const name = user?.displayName ?? "";
    const email = user?.email ?? "";
    if (!name && !email) return;

    const w = window as unknown as {
      Tawk_API?: {
        visitor?: Record<string, string>;
        setAttributes?: (a: Record<string, string>, cb: () => void) => void;
      };
    };
    w.Tawk_API = w.Tawk_API ?? {};
    w.Tawk_API.visitor = { name, email };
    w.Tawk_API.setAttributes?.({ name, email }, () => {});
  }, [user]);

  /**
   * 🐌 **بلاغها (٠٤-٠٨): «تقطيع وتأخير في التطبيق»** — والفرق أن
   *    التطبيق المثبَّت على آيفون يعمل في عمليةٍ مستقلّة بذاكرةٍ أضيق
   *    ومخزنٍ لا يشاركه المتصفّح: فما يحتمله سفاري يثقل عليه.
   *
   * وسكربت tawk أثقل ما في الصفحة وأحدثُه: يجلب ملفّاته وصورَه ويفتح
   * وصلةً دائمة. و`lazyOnload` يؤجّله إلى ما بعد الرسم — **لكنه يقع
   * في الثواني الأولى نفسها التي يتصفّح فيها الزبون**، فيتقطّع التمرير.
   *
   * فصار يُحمَّل عند **أوّل فراغٍ حقيقيّ**: بعد أن يهدأ الجهاز
   * (`requestIdleCallback`)، أو عند أوّل لمسةٍ منه، وبحدٍّ أقصى ست ثوانٍ.
   * فيبقى المتجر وحده في الثواني الأولى، وتأتي الدردشة بعده.
   *
   * ⚠️ **ولا تُنتظر لمسةٌ إلى الأبد**: من فتح الصفحة ينتظر ردّاً قد
   *    يكتب فوراً — فالمهلة سقفٌ لا شرط.
   */
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (!tawk || go) return;
    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      setGo(true);
    };
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    const t = setTimeout(fire, 6000);
    w.requestIdleCallback?.(fire, { timeout: 6000 });
    const opts = { once: true, passive: true } as const;
    window.addEventListener("touchstart", fire, opts);
    window.addEventListener("scroll", fire, opts);
    return () => {
      clearTimeout(t);
      window.removeEventListener("touchstart", fire);
      window.removeEventListener("scroll", fire);
    };
  }, [go]);

  if (!tawk || !go) return null;

  return (
    <Script id="tawk-to" strategy="lazyOnload">{`
      var Tawk_API = Tawk_API || {};

      /* 💬 **موضعُ الزرّ يُحسب لا يُكتب رقماً ثابتاً** — طلبها (٠٧-٠٨):
         «tawk لكل الأجهزة».

         وكان \`xOffset: 16\` و\`yOffset: 84\` ثابتَين، فأخطأ الموضعُ في
         موضعين:

         ① **أفقياً**: زرُّ tawk يقيس من حافة **الشاشة**، والموقع إطارٌ
            في وسطها. فعلى اللابتوب كان الزرّ يجلس في زاوية الشاشة
            بعيداً عن الموقع بمئتَي بكسل — كأنه لطرفٍ ثالث لا لنا.
            (وهذه هي العلّة التي حُلّت في CSS بـ\`.fx-right\`، وtawk
            إطارٌ خارجيّ لا يصله CSS الموقع.)

         ② **رأسياً**: الـ٨٤ ارتفاعُ الشريط السفلي. وحيث لا شريط —
            اللابتوب فوق ١٢٨٠ — يطفو الزرّ على فراغٍ بلا سبب.

         فيُقاس عرضُ الشاشة عند التحميل، ويُحسب الإزاحتان من **حافة
         إطار الموقع** لا من حافة الشاشة. */
      (function () {
        var w = window.innerWidth;
        /* عرض الإطار — نفس نقاط توقّف \`globals.css\` حرفاً بحرف */
        var frame = w >= 1024 ? 960 : w >= 768 ? 720 : 430;
        /* الشريط السفلي قائمٌ دون ١٢٨٠ (والآيباد كلُّه دونه) */
        var overNav = w < 1280;
        var x = Math.max(14, Math.round((w - frame) / 2) + 16);

        Tawk_API.customStyle = {
          visibility: {
            desktop: { position: 'br', xOffset: x, yOffset: overNav ? 84 : 24 },
            mobile:  { position: 'br', xOffset: 12, yOffset: 84 }
          }
        };
      })();
      var Tawk_LoadStart = new Date();
      (function () {
        var s1 = document.createElement("script"),
            s0 = document.getElementsByTagName("script")[0];
        s1.async = true;
        s1.src = 'https://embed.tawk.to/${tawk}';
        s1.charset = 'UTF-8';
        s1.setAttribute('crossorigin', '*');
        s0.parentNode.insertBefore(s1, s0);
      })();
    `}</Script>
  );
}
