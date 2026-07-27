"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart";

/** زر إضافة منتج للسلة — يعطي تأكيداً بصرياً قصيراً بعد الضغط */
export default function AddToCart({
  id,
  name,
  price,
  img,
}: {
  id: string;
  name: string;
  price: number;
  img?: string;
}) {
  const t = useTranslations("cart");
  const { add } = useCart();
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        add({ id, name, price, img });
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
      className={`min-h-11 w-full rounded-card text-sm font-bold transition-colors ${
        done ? "bg-yellow text-white" : "bg-orange text-white hover:opacity-90"
      }`}
    >
      {done ? "✓ " + t("added") : t("add")}
    </button>
  );
}
