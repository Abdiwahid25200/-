"use client";

import Script from "next/script";
import { tawk } from "@/lib/content";

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
  if (!tawk) return null;

  return (
    <Script id="tawk-to" strategy="lazyOnload">{`
      var Tawk_API = Tawk_API || {};
      Tawk_API.customStyle = {
        visibility: {
          desktop: { position: 'br', xOffset: 16, yOffset: 84 },
          mobile:  { position: 'br', xOffset: 12, yOffset: 84 }
        }
      };
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
