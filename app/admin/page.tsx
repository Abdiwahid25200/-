import AdminGate from "@/components/admin/AdminGate";
import AdminTabs from "@/components/admin/AdminTabs";
import Logo from "@/components/Logo";

export default function AdminPage() {
  return (
    <AdminGate>
      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
        <header className="flex items-center gap-3">
          <Logo solid className="size-11 shrink-0 rounded-[13px] shadow-sm" />
          <div className="min-w-0 flex-1 leading-tight">
            <h1 className="text-xl font-bold">لوحة رمان</h1>
            <p className="text-sm text-muted">تحكّمي بمتجرك من هنا</p>
          </div>
        </header>

        <AdminTabs />
      </main>
    </AdminGate>
  );
}
