import AdminGate from "@/components/admin/AdminGate";
import AdminTabs from "@/components/admin/AdminTabs";

export default function AdminPage() {
  return (
    <AdminGate>
      {/* ⚠️ بلا حشوة سفلية: شريط التبويبات الأربعة يجلس على حافة الشاشة،
          و`min-h-dvh` مع عمودٍ مرن هو ما ينزله إلى الأسفل في الصفحة القصيرة */}
      {/**
       * 💻 **«بدي الإدارة لكل الأجهزة»** — طلبها (٠٤-٠٨).
       *
       * كانت عموداً بعرض الجوّال (`max-w-2xl`) يتوسّط شاشةَ اللابتوب،
       * وحولَه فراغٌ لا يُستعمل — وشريطُ التبويبات ملتصقٌ بأسفل الشاشة
       * كما في الجوّال، فتنزل يدُها إلى قاع شاشةٍ عرضها ثلاثون بوصة
       * لتبدّل تبويباً.
       *
       * فعلى الشاشات الكبيرة (`lg` فأكثر): **الشريط عمودٌ جانبيّ ثابت**
       * والمحتوى بجانبه، والعرض يتّسع. وعلى الجوّال لا يتغيّر حرف —
       * وهو ما تعمل عليه اليوم.
       */}
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pt-4 lg:max-w-5xl lg:flex-row-reverse lg:items-start lg:gap-6 lg:pt-6">
        <AdminTabs />
      </main>
    </AdminGate>
  );
}
