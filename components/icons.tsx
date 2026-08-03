/** أيقونات الموقع — منقولة من الموقع القديم كما هي */

type IconProps = { className?: string };

const base = "size-6 stroke-current fill-none";

export function IconHome({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />
    </svg>
  );
}

export function IconGames({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12h4m-2-2v4m7-1h.01M18 11h.01M7.5 5h9a4.5 4.5 0 0 1 4.47 4L21.5 15a3 3 0 0 1-5.3 2.2L14.6 15H9.4l-1.6 2.2A3 3 0 0 1 2.5 15l.53-6A4.5 4.5 0 0 1 7.5 5z"
      />
    </svg>
  );
}

export function IconUser({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z" />
    </svg>
  );
}

export function IconSupport({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10h8m-8 4h5m-9 6V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 3z"
      />
    </svg>
  );
}

export function IconCart({ className = "" }: IconProps) {
  /* ⚠️ **عربةٌ بعجلتَين كما في النموذج** — لا حقيبة. الحقيبة بلا مقبضٍ
     ظاهر تُقرأ **سلّةَ مهملات** في شريطٍ صغير، وقد قرأتها صاحبة المتجر
     كذلك. والعجلتان تقولان «تسوّق» بلا كلمة. */
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2.2l2.3 10.6h9.6L19 7.2H6.2" />
      <circle cx="9.4" cy="19" r="1.5" />
      <circle cx="16.6" cy="19" r="1.5" />
    </svg>
  );
}

export function IconMenu({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      {/* السطر الثالث أقصر — كما في النموذج، فتُقرأ قائمةً لا شبكةَ خطوط */}
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h11" />
    </svg>
  );
}

export function IconSearch({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" d="m21 21-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
    </svg>
  );
}

export function IconSun({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path
        strokeLinecap="round"
        d="M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17m10-10 1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
      />
    </svg>
  );
}

export function IconMoon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

export function IconAuto({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function IconGlobe({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path
        strokeLinecap="round"
        d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-9c2.5 2.4 3.8 5.5 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.5-3.8-9S9.5 5.4 12 3ZM3.5 9h17m-17 6h17"
      />
    </svg>
  );
}

export function IconBolt({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" />
    </svg>
  );
}

export function IconBall({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinejoin="round" d="m12 7.5 4.3 3.1-1.65 5.05h-5.3L7.7 10.6 12 7.5Z" />
      <path strokeLinecap="round" d="M12 3v4.5M20.6 10.6l-4.3.05M18.3 19.4l-3.65-3.75M5.7 19.4l3.65-3.75M3.4 10.6l4.3.05" />
    </svg>
  );
}

export function IconMusic({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18V6l10-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm10-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

export function IconDevice({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path strokeLinecap="round" d="M10.5 5.5h3M11 18.5h2" />
    </svg>
  );
}

export function IconDoc({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

/* ── أيقونات ملوّنة للتواصل — بألوان العلامات الحقيقية ── */

export function IconWhatsApp({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#25D366" />
      <path
        fill="#fff"
        d="M33.2 14.8A13 13 0 0 0 12.5 30.4L11 36l5.8-1.5a13 13 0 0 0 6.2 1.6h.01c7.2 0 13-5.8 13-13a12.9 12.9 0 0 0-2.8-8.3Zm-10.2 20a10.8 10.8 0 0 1-5.5-1.5l-.4-.24-4.1 1.07 1.1-4-.26-.41a10.8 10.8 0 1 1 9.16 5.08Zm5.94-8.08c-.33-.16-1.93-.95-2.23-1.06-.3-.11-.51-.16-.73.17-.22.32-.84 1.05-1.03 1.27-.19.22-.38.24-.7.08a8.86 8.86 0 0 1-4.43-3.87c-.34-.58.33-.54.96-1.79.11-.22.05-.4-.03-.57-.08-.16-.73-1.76-1-2.4-.26-.63-.53-.55-.73-.56h-.62c-.22 0-.57.08-.86.4-.3.33-1.13 1.1-1.13 2.7 0 1.58 1.15 3.12 1.31 3.34.16.22 2.27 3.47 5.5 4.87 2.05.88 2.85.96 3.87.81.63-.1 1.93-.79 2.2-1.55.27-.77.27-1.42.19-1.56-.08-.15-.3-.24-.62-.4Z"
      />
    </svg>
  );
}

export function IconEmail({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#fff" />
      <path fill="#4285F4" d="M11 34V19.4l13 8.9 13-8.9V34a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2Z" />
      <path fill="#EA4335" d="M11 17.2c0-1.8 2-2.8 3.4-1.8L24 22l9.6-6.6c1.4-1 3.4 0 3.4 1.8v2.2l-13 8.9-13-8.9v-2.2Z" />
      <path fill="#34A853" d="M11 34v-9.3l6 4.1V36h-4a2 2 0 0 1-2-2Z" opacity=".9" />
      <path fill="#FBBC05" d="M37 34v-9.3l-6 4.1V36h4a2 2 0 0 0 2-2Z" opacity=".9" />
    </svg>
  );
}

export function IconTelegram({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#29A9EB" />
      <path
        fill="#fff"
        d="M34.9 14.6 11.8 23.5c-1 .4-1 1.8.03 2.15l5.7 1.9 2.2 6.9c.28.86 1.4 1.06 1.96.35l3.03-3.8 6 4.4c.8.6 1.95.16 2.16-.82l4-18.9c.22-1.05-.8-1.9-1.8-1.5Zm-4.7 5.4-9.2 8.1c-.32.28-.5.68-.5 1.1v2.8l-1.5-4.6 11.2-7.4Z"
      />
    </svg>
  );
}

export function IconClock({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="var(--accent-2)" />
      <circle cx="24" cy="24" r="11" fill="none" stroke="#fff" strokeWidth="2.6" />
      <path d="M24 17.5V24l4.5 3" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconChat({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="var(--accent)" />
      <path
        d="M14 17.5A2.5 2.5 0 0 1 16.5 15h15a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H23l-6 5v-5h-.5a2.5 2.5 0 0 1-2.5-2.5v-10Z"
        fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round"
      />
      <path d="M19 21h10M19 25.5h6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/* ── أيقونات الأقسام الملوّنة — بديل الأيقونات الخطّية الرمادية ── */

export function IconPubgColor({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#F2A900" />
      <circle cx="24" cy="24" r="13" fill="#FFD35C" stroke="#B87A00" strokeWidth="2" />
      <path d="M18.5 30V18h5.2a3.9 3.9 0 0 1 0 7.8H21" fill="none" stroke="#8A5A00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 18v7.6a4.4 4.4 0 0 0 8.8 0V18" fill="none" stroke="#8A5A00" strokeWidth="3" strokeLinecap="round" transform="translate(-3.5)" />
    </svg>
  );
}

export function IconEfootColor({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#0B7A4B" />
      <circle cx="24" cy="24" r="12" fill="#fff" />
      <path d="m24 16.5 6.4 4.65-2.45 7.5h-7.9l-2.45-7.5L24 16.5Z" fill="#0D1424" />
      <path d="M24 12v4.5M36 20.5l-5.6.1M32.5 34l-4.6-5M15.5 34l4.6-5M12 20.5l5.6.1" stroke="#0D1424" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconTiktokColor({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#010101" />
      <path d="M30.5 13c.6 3.4 2.6 5.5 6 5.9v4c-2 .2-3.8-.4-5.9-1.7v7.5c0 5.4-3.4 9.3-8.4 9.3-4.6 0-8.2-3.4-8.2-8 0-4.9 4.1-8.6 9.5-7.9v4.3c-3.2-.6-5.4 1.1-5.4 3.7 0 2.3 1.7 3.9 3.9 3.9 2.3 0 4-1.6 4-4.4V13h4.5Z" fill="#25F4EE" transform="translate(-1.6 1.4)" />
      <path d="M30.5 13c.6 3.4 2.6 5.5 6 5.9v4c-2 .2-3.8-.4-5.9-1.7v7.5c0 5.4-3.4 9.3-8.4 9.3-4.6 0-8.2-3.4-8.2-8 0-4.9 4.1-8.6 9.5-7.9v4.3c-3.2-.6-5.4 1.1-5.4 3.7 0 2.3 1.7 3.9 3.9 3.9 2.3 0 4-1.6 4-4.4V13h4.5Z" fill="#FE2C55" transform="translate(1.6 -1.4)" />
      <path d="M30.5 13c.6 3.4 2.6 5.5 6 5.9v4c-2 .2-3.8-.4-5.9-1.7v7.5c0 5.4-3.4 9.3-8.4 9.3-4.6 0-8.2-3.4-8.2-8 0-4.9 4.1-8.6 9.5-7.9v4.3c-3.2-.6-5.4 1.1-5.4 3.7 0 2.3 1.7 3.9 3.9 3.9 2.3 0 4-1.6 4-4.4V13h4.5Z" fill="#fff" />
    </svg>
  );
}

export function IconDeviceColor({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="var(--accent)" />
      <rect x="16" y="10" width="16" height="28" rx="3.5" fill="#fff" />
      <rect x="18" y="14" width="12" height="18" rx="1.5" fill="#0D1424" opacity=".85" />
      <circle cx="24" cy="35" r="1.6" fill="#0D1424" opacity=".55" />
    </svg>
  );
}

export function IconGamesColor({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="var(--accent)" />
      <path d="M16 18h16a6 6 0 0 1 6 6.2l-.5 5.4a3.8 3.8 0 0 1-6.8 2l-1.9-2.6h-7.6l-1.9 2.6a3.8 3.8 0 0 1-6.8-2l-.5-5.4A6 6 0 0 1 16 18Z" fill="#fff" />
      <path d="M18.5 24h4M20.5 22v4" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="29" cy="23.5" r="1.7" fill="var(--accent)" />
      <circle cx="32.5" cy="26.5" r="1.7" fill="var(--accent)" />
    </svg>
  );
}

export function IconBack({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="2" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5l-7 7 7 7" />
    </svg>
  );
}

/* ─── أيقونات الضمانات (صف الثقة) — بدل الإيموجي ─────────────
   الإيموجي يختلف شكله بين آيفون وأندرويد وويندوز، وهذه ثابتة على كل جهاز. */

/* ─── أيقونات الضمانات ──────────────────────────────────────
   ليست مربّعات مصمتة: **صفيحة شفّافة** بلون الهوية وحافة رفيعة، والرمز
   خطّ لا كتلة. الكتلة الصلبة تصرخ في صفّ هادئ، والصفيحة تنتمي إليه —
   وهي نفس لغة "وجه العملة" في بلاطات الأقسام.
   وألوانها من متغيّرات الهوية فتتبدّل مع الوضع الليلي وحدها. */

function Plate({
  tone,
  children,
}: {
  /** لون الهوية المستعمل — الأخضر المائي أو الذهب */
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <rect
        width="48"
        height="48"
        rx="14"
        fill={tone}
        fillOpacity="0.14"
        stroke={tone}
        strokeOpacity="0.3"
      />
      <g
        fill="none"
        stroke={tone}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
    </>
  );
}

/** تسليم فوري — صاعقة وخطّا سرعة */
export function IconTrustInstant({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <Plate tone="var(--accent-2)">
        <path d="M27 11 17.5 25.5h6.2L21 37l9.8-14.6h-6.3L27 11Z" />
        <path d="M12.5 16h4M11 24h3.5" strokeWidth="2" strokeOpacity="0.55" />
      </Plate>
    </svg>
  );
}

/** دفع آمن — درع وعلامة صحّ */
export function IconTrustSecure({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <Plate tone="var(--accent)">
        <path d="M24 11.5 33.5 15v7.8c0 6.1-3.9 10.7-9.5 12.7-5.6-2-9.5-6.6-9.5-12.7V15L24 11.5Z" />
        <path d="m19.8 23.6 3.1 3.1 5.4-5.7" />
      </Plate>
    </svg>
  );
}

/** دعم مباشر — فقاعة محادثة وثلاث نقاط */
export function IconTrustSupport({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <Plate tone="var(--accent)">
        <path d="M35.5 23.4c0 5.6-5.1 10.1-11.5 10.1-1.2 0-2.4-.15-3.5-.45L13.5 36l2-5.3c-1.9-1.9-3-4.4-3-7.3 0-5.6 5.1-10.1 11.5-10.1s11.5 4.5 11.5 10.1Z" />
        <path d="M19.4 23.4h.02M24 23.4h.02M28.6 23.4h.02" strokeWidth="3.4" />
      </Plate>
    </svg>
  );
}

/** طلبات مضمونة — وسام بعلامة صحّ */
export function IconTrustGuarantee({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <Plate tone="var(--accent-2)">
        <path d="M24 11.5 26.6 14l3.5-.3 1 3.4 3.2 1.6-.9 3.4 2.1 2.9-2.5 2.4.3 3.5-3.5.8-1.7 3-3.4-1.2-3.4 1.2-1.7-3-3.5-.8.3-3.5-2.5-2.4 2.1-2.9-.9-3.4 3.2-1.6 1-3.4 3.5.3L24 11.5Z" />
        <path d="m20.4 24.2 2.7 2.7 4.9-5.1" />
      </Plate>
    </svg>
  );
}

/** شعار جوجل الرسمي بألوانه الأربعة — لزر تسجيل الدخول */
export function IconGoogle({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8a10 10 0 0 1-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.5 6.6-16.3Z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7A22 22 0 0 0 24 46Z" />
      <path fill="#FBBC05" d="M11.8 28.3a13.2 13.2 0 0 1 0-8.6v-5.7H4.5a22 22 0 0 0 0 20l7.3-5.7Z" />
      <path fill="#EA4335" d="M24 9.5c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 2.9 29.9.9 24 .9A22 22 0 0 0 4.5 14l7.3 5.7c1.7-5.2 6.5-9 12.2-9Z" />
    </svg>
  );
}

/* ─── أيقونات صفحة الدخول ───────────────────────────────── */

/** نجمة الترحيب — أعلى بطاقة تسجيل الدخول */
export function IconSparkle({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M24 8.5c1.4 6.6 4.9 10.1 11.5 11.5C28.9 21.4 25.4 24.9 24 31.5c-1.4-6.6-4.9-10.1-11.5-11.5C19.1 18.6 22.6 15.1 24 8.5Z" fill="currentColor" />
      <path d="M34.5 27c.7 3.2 2.3 4.8 5.5 5.5-3.2.7-4.8 2.3-5.5 5.5-.7-3.2-2.3-4.8-5.5-5.5 3.2-.7 4.8-2.3 5.5-5.5Z" fill="currentColor" opacity=".85" />
      <path d="M14 30c.5 2.2 1.6 3.3 3.8 3.8-2.2.5-3.3 1.6-3.8 3.8-.5-2.2-1.6-3.3-3.8-3.8 2.2-.5 3.3-1.6 3.8-3.8Z" fill="currentColor" opacity=".7" />
    </svg>
  );
}

/** درع بعلامة صح — لسطر الطمأنة "بياناتك آمنة" */
export function IconShieldCheck({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3 20 6v6c0 4.7-3.2 8.4-8 9.8C7.2 20.4 4 16.7 4 12V6l8-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m9 12 2.2 2.2L15.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** دائرة بعلامة صح — لرأس بطاقة إكمال التسجيل */
export function IconCheckCircle({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="m8.2 12.2 2.6 2.6 5-5.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** سهم المتابعة — داخل زر الدخول الدائري */
export function IconArrow({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 12h13M13 6.5 18.5 12 13 17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── أيقونات الأقسام أحادية اللون ─────────────────────────
   داخل الصفيحة السداسية تُرسم بلون العلامة الواحد، فتبدو الشبكة
   عائلة متجانسة بدل ستّة شعارات متنافرة. */

export function IconUcMono({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.2 15.6V8.4h2.7a2.1 2.1 0 0 1 0 4.2h-1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8.4v4.1a2 2 0 0 0 4 0V8.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconBallMono({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="m12 7.6 3.5 2.6-1.35 4.15h-4.3L8.5 10.2 12 7.6Z" fill="currentColor" />
    </svg>
  );
}

export function IconTiktokMono({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M14 4c.45 2.2 1.85 3.5 4.1 3.7v2.85c-1.55 0-3-.45-4.1-1.2v5.2A5.4 5.4 0 1 1 8.6 9.15c.3 0 .6.02.9.07v2.95a2.5 2.5 0 1 0 1.75 2.38V4H14Z" fill="currentColor" />
    </svg>
  );
}

export function IconPhoneMono({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="7" y="3" width="10" height="18" rx="2.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10.8 17.8h2.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconPadMono({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="2.6" y="6.8" width="18.8" height="10.4" rx="3.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7.4 12h2.5M8.65 10.75v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="15.5" cy="11.4" r="1" fill="currentColor" />
      <circle cx="17.4" cy="13.3" r="1" fill="currentColor" />
    </svg>
  );
}

/* ─── أيقونات القائمة السفلية — مطابقة للمعاينة ────────────
   خطوط رفيعة موحّدة السماكة (1.8) وأطراف مستديرة، فتبدو عائلة واحدة. */

export function IconNavHome({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.5V20h13V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 20v-5.5h5V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconNavGames({ className = "" }: IconProps) {
  return (
    /* شبكةُ أربعةٍ كما في النموذج — «الأقسام» لا «لعبةٌ بذراع تحكّم»،
       فالتبويب يفتح كتالوجاً لا لعبة. */
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3.2" y="3.2" width="7.6" height="7.6" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.2" y="3.2" width="7.6" height="7.6" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3.2" y="13.2" width="7.6" height="7.6" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.2" y="13.2" width="7.6" height="7.6" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function IconNavAccounts({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="8.2" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.8 20c.7-3.7 3.7-5.8 7.2-5.8s6.5 2.1 7.2 5.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * الدعم — فقاعةٌ **فيها علامة استفهام**، كما في النموذج.
 *
 * ⚠️ الفقاعة وحدها تقول «محادثة» لا «مساعدة»، وعلامةُ الاستفهام داخلها
 *    تقول: هنا يُسأل. وهي فارق التبويب الذي أشارت إليه صاحبة المتجر.
 */
export function IconNavHelp({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M20.5 12.4c0 4.1-3.8 7.4-8.5 7.4-1 0-1.9-.2-2.8-.4L4 21l1.4-3.8a7 7 0 0 1-1.9-4.8C3.5 8.3 7.3 5 12 5s8.5 3.3 8.5 7.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 10.4c.2-1.1 1-1.9 2.1-1.9 1.2 0 2.1.8 2.1 1.9 0 1.4-2.1 1.4-2.1 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="16" r=".9" fill="currentColor" />
    </svg>
  );
}

/** نجاح — قرص مصمت وعلامة صحّ بيضاء. أوضح من حلقة رفيعة في شاشة التأكيد */
export function IconSuccess({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`size-6 ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="m7.8 12.3 2.9 2.9 5.5-5.9"
        fill="none"
        stroke="var(--surface)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── أيقونات الدردشة المباشرة ── */

/** فقاعة حوار خطّية — زرّ فتح الدردشة */
export function IconChatLine({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 12.4c0 3.9-3.6 7-8 7-.9 0-1.8-.1-2.6-.4L4 20.5l1.3-3.6C4.2 15.7 3.5 14.1 3.5 12.4c0-3.9 3.6-7 8-7s8.5 3.1 8.5 7Z"
      />
      <path strokeLinecap="round" d="M8.5 11.5h7M8.5 14.5h4" />
    </svg>
  );
}

/** إغلاق — يحلّ محلّ الفقاعة عند فتح النافذة */
export function IconClose({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="2" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/** إرسال — سهم ورقي، يقلب اتجاهه في العربية عبر rtl:-scale-x-100 */
export function IconSend({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12 20 4.5 16 20l-4.5-5.5L4.5 12Zm7 2.5L20 4.5"
      />
    </svg>
  );
}

/** سمّاعة هاتف — زرّ الاتصال بكود التحويل */
export function IconCall({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 5.8c0-.7.6-1.3 1.3-1.3h2.1c.6 0 1.1.4 1.3 1l.7 2.7c.1.5-.1 1-.5 1.3l-1.3 1a12.6 12.6 0 0 0 5.4 5.4l1-1.3c.3-.4.8-.6 1.3-.5l2.7.7c.6.2 1 .7 1 1.3v2.1c0 .7-.6 1.3-1.3 1.3C10.6 19.5 4.5 13.4 4.5 5.8Z"
      />
    </svg>
  );
}

/** سلّة مهملات — حذف صنف من السلة */
export function IconTrash({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" d="M4 6.8h16" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.6 6.8V5.7c0-.66.54-1.2 1.2-1.2h2.4c.66 0 1.2.54 1.2 1.2v1.1"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.4 6.8h11.2l-.85 12.05a1.2 1.2 0 0 1-1.2 1.15H8.45a1.2 1.2 0 0 1-1.2-1.15L6.4 6.8Z"
      />
      <path strokeLinecap="round" d="M10.4 10.6v5.6M13.6 10.6v5.6" />
    </svg>
  );
}

/** حلقة دوّارة — أثناء الحفظ. تتوقّف لمن فعّل "تقليل الحركة" */
export function IconSpinner({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      strokeWidth="2.2"
      className={`${base} animate-spin ${className}`}
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.5" className="opacity-25" />
      <path strokeLinecap="round" d="M20.5 12a8.5 8.5 0 0 0-8.5-8.5" />
    </svg>
  );
}

/** سلّة تسوّق فارغة — كبيرة، لشاشة "سلّتك فارغة" */
export function IconCartEmpty({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.5" className={`${base} ${className}`} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.8 3.8h1.9a1 1 0 0 1 .98.8l.42 2.1m0 0 1.72 8.6a1.6 1.6 0 0 0 1.57 1.28h7.68a1.6 1.6 0 0 0 1.56-1.23l1.62-6.75a.8.8 0 0 0-.78-.99L6.1 6.7Z"
      />
      <circle cx="9.8" cy="20" r="1.5" />
      <circle cx="17.2" cy="20" r="1.5" />
    </svg>
  );
}

/* ── أيقونات الفوتر الخطّية — بديل الإيموجي ── */

export function IconPin({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function IconEmailLine({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7.5 8 5.5 8-5.5" />
    </svg>
  );
}

export function IconClockLine({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" d="M12 7.5V12l3 2" />
    </svg>
  );
}

/* ── إظهار كلمة السرّ وإخفاؤها ── */

export function IconEye({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

export function IconEyeOff({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.9 5.9A9.7 9.7 0 0 1 12 5.7c6 0 9.5 6.3 9.5 6.3a17 17 0 0 1-2.9 3.7M6.4 7.6A17 17 0 0 0 2.5 12S6 18.3 12 18.3c1.4 0 2.6-.25 3.7-.66" />
      <path strokeLinecap="round" d="M10 10a2.8 2.8 0 0 0 4 4" />
      <path strokeLinecap="round" d="m3.5 3.5 17 17" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   أيقونات حقيقية — لا محارف ولا إيموجي
   ⚠️ قرار صاحبة المتجر: «بدي أيقونات حقيقية». المحرف (‹ ⚙ ＋ ›)
      يتغيّر شكله بين جهاز وجهاز، ولا يقبل حجماً ولا سماكة، ويظهر
      أحياناً مربّعاً فارغاً. كل أيقونة هنا مرسومة بمسار SVG.
   ═══════════════════════════════════════════════════════════ */

export function IconGear({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="3.2" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a1.9 1.9 0 1 1-2.7 2.7l-.05-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47v.17a1.9 1.9 0 1 1-3.8 0v-.09a1.6 1.6 0 0 0-1.05-1.47 1.6 1.6 0 0 0-1.77.32l-.06.06a1.9 1.9 0 1 1-2.7-2.7l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-.97H3.6a1.9 1.9 0 1 1 0-3.8h.09A1.6 1.6 0 0 0 5.16 9.4a1.6 1.6 0 0 0-.32-1.77l-.06-.06a1.9 1.9 0 1 1 2.7-2.7l.06.06a1.6 1.6 0 0 0 1.77.32h.08A1.6 1.6 0 0 0 10.36 3.8v-.2a1.9 1.9 0 1 1 3.8 0v.09a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a1.9 1.9 0 1 1 2.7 2.7l-.06.06a1.6 1.6 0 0 0-.32 1.77v.08a1.6 1.6 0 0 0 1.47.97h.17a1.9 1.9 0 1 1 0 3.8h-.09a1.6 1.6 0 0 0-1.47.97Z"
      />
    </svg>
  );
}

/** سهمُ فتحٍ في نهاية الصفّ · وسهمُ رجوعٍ حين يُدار */
export function IconChevron({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="2" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
    </svg>
  );
}

/** الطلبات — إيصال بخطوطه */
export function IconReceipt({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 2.75h12v18.5l-2.5-1.8-2.5 1.8-2.5-1.8-2.5 1.8V2.75Z"
      />
      <path strokeLinecap="round" d="M9 7.5h6M9 11.5h6M9 15.5h3.5" />
    </svg>
  );
}

/** متجري — كيس تسوّق */
export function IconBag({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 7.5h15l-1.2 13H5.7L4.5 7.5Z" />
      <path strokeLinecap="round" d="M8.75 9.5V6.4a3.25 3.25 0 0 1 6.5 0v3.1" />
    </svg>
  );
}

/** أرقامي — أعمدة صاعدة */
export function IconChart({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" d="M4 20h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 20v-5M12 20V8M17 20v-8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 9 4.5-4 3.5 3L19 3" />
    </svg>
  );
}

/** الزبائن — شخصان */
export function IconUsers({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <circle cx="9" cy="8" r="3.4" />
      <path strokeLinecap="round" d="M2.8 20c0-3.2 2.8-5.3 6.2-5.3s6.2 2.1 6.2 5.3" />
      <path strokeLinecap="round" d="M16.2 5.1a3.4 3.4 0 0 1 0 6.6M17.6 14.9c2.2.6 3.6 2.3 3.6 4.6" />
    </svg>
  );
}

/** المنتجات — بطاقة سعر */
export function IconTag({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.2 3H21v9.8l-8.6 8.6a1.6 1.6 0 0 1-2.3 0l-7.5-7.5a1.6 1.6 0 0 1 0-2.3L11.2 3Z"
      />
      <circle cx="16.8" cy="7.2" r="1.5" />
    </svg>
  );
}

/** البانر — صورة */
export function IconImage({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.5" cy="10" r="1.6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 17 4.8-4.5 3.4 3.2 3-2.8L20 16.5" />
    </svg>
  );
}

/** طرق الدفع — بطاقة */
export function IconCard({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path strokeLinecap="round" d="M2.5 9.5h19M6 15h3.5" />
    </svg>
  );
}

/** النقاط — هديّة */
export function IconGift({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <rect x="3" y="8.5" width="18" height="4" rx="1.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.8 12.5V20h14.4v-7.5M12 8.5V20" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8.5S10.6 4 8.4 4a2.2 2.2 0 0 0 0 4.5H12Zm0 0s1.4-4.5 3.6-4.5a2.2 2.2 0 0 1 0 4.5H12Z"
      />
    </svg>
  );
}

/** الرائج — لهبٌ صغير */
export function IconFlame({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.7" className={`${base} ${className}`} aria-hidden>
      <path
        strokeLinejoin="round"
        d="M12 2.6s5.6 4.2 5.6 9.4A5.6 5.6 0 0 1 12 21.4a5.6 5.6 0 0 1-5.6-5.6c0-2 1-3.2 1-3.2s.6 1.4 1.8 1.8c-.3-3.4 2.8-5.4 2.8-8.6a6 6 0 0 0 0-3.2Z"
      />
    </svg>
  );
}

/** المشاركة — صندوقٌ يخرج منه سهم لأعلى */
export function IconShare({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.5V20h15v-7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5V3.6M8 7.6 12 3.6l4 4" />
    </svg>
  );
}

/** بيانات المتجر — واجهة محلّ */
export function IconStore({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 9.5V20h16V9.5" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 9.5 4.7 4h14.6L21 9.5a2.6 2.6 0 0 1-4.5 1.8A2.6 2.6 0 0 1 12 11.3a2.6 2.6 0 0 1-4.5 0A2.6 2.6 0 0 1 3 9.5Z"
      />
      <path strokeLinecap="round" d="M9.5 20v-5.5h5V20" />
    </svg>
  );
}

/** الأسئلة — علامة استفهام في دائرة */
export function IconHelp({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.4"
      />
      <path strokeLinecap="round" d="M12 16.8h.01" />
    </svg>
  );
}

/** الأقسام — أربع بلاطات */
export function IconGrid({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </svg>
  );
}

/** الدعوات — مغلّف بسهم */
export function IconInvite({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <circle cx="9.5" cy="8" r="3.4" />
      <path strokeLinecap="round" d="M3 20c0-3.2 2.9-5.3 6.5-5.3 1.4 0 2.7.3 3.8.9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 13v7M14 16.5h7" />
    </svg>
  );
}

/** المساعدون — شارة شخص */
export function IconBadge({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <circle cx="12" cy="11" r="2.4" />
      <path strokeLinecap="round" d="M8 17.2c.8-1.4 2.3-2.2 4-2.2s3.2.8 4 2.2M9.5 2.5h5" />
    </svg>
  );
}

/** الأرباح — دولار في دائرة */
export function IconMoney({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.6 9.2A2.4 2.4 0 0 0 12.3 7.6h-.8a2 2 0 0 0-.4 4l1.9.4a2 2 0 0 1-.4 4h-.8a2.4 2.4 0 0 1-2.3-1.7M12 6v12"
      />
    </svg>
  );
}

/** الشراء — زائد في دائرة */
export function IconPlus({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.9" className={`${base} ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 8.2v7.6M8.2 12h7.6" />
    </svg>
  );
}

/** الطرح — لسطر الخصم في سجلّ النقاط */
export function IconMinus({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="2.4" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" d="M6 12h12" />
    </svg>
  );
}

/** الإرسال — سهمٌ خارج */
export function IconSendOut({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.9" className={`${base} ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 15 9m0 0h-4.2M15 9v4.2" />
    </svg>
  );
}

/** الاستلام — سهمٌ داخل */
export function IconReceive({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.9" className={`${base} ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9 9 15m0 0h4.2M9 15v-4.2" />
    </svg>
  );
}

/** الإرسال في الدردشة — طائرة ورقية، كما اعتادها الناس */
export function IconPaperPlane({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 3 10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8 21 3Z"
      />
    </svg>
  );
}

/**
 * 💧 شعار **برواقو** — قطرةٌ تحمل موجات المتجر (اختيار صاحبة المتجر).
 *
 * «برواقو» في الصومالية هي المطر الذي يُنبت الخير. فالقطرة تقول الاسم
 * بلا كلام، وفي جوفها **موجات شعار المتجر نفسها** — فيبدو من عائلته.
 *
 * ⚠️ والموجات بلون العلامة الثاني (`--accent-2`) لا بلونٍ ثابت، فتتبدّل
 *    مع الوضع الليلي وحدها. وكان الشعار صورةً PNG بأزرقَ وذهبٍ ليسا من
 *    ألوان المتجر، ولا يُقرأ في ٢٠ بكسل.
 */
export function IconBarwaaqo({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden>
      <path
        d="M50 9C50 9 21 42 21 62a29 29 0 0 0 58 0C79 42 50 9 50 9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="74" r="4.6" fill="var(--accent-2)" />
      <path
        d="M38 67a17 17 0 0 1 24 0"
        fill="none"
        stroke="var(--accent-2)"
        strokeWidth="5.4"
        strokeLinecap="round"
      />
      <path
        d="M30.5 57.5a27 27 0 0 1 39 0"
        fill="none"
        stroke="var(--accent-2)"
        strokeWidth="5.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * ونسخةٌ بخطٍّ واحد للشريط السفلي — ٢٠ بكسل لا تحتمل ثلاث موجات.
 * موجةٌ واحدة تكفي لتُعرف القطرة، والزائد يصير لطخة.
 */
export function IconBarwaaqoLine({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden>
      <path
        d="M50 9C50 9 21 42 21 62a29 29 0 0 0 58 0C79 42 50 9 50 9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinejoin="round"
      />
      <path
        d="M35 66a20 20 0 0 1 30 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** التنزيل — سهمٌ ينزل إلى صينية. لزرّ «حمّليها لإكسل» في اللوحة */
export function IconDownload({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.9" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5v11m0 0 4-4m-4 4-4-4" />
      <path strokeLinecap="round" d="M4 16v2.5A2 2 0 0 0 6 20.5h12a2 2 0 0 0 2-2V16" />
    </svg>
  );
}

/** التقويم — لحقلَي «من» و«إلى» */
export function IconCalendar({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <rect x="3.2" y="5" width="17.6" height="15.5" rx="3" />
      <path strokeLinecap="round" d="M3.2 9.8h17.6M8 2.8v3.6M16 2.8v3.6" />
    </svg>
  );
}

/**
 * نصوص الصفحات — حرفٌ فوق سطر، كزرّ الخطّ في محرّرات الكتابة.
 *
 * ⚠️ كانت «Wording» و«Questions» على `IconHelp` معاً — بابان بأيقونةٍ
 *    واحدة، والمكرّرة زينةٌ لا علامة. القرار المقفول (ج).
 */
export function IconText({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" d="M5 5h14M5 5v2M12 5v14M9.5 19h5" />
    </svg>
  );
}

/**
 * الأقسام — إطارٌ مقسومٌ إلى صفٍّ وعمود، أي **تخطيط الصفحة نفسه**.
 *
 * ⚠️ كانت الأقسام على `IconGrid` (أربعة مربّعات)، وهي أيقونة **More**
 *    في الشريط السفلي. أيقونةٌ واحدة لبابين تصير زينةً لا علامة —
 *    القرار المقفول (ج).
 */
export function IconLayout({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
      <path strokeLinecap="round" d="M3.5 9.5h17M9 9.5V20" />
    </svg>
  );
}

/** صحّان — «وصلت وقُرئت» في قوائم الدردشة */
export function IconChecks({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="2" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m1.5 12.5 4 4 8-9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m10 16.5 1 1 8-9" />
    </svg>
  );
}
