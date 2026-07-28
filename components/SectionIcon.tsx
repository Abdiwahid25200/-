import {
  IconBallMono,
  IconDeviceColor,
  IconEfootColor,
  IconGamesColor,
  IconPadMono,
  IconPhoneMono,
  IconPubgColor,
  IconTiktokColor,
  IconTiktokMono,
  IconUcMono,
} from "./icons";

const MAP = {
  pubg: IconPubgColor,
  efoot: IconEfootColor,
  tiktok: IconTiktokColor,
  device: IconDeviceColor,
  games: IconGamesColor,
} as const;

/** النسخ أحادية اللون — تُستخدم داخل الصفيحة السداسية */
const MONO = {
  pubg: IconUcMono,
  efoot: IconBallMono,
  tiktok: IconTiktokMono,
  device: IconPhoneMono,
  games: IconPadMono,
} as const;

export type SectionIconKey = keyof typeof MAP;

/** أيقونة قسم ملوّنة — مصدر واحد يربط مفتاح القسم بأيقونته */
export default function SectionIcon({
  name,
  className = "size-12",
  mono,
}: {
  name: SectionIconKey;
  className?: string;
  /** أحادية اللون — ترث لون النص بدل ألوانها الخاصة */
  mono?: boolean;
}) {
  if (mono) {
    const M = MONO[name] ?? IconPadMono;
    return <M className={className} />;
  }
  const Icon = MAP[name] ?? IconGamesColor;
  return <Icon className={`${className} rounded-xl shadow-sm`} />;
}
