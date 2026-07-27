const tones = {
  green: "bg-yellow text-white",
  blue: "bg-orange text-white",
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
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.72rem] font-bold leading-none ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
