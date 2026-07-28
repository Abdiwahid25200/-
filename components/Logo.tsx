/**
 * شعار Ramaan Store — حقيبة تسوّق بموجات إشارة.
 *
 * نفس الشعار الذي أرسلته صاحبة المشروع، معاد تلوينه بهوية "Coast":
 * الحقيبة والانحناءة بالأخضر المائي (لون العلامة)، وموجات الإشارة
 * بالذهب الرملي (لون المال في الموقع) بدل الأزرق والرمادي.
 *
 * الألوان من متغيّرات الهوية لا ثوابت، فيتبدّل الشعار مع الوضع الليلي وحده.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden>
      <rect width="100" height="100" rx="22" fill="var(--surface-2)" />

      {/* جسم الحقيبة */}
      <path
        d="M25 32h50a5 5 0 0 1 5 5.4l-3.6 40A7 7 0 0 1 69.4 84H30.6a7 7 0 0 1-7-6.6L20 37.4A5 5 0 0 1 25 32z"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="5.5"
      />
      {/* المقبض */}
      <path
        d="M38 32v-6a12 12 0 0 1 24 0v6"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* الانحناءة — خطّ الساحل */}
      <path
        d="M24 82c14-2 30-12 44-32"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* موجات الإشارة */}
      <path
        d="M34 51.5a21 21 0 0 1 30 0"
        fill="none"
        stroke="var(--accent-2)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M41 60a12 12 0 0 1 16 0"
        fill="none"
        stroke="var(--accent-2)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="49" cy="69" r="4" fill="var(--accent-2)" />
    </svg>
  );
}
