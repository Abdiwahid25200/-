const tones = {
  green: "bg-orange text-onaccent",
  blue: "bg-orange text-onaccent",
  gold: "bg-yellow text-onaccent",
  soft: "bg-navy/85 text-white",
  outline: "border border-line bg-surface text-muted",
} as const;

/** شارة صغيرة — فوري · يدوي · الأكثر طلباً · خصم */
export default function Badge({
  children,
  tone = "green",
  className = "",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold leading-none ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
