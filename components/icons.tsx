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
