import SectionIcon, { type SectionIconKey } from "./SectionIcon";

/**
 * ترويسة القسم العريضة — على مثال Midasbuy، وبهوية Coast.
 *
 * ⚠️ لم أستعمل صور الألعاب: فنّ ببجي وeFootball مملوك لأصحابه، ووضعه على
 *    متجر تجاري يفتح باب مطالبات. والبديل ليس تدرّجاً باهتاً، بل **خلفية
 *    تُرسم بالكود** من ألوان العلامة:
 *
 *    ① طبقة عمق (`--deep`) أساساً
 *    ② هالتان مضيئتان بلونَي العلامة — موضعهما يتغيّر مع `variant`،
 *      فلكل قسم توقيعه البصري ولا يتكرّر شكل واحد أربع مرّات
 *    ③ شبكة دوائر خفيفة = حوافّ عملات، وهي لغة الموقع أصلاً
 *    ④ لمعة قطرية تعطي إحساس المعدن
 *
 * ومتى رفعت صاحبة المتجر صورة للقسم (`img`) حلّت محلّ الطبقات الثلاث
 * وبقي التعتيم فوقها ليُقرأ النص — فلا ينكسر شيء في الحالتين.
 */

/**
 * توقيع كل قسم: موضع الهالتين **واللون المسيطر**.
 * الموضع وحده لا يكفي — قسمان بلونٍ واحد يبدوان توأمين. فالشدات ذهبية
 * (لون العملة)، وeFootball بأخضر الملعب، وتيك توك بتقابل حادّ بينهما.
 */
const GLOWS = [
  // ٠ · شدات ببجي — الذهب يسيطر، لون العملة نفسه
  { a: "16% 26%", b: "90% 74%", c1: "var(--accent-2)", c2: "var(--accent)", s1: 78, s2: 46 },
  // ١ · كوينز eFootball — الأخضر المائي يسيطر
  { a: "84% 20%", b: "10% 84%", c1: "var(--accent)", c2: "var(--accent-2)", s1: 76, s2: 44 },
  // ٢ · حسابات تيك توك — تقابل حادّ: ذهب أعلى وأخضر أسفل
  { a: "50% 2%", b: "50% 106%", c1: "var(--accent-2)", c2: "var(--accent)", s1: 68, s2: 62 },
  // ٣ · حسابات eFootball — قطري معاكس للقسم ①
  { a: "10% 72%", b: "94% 24%", c1: "var(--accent)", c2: "var(--accent-2)", s1: 74, s2: 50 },
] as const;

export default function SectionHero({
  eyebrow,
  title,
  note,
  icon,
  img,
  badge,
  variant = 0,
  children,
}: {
  eyebrow?: string;
  title: string;
  note?: string;
  icon: SectionIconKey;
  /** صورة القسم متى رُفعت — تحلّ محلّ الخلفية المرسومة */
  img?: string;
  /** وسم صغير بجانب الاسم: فوري · يدوي */
  badge?: string;
  /** 0..3 — يغيّر موضع الهالات فيختلف توقيع كل قسم */
  variant?: 0 | 1 | 2 | 3;
  /** زرّ أو أي عنصر يظهر أسفل الاسم */
  children?: React.ReactNode;
}) {
  const g = GLOWS[variant];
  const pid = `coins-${variant}`;

  return (
    <header className="relative isolate overflow-hidden rounded-[22px] bg-navy text-white shadow-sm">
      {/* ── الخلفية ── */}
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <>
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              // هالات واسعة تصل أطراف اللوح — الضيّقة تترك نصف الترويسة
              // كحلاً باهتاً، فيضيع اللون الذي يميّز القسم
              background: `radial-gradient(95% 135% at ${g.a}, color-mix(in srgb, ${g.c1} ${g.s1}%, transparent), transparent 76%),
                           radial-gradient(90% 125% at ${g.b}, color-mix(in srgb, ${g.c2} ${g.s2}%, transparent), transparent 78%)`,
            }}
          />
          {/* حوافّ عملات — نفس لغة "وجه العملة" في بلاطات الأقسام */}
          <svg
            aria-hidden
            className="absolute inset-0 size-full text-white opacity-[0.13]"
            style={{ transform: `rotate(${variant * 15 - 20}deg) scale(1.6)` }}
          >
            <defs>
              <pattern id={pid} width="46" height="46" patternUnits="userSpaceOnUse">
                <circle cx="23" cy="23" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="23" cy="23" r="6" fill="none" stroke="currentColor" strokeWidth="0.7" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${pid})`} />
          </svg>
          {/* لمعة قطرية — إحساس المعدن */}
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/12 to-transparent"
          />
        </>
      )}

      {/* تعتيم يضمن قراءة النص فوق أي خلفية، مرسومة كانت أو مرفوعة */}
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/12 to-transparent"
      />

      {/* ── المحتوى ── */}
      <div className="relative flex flex-col gap-3 p-5 sm:p-7">
        <div className="flex items-center gap-3.5">
          {/* صفيحة القسم — مربّع مدوّر كأيقونة لعبة */}
          <span
            aria-hidden
            className="flex size-16 shrink-0 items-center justify-center rounded-[18px] border border-white/25 bg-white/12 backdrop-blur-sm sm:size-[4.5rem]"
          >
            <SectionIcon name={icon} className="size-9 sm:size-10" />
          </span>

          <span className="min-w-0 flex-1">
            {eyebrow && (
              <span className="block text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/70 rtl:tracking-normal">
                {eyebrow}
              </span>
            )}
            <span className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{title}</h1>
              {badge && (
                <span className="rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs font-bold">
                  {badge}
                </span>
              )}
            </span>
          </span>
        </div>

        {note && <p className="max-w-prose text-sm text-white/80">{note}</p>}

        {children}
      </div>
    </header>
  );
}
