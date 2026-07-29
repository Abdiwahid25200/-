import AdminGate from "@/components/admin/AdminGate";
import AdminTabs from "@/components/admin/AdminTabs";
import Logo from "@/components/Logo";
import AdminSignOut from "@/components/admin/AdminSignOut";

export default function AdminPage() {
  return (
    <AdminGate>
      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
        <header className="flex items-center gap-3">
          <Logo solid className="size-11 shrink-0 rounded-[13px] shadow-sm" />
          <div className="min-w-0 flex-1 leading-tight">
            <h1 className="text-xl font-bold">إدارة رمان</h1>
            <p className="text-sm text-muted">الأقسام · الصور · النصوص</p>
          </div>
          <a
            href="https://eramaan.com"
            className="min-h-11 shrink-0 rounded-card border border-line px-3.5 text-sm font-medium leading-[2.75rem] text-muted"
          >
            المتجر ←
          </a>
          <AdminSignOut />
        </header>

        <p className="rounded-card border border-dashed border-line p-3 text-sm text-muted">
          ما تحفظينه هنا <strong>يعلو</strong> الإعدادات الأصلية ولا يمحوها.
          امسحي أي حقل ليعود الأصل كما كان.
        </p>

        <AdminTabs />
      </main>
    </AdminGate>
  );
}
