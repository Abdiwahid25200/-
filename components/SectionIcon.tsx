import {
  IconDeviceColor,
  IconEfootColor,
  IconGamesColor,
  IconPubgColor,
  IconTiktokColor,
} from "./icons";

const MAP = {
  pubg: IconPubgColor,
  efoot: IconEfootColor,
  tiktok: IconTiktokColor,
  device: IconDeviceColor,
  games: IconGamesColor,
} as const;

export type SectionIconKey = keyof typeof MAP;

/** أيقونة قسم ملوّنة — مصدر واحد يربط مفتاح القسم بأيقونته */
export default function SectionIcon({
  name,
  className = "size-12",
}: {
  name: SectionIconKey;
  className?: string;
}) {
  const Icon = MAP[name] ?? IconGamesColor;
  return <Icon className={`${className} rounded-xl shadow-sm`} />;
}
