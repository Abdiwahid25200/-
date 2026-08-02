import {
  IconBadge,
  IconCard,
  IconChart,
  IconChat,
  IconGift,
  IconGrid,
  IconHelp,
  IconHome,
  IconImage,
  IconInvite,
  IconMoney,
  IconReceipt,
  IconStore,
  IconTag,
  IconTrash,
  IconUsers,
} from "@/components/icons";

/**
 * أسماء شاشات اللوحة وأيقوناتها — **مصدر واحد** يقرأ منه التنقّل كلّه.
 *
 * ⚠️ كانت هنا قائمةٌ جانبية (همبرغر). أُزيلت مع اعتماد لغة «العدّاد»:
 *    التنقّل صار **أربعة تبويبات ظاهرة أسفل الشاشة** لا قائمةً مخفيّة،
 *    فلم يبقَ من الملف إلا ما يُشترك فيه: النوع والأيقونات.
 *
 * ⚠️ **لكل شاشة أيقونتها هي** — لا أيقونة واحدة تتكرّر في ستّة أبواب.
 *    الأيقونة المكرّرة لا تدلّ على شيء، فتصير زينةً لا علامة.
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
  orders: IconReceipt,
  customers: IconUsers,
  items: IconTag,
  sections: IconGrid,
  slides: IconImage,
  store: IconStore,
  payments: IconCard,
  texts: IconHelp,
  analytics: IconChart,
  bin: IconTrash,
  report: IconMoney,
  points: IconGift,
  chats: IconChat,
  referrals: IconInvite,
  faq: IconHelp,
  staff: IconBadge,
};
