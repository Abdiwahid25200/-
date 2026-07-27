const checks = [
  { label: "الاتجاه من اليمين لليسار (RTL)", note: "النص يبدأ من اليمين" },
  { label: "خط IBM Plex Sans Arabic", note: "الحروف العربية واضحة ومترابطة" },
  { label: "ألوان Clarity", note: "الأزرق والأخضر ظاهران تحت" },
  { label: "الوضع الليلي والنهاري", note: "يتبدّل مع إعدادات جهازك" },
];

const palette = [
  { name: "الأساسي", value: "#3D5AFE", className: "bg-orange" },
  { name: "الثانوي", value: "#00B589", className: "bg-yellow" },
  { name: "الداكن", value: "#0D1424", className: "bg-navy" },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-5 py-12">
      <header className="text-center">
        <span className="inline-block rounded-full bg-yellow/12 px-4 py-1.5 text-sm font-semibold text-yellow">
          المرحلة صفر — مكتملة
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
          Ramaan Store
        </h1>
        <p className="mt-3 text-lg text-muted">
          الموقع الجديد قيد البناء — وخط الإنتاج يشتغل ✅
        </p>
      </header>

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-semibold">تم التحقق من الأساسيات</h2>
        <ul className="space-y-4">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-yellow text-sm font-bold text-white"
              >
                ✓
              </span>
              <span>
                <span className="block font-medium">{c.label}</span>
                <span className="block text-sm text-muted">{c.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-semibold">لوحة الألوان</h2>
        <div className="grid grid-cols-3 gap-4">
          {palette.map((p) => (
            <div key={p.value} className="text-center">
              <div
                className={`${p.className} h-16 w-full rounded-card border border-line`}
              />
              <div className="mt-2 text-sm font-medium">{p.name}</div>
              <div className="text-xs text-muted" dir="ltr">
                {p.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-sm text-muted">
        الخطوة التالية: بناء هيكل الموقع واللغات الثلاث
      </footer>
    </main>
  );
}
