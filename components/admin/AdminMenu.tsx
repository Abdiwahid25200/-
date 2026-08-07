import {
  IconBolt,
  IconBadge,
  IconCard,
  IconChart,
  IconChat,
  IconGift,
  IconHelp,
  IconHome,
  IconImage,
  IconInvite,
  IconLayout,
  IconMoney,
  IconReceipt,
  IconStore,
  IconTag,
  IconTicket,
  IconText,
  IconTrash,
  IconUsers,
  IconVideo,
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
  | "queue"
  | "orders"
  | "customers"
  | "items"
  | "sections"
  | "slides"
  | "store"
  | "payments"
  | "promos"
  | "texts"
  | "analytics"
  | "bin"
  | "report"
  | "points"
  | "chats"
  | "referrals"
  | "faq"
  | "video"
  | "staff";

export const ICONS: Record<
  AdminTab,
  (p: { className?: string }) => React.ReactElement
> = {
  home: IconHome,
  /* ⚠️ الطابور والطلبات بابان مختلفان فأيقونتاهما مختلفتان
     (القرار المقفول ج): البرق للعمل السريع، والإيصال للسجلّ. */
  queue: IconBolt,
  orders: IconReceipt,
  customers: IconUsers,
  items: IconTag,
  /* ⚠️ `IconGrid` صارت أيقونة **More** في الشريط السفلي — والأقسام
     أخذت `IconLayout`. القرار المقفول (ج): لكل باب أيقونته هو. */
  sections: IconLayout,
  slides: IconImage,
  store: IconStore,
  payments: IconCard,
  /* ⚠️ القرار المقفول (ج): لكل بابٍ أيقونتُه — والوسم للخصم وحده */
  promos: IconTicket,
  /* ⚠️ نصوص الصفحات لها أيقونتها — كانت تشارك `faq` أيقونةَ السؤال */
  texts: IconText,
  analytics: IconChart,
  bin: IconTrash,
  report: IconMoney,
  points: IconGift,
  chats: IconChat,
  referrals: IconInvite,
  faq: IconHelp,
  /* ⚠️ القرار المقفول (ج): للفيديو لوحُه هو — لا يشارك أيقونةَ الصورة
     (`slides`) ولا أيقونةَ المساعدة (`faq`)، وكلاهما في الجوار. */
  video: IconVideo,
  staff: IconBadge,
};
