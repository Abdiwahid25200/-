"use client";

import { useEffect } from "react";
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
