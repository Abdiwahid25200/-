import AdminGate from "@/components/admin/AdminGate";
import AdminTabs from "@/components/admin/AdminTabs";

export default function AdminPage() {
  return (
    <AdminGate>
      {/* ⚠️ بلا حشوة سفلية: شريط التبويبات الأربعة يجلس على حافة الشاشة،
          و`min-h-dvh` مع عمودٍ مرن هو ما ينزله إلى الأسفل في الصفحة القصيرة */}
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pt-4">
        <AdminTabs />
      </main>
    </AdminGate>
  );
}
