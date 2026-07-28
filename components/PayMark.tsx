import type { PayMarkKey } from "@/lib/data";

/**
 * علامات وسائل الدفع — مربّعات صغيرة بألوان كل خدمة.
 *
 * مرسومة بأشكال بسيطة لا شعارات منسوخة: الشعار الرسمي مملوك لصاحبه،
 * ونسخه على متجر تجاري يفتح باب مشاكل لا داعي لها. الشكل واللون هنا
 * كافيان ليتعرّف الزبون على الخدمة في لمحة، وهو ما تفعله المتاجر الكبرى.
 */

const box = "size-10 shrink-0 rounded-[11px]";

/** ألوان كل خدمة — نفس ألوانها المعروفة فيتعرّف عليها الزبون بلا قراءة */
const tone: Record<PayMarkKey, string> = {
  paypal: "#1546A0",
  card: "#2B3445",
  usdt: "#26A17B",
  binance: "#F0B90B",
  evc: "#00A550",
  jeeb: "#1B63C8",
  edahab: "#E1471D",
  zaad: "#0B7BC1",
  sahal: "#7A3FBF",
  waafi: "#0F8A6B",
};

/** حروف قصيرة داخل المربّع للخدمات المحلية — أوضح من أي رسم مجرّد */
const letters: Partial<Record<PayMarkKey, string>> = {
  evc: "EVC",
  jeeb: "JEEB",
  edahab: "eD",
  zaad: "ZAAD",
  sahal: "SAHAL",
  waafi: "WAAFI",
  paypal: "PP",
};

export default function PayMark({
  mark,
  logo,
  alt = "",
  className = "",
}: {
  mark: PayMarkKey;
  /** الشعار الحقيقي متى رُفع — يحلّ محلّ الرسم بلا تعديل على أي صفحة */
  logo?: string;
  alt?: string;
  className?: string;
}) {
  const fill = tone[mark];

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
      <rect width="40" height="40" rx="11" fill={fill} />

      {/* بطاقة الائتمان: شريط مغناطيسي ودائرتان متداخلتان كما على البطاقات */}
      {mark === "card" && (
        <>
          <rect x="7" y="12" width="26" height="17" rx="3" fill="#fff" opacity="0.16" />
          <rect x="7" y="16" width="26" height="3.4" fill="#fff" opacity="0.55" />
          <circle cx="21.5" cy="25" r="4.6" fill="#EB001B" />
          <circle cx="27" cy="25" r="4.6" fill="#F79E1B" opacity="0.9" />
        </>
      )}

      {/* USDT: رمز ₮ */}
      {mark === "usdt" && (
        <>
          <rect x="12" y="11" width="16" height="4" rx="1.2" fill="#fff" />
          <rect x="18" y="11" width="4" height="18" rx="1.2" fill="#fff" />
          <ellipse cx="20" cy="17.5" rx="9" ry="3.6" fill="none" stroke="#fff" strokeWidth="2.4" />
        </>
      )}

      {/* Binance: المعيّن المركّب */}
      {mark === "binance" && (
        <g fill="#1B1B1B">
          <rect x="17.6" y="9.6" width="6.8" height="6.8" rx="1.2" transform="rotate(45 21 13)" />
          <rect x="17.6" y="23.6" width="6.8" height="6.8" rx="1.2" transform="rotate(45 21 27)" />
          <rect x="10.6" y="16.6" width="6.8" height="6.8" rx="1.2" transform="rotate(45 14 20)" />
          <rect x="24.6" y="16.6" width="6.8" height="6.8" rx="1.2" transform="rotate(45 28 20)" />
          <rect x="17.6" y="16.6" width="6.8" height="6.8" rx="1.2" transform="rotate(45 21 20)" />
        </g>
      )}

      {letters[mark] && (
        <text
          x="20"
          y="20"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={
            letters[mark]!.length >= 5 ? 8.5 : letters[mark]!.length > 3 ? 10 : 13
          }
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.3"
        >
          {letters[mark]}
        </text>
      )}
    </svg>
  );
}
