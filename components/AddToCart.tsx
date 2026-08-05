"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart";
import { IconCheckCircle } from "./icons";

/** زر إضافة منتج للسلة — يعطي تأكيداً بصرياً قصيراً بعد الضغط */
export default function AddToCart({
  id,
  name,
  price,
  img,
  sale,
}: {
  id: string;
  name: string;
  price: number;
  img?: string;
  /** عليه خصمٌ معروض — يمنع اجتماعه مع كود خصم */
  sale?: boolean;
}) {
  const t = useTranslations("cart");
  const { add } = useCart();
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        add({ id, name, price, img, sale });
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
      className={`min-h-11 w-full rounded-card text-sm font-bold transition-colors ${
        done ? "bg-yellow text-onaccent" : "bg-orange text-onaccent hover:opacity-90"
      }`}
    >
      {done ? (
        <>
          <IconCheckCircle className="size-4" />
          {t("added")}
        </>
      ) : (
        t("add")
      )}
    </button>
  );
}
