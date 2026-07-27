import {
  IconBall,
  IconBolt,
  IconDevice,
  IconGames,
  IconMusic,
  IconUser,
} from "@/components/icons";

/**
 * أقسام المتجر — مصدر واحد للحقيقة.
 * تُستخدم في الرئيسية وأي مكان يعرض قائمة الأقسام،
 * فأي تعديل هنا ينعكس بكل مكان تلقائياً.
 */
export const sections = [
  { key: "electronics", href: "/electronics", Icon: IconDevice },
  { key: "pubg", href: "/pubg", Icon: IconBolt },
  { key: "efootball", href: "/efootball", Icon: IconBall },
  { key: "accounts", href: "/accounts", Icon: IconUser },
  { key: "tiktok", href: "/tiktok", Icon: IconMusic },
  { key: "games", href: "/games", Icon: IconGames },
] as const;

/** كل مسارات الموقع — مرجع للتنقّل */
export const routes = [
  "/",
  "/electronics",
  "/pubg",
  "/efootball",
  "/accounts",
  "/efootball-accounts",
  "/tiktok",
  "/games",
  "/help",
  "/policy",
  "/account",
  "/cart",
] as const;
