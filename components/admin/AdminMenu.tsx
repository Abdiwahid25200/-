import {
  IconBolt,
  IconCart,
  IconChat,
  IconDevice,
  IconDoc,
  IconGames,
  IconGlobe,
  IconHome,
  IconShieldCheck,
  IconSparkle,
  IconTrash,
  IconUser,
} from "@/components/icons";

/**
 * أسماء شاشات اللوحة وأيقوناتها — **مصدر واحد** يقرأ منه التنقّل كلّه.
 *
 * ⚠️ كانت هنا قائمةٌ جانبية (همبرغر). أُزيلت مع اعتماد لغة «العدّاد»:
 *    التنقّل صار **أربعة تبويبات ظاهرة أسفل الشاشة** لا قائمةً مخفيّة،
 *    فلم يبقَ من الملف إلا ما يُشترك فيه: النوع والأيقونات.
 */
export type AdminTab =
  | "home"
  | "orders"
  | "customers"
  | "items"
  | "sections"
  | "slides"
  | "store"
  | "payments"
  | "texts"
  | "analytics"
  | "bin"
  | "report"
  | "points"
  | "chats"
  | "referrals"
  | "faq"
  | "staff";

export const ICONS: Record<
  AdminTab,
  (p: { className?: string }) => React.ReactElement
> = {
  home: IconHome,
  orders: IconCart,
  customers: IconUser,
  items: IconDevice,
  sections: IconGames,
  slides: IconGlobe,
  store: IconShieldCheck,
  payments: IconCart,
  texts: IconDoc,
  analytics: IconBolt,
  bin: IconTrash,
  report: IconDoc,
  points: IconSparkle,
  chats: IconChat,
  referrals: IconUser,
  faq: IconChat,
  staff: IconUser,
};
