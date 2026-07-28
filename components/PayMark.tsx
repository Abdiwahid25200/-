import type { PayMarkKey } from "@/lib/data";

/**
 * علامات وسائل الدفع.
 *
 * الشعار الرسمي مملوك لصاحبه، ونسخه على متجر تجاري يفتح باب مشاكل.
 * فالبديل هنا **صفيحة علامة** لا حروف مرصوصة: تدرّج لوني بلون الخدمة،
 * حافة داخلية فاتحة تعطي عمقاً، وحرف واحد كبير — أنظف من ثلاثة أحرف
 * مضغوطة، ويبقى واضحاً على أي مقاس.
 *
 * ومتى رُفع الشعار الحقيقي في `public/images/pay/` وذُكر مساره في
 * `lib/data.ts` ← `logo`، حلّ محلّ هذه الصفيحة تلقائياً.
 */

const box = "size-10 shrink-0 rounded-[11px]";

/** لون كل خدمة ولونها الأغمق — منهما يُبنى التدرّج */
const tone: Record<PayMarkKey, [string, string]> = {
  paypal: ["#1B5BBF", "#0E3777"],
  card: ["#3B4657", "#1E2735"],
  usdt: ["#2FBF93", "#158463"],
  binance: ["#F5C525", "#C99408"],
  evc: ["#12BE62", "#067A3C"],
  jeeb: ["#2C77E0", "#12489B"],
  edahab: ["#F0603A", "#B32F0F"],
  zaad: ["#2A94D8", "#0F5E92"],
  sahal: ["#8E58D0", "#5A2E92"],
  waafi: ["#18A47F", "#0A6A50"],
};

/** حرف واحد يمثّل الخدمة — أوضح من اسم كامل مضغوط في ٤٠ بكسل */
const letter: Partial<Record<PayMarkKey, string>> = {
  evc: "E",
  jeeb: "J",
  edahab: "D",
  zaad: "Z",
  sahal: "S",
  waafi: "W",
};

export default function PayMark({
  mark,
  logo,
  alt = "",
  className = "",
}: {
  mark: PayMarkKey;
  /** الشعار الحقيقي متى رُفع — يحلّ محلّ الصفيحة بلا تعديل على أي صفحة */
  logo?: string;
  alt?: string;
  className?: string;
}) {
  const [light, dark] = tone[mark];
  const id = `pm-${mark}`;

  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={alt}
        className={`${box} border border-line bg-white object-contain p-1 ${className}`}
      />
    );
  }

  return (
    <svg viewBox="0 0 40 40" className={`${box} ${className}`} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>

      <rect width="40" height="40" rx="11" fill={`url(#${id})`} />
      {/* حافة داخلية فاتحة — تعطي الصفيحة عمقاً بدل مربّع مسطّح */}
      <rect
        x="0.6"
        y="0.6"
        width="38.8"
        height="38.8"
        rx="10.4"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.28"
        strokeWidth="1.2"
      />

      {/* بطاقة الائتمان: شريط ودائرتان متداخلتان كما على البطاقات الحقيقية */}
      {mark === "card" && (
        <>
          <rect x="7.5" y="13" width="25" height="15.5" rx="2.6" fill="#fff" opacity="0.14" />
          <rect x="7.5" y="16.4" width="25" height="3" fill="#fff" opacity="0.5" />
          <circle cx="21" cy="24.6" r="4.3" fill="#EB001B" />
          <circle cx="26.4" cy="24.6" r="4.3" fill="#F79E1B" opacity="0.92" />
        </>
      )}

      {/* USDT: رمز ₮ */}
      {mark === "usdt" && (
        <>
          <rect x="12" y="11.5" width="16" height="3.6" rx="1.2" fill="#fff" />
          <rect x="18.1" y="11.5" width="3.8" height="17" rx="1.2" fill="#fff" />
          <ellipse cx="20" cy="17.6" rx="8.6" ry="3.4" fill="none" stroke="#fff" strokeWidth="2.3" />
        </>
      )}

      {/* Binance: المعيّن المركّب */}
      {mark === "binance" && (
        <g fill="#1B1B1B">
          <rect x="17.6" y="9.6" width="6.8" height="6.8" rx="1.4" transform="rotate(45 21 13)" />
          <rect x="17.6" y="23.6" width="6.8" height="6.8" rx="1.4" transform="rotate(45 21 27)" />
          <rect x="10.6" y="16.6" width="6.8" height="6.8" rx="1.4" transform="rotate(45 14 20)" />
          <rect x="24.6" y="16.6" width="6.8" height="6.8" rx="1.4" transform="rotate(45 28 20)" />
          <rect x="17.6" y="16.6" width="6.8" height="6.8" rx="1.4" transform="rotate(45 21 20)" />
        </g>
      )}

      {/* PayPal: حرفا P متداخلان */}
      {mark === "paypal" && (
        <g fill="#fff">
          <path d="M14.6 10.5h7.2c3.5 0 5.5 1.9 5 5.1-.5 3.3-3 5.2-6.4 5.2h-2.6l-.9 5.5h-4.1l1.8-15.8Zm3.5 3.1-.6 4.2h1.9c1.6 0 2.6-.8 2.8-2.2.2-1.3-.5-2-2-2h-2.1Z" />
          <path
            opacity="0.65"
            d="M20.9 15.2h7.2c3.5 0 5.5 1.9 5 5.1-.5 3.3-3 5.2-6.4 5.2h-2.6l-.9 5.5h-4.1l1.8-15.8Z"
          />
        </g>
      )}

      {letter[mark] && (
        <text
          x="20"
          y="21"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize="19"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
        >
          {letter[mark]}
        </text>
      )}
    </svg>
  );
}
