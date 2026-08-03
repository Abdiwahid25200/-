"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart";
import { IconCart } from "./icons";

/**
 * أيقونة السلة بالهيدر — العدّاد يتحدّث فوراً مع كل إضافة.
 *
 * ⚠️ **بلون النصّ لا رماديّاً باهتاً** (النموذج): أيقونتا الترويسة بابان
 *    يُضغطان، والرماديّ الباهت لغةُ ما هو معطَّل. والمربّع ٤٨px يبقى هدفَ
 *    لمسٍ وإن كانت الأيقونة ٢١px كما رسمها النموذج.
 */
export default function CartButton() {
  const t = useTranslations("header");
  const { count, ready } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={t("cart")}
      className="relative flex size-12 items-center justify-center rounded-xl text-text transition-colors hover:text-orange"
    >
      <IconCart className="size-[21px]" />
      {ready && count > 0 && (
        <span className="num absolute end-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[0.62rem] font-extrabold text-onaccent">
          {count}
        </span>
      )}
    </Link>
  );
}
