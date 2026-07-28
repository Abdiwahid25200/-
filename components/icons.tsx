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
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 8h12l-1 12.2A2 2 0 0 1 15 22H9a2 2 0 0 1-2-1.8zM9 8V6a3 3 0 0 1 6 0v2"
      />
    </svg>
  );
}

export function IconMenu({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
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
      <rect width="48" height="48" rx="12" fill="#F5A623" />
      <circle cx="24" cy="24" r="11" fill="none" stroke="#fff" strokeWidth="2.6" />
      <path d="M24 17.5V24l4.5 3" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconChat({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#3D5AFE" />
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
      <rect width="48" height="48" rx="12" fill="#3D5AFE" />
      <rect x="16" y="10" width="16" height="28" rx="3.5" fill="#fff" />
      <rect x="18" y="14" width="12" height="18" rx="1.5" fill="#0D1424" opacity=".85" />
      <circle cx="24" cy="35" r="1.6" fill="#0D1424" opacity=".55" />
    </svg>
  );
}

export function IconGamesColor({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#6B3DFE" />
      <path d="M16 18h16a6 6 0 0 1 6 6.2l-.5 5.4a3.8 3.8 0 0 1-6.8 2l-1.9-2.6h-7.6l-1.9 2.6a3.8 3.8 0 0 1-6.8-2l-.5-5.4A6 6 0 0 1 16 18Z" fill="#fff" />
      <path d="M18.5 24h4M20.5 22v4" stroke="#6B3DFE" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="29" cy="23.5" r="1.7" fill="#6B3DFE" />
      <circle cx="32.5" cy="26.5" r="1.7" fill="#6B3DFE" />
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

/** تسليم فوري — صاعقة على خلفية كهرمانية */
export function IconTrustInstant({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#F2A900" />
      <path d="M26.5 10 15 26h7.5L21 38l12-16.5h-7.6L26.5 10Z" fill="#fff" />
    </svg>
  );
}

/** دفع آمن — درع بقفل على خلفية زرقاء */
export function IconTrustSecure({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#3D5AFE" />
      <path d="M24 10.5 34 14.5v8.2c0 6.6-4.2 11.6-10 14-5.8-2.4-10-7.4-10-14V14.5l10-4Z" fill="#fff" />
      <path d="M20.6 23.4v-2.6a3.4 3.4 0 0 1 6.8 0v2.6" fill="none" stroke="#3D5AFE" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="19" y="23.2" width="10" height="8" rx="2" fill="#3D5AFE" />
    </svg>
  );
}

/** دعم مباشر — فقاعة محادثة على خلفية واتساب خضراء */
export function IconTrustSupport({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#25D366" />
      <path d="M24 12c-7.2 0-13 4.6-13 10.4 0 3.3 1.9 6.2 4.8 8.1L15 38l6.9-3.6c.7.1 1.4.2 2.1.2 7.2 0 13-4.6 13-10.2S31.2 12 24 12Z" fill="#fff" />
      <g fill="#25D366">
        <circle cx="18.6" cy="23.4" r="1.9" />
        <circle cx="24" cy="23.4" r="1.9" />
        <circle cx="29.4" cy="23.4" r="1.9" />
      </g>
    </svg>
  );
}

/** طلبات مضمونة — وسام بعلامة صح على خلفية خضراء */
export function IconTrustGuarantee({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#00B589" />
      <path d="m24 10 3.1 2.6 4-.5 1.4 3.8 3.6 1.9-1 3.9 2.4 3.3-2.9 2.8.3 4-4 .9-2 3.5-3.9-1.4-3.9 1.4-2-3.5-4-.9.3-4L8.5 25l2.4-3.3-1-3.9 3.6-1.9 1.4-3.8 4 .5L24 10Z" fill="#fff" />
      <path d="m19 24.2 3.6 3.6 7-7.2" fill="none" stroke="#00B589" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
