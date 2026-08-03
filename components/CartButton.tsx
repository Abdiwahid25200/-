"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart";
import { IconCart } from "./icons";

/**
 * أيقونة السلّة في الترويسة — العدّاد يتحدّث فوراً مع كل إضافة.
 *
 * مقاسها من `.hdr .hi` في `globals.css` (٣٨px مربّعاً و٢١px أيقونةً كما
 * في النموذج، وهدفُ لمسها ٤٨px بطبقةٍ شفّافة)، والعدّاد صنف `.dot`.
 */
export default function CartButton() {
  const t = useTranslations("header");
  const { count, ready } = useCart();

  return (
    <Link href="/cart" aria-label={t("cart")} className="transition-colors hover:text-orange">
      <IconCart />
      {ready && count > 0 && <i className="dot">{count}</i>}
    </Link>
  );
}
