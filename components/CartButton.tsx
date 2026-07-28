"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart";
import { IconCart } from "./icons";

/** أيقونة السلة بالهيدر — العدّاد يتحدّث فوراً مع كل إضافة */
export default function CartButton() {
  const t = useTranslations("header");
  const { count, ready } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={t("cart")}
      className="relative flex size-12 items-center justify-center rounded-card text-muted transition-colors hover:bg-bg hover:text-orange"
    >
      <IconCart />
      {ready && count > 0 && (
        <span className="absolute end-1.5 top-1.5 flex min-w-5 items-center justify-center rounded-full bg-orange px-1 text-xs font-bold text-onaccent">
          {count}
        </span>
      )}
    </Link>
  );
}
