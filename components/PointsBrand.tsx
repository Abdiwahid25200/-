"use client";

import Image from "next/image";
import { POINTS_BRAND, POINTS_ICON, type PointsSettings } from "@/lib/points";
import { optimizable } from "@/lib/img";

/**
 * هويّة برنامج النقاط — **الشعار والاسم معاً، أينما ذُكرت النقاط**.
 *
 * برنامج الولاء اسمٌ يحفظه الزبون ويطلبه، لا «نقاط» مجرّدة. فحيثما
 * ظهرت النقاط — بطاقة الحساب، صفّ الخصم في السلة، القائمة الجانبية —
 * ظهر الشعار معها، فتترسّخ العلامة بدل أن تتكرّر كلمة.
 *
 * والاسم والشعار يُغيَّران من اللوحة (تبويب Points)، فلا يلزم مبرمج
 * لتبديل اسم البرنامج أو صورته لاحقاً.
 */
export default function PointsBrand({
  settings,
  size = 28,
  className = "",
  showName = true,
}: {
  settings?: Pick<PointsSettings, "brand" | "logo">;
  size?: number;
  className?: string;
  showName?: boolean;
}) {
  const src = settings?.logo || POINTS_ICON;
  const name = settings?.brand || POINTS_BRAND;

  return (
    <span className={`flex min-w-0 items-center gap-2 ${className}`}>
      {src &&
        (optimizable(src) ? (
          <Image
            src={src}
            alt=""
            width={size}
            height={size}
            className="shrink-0 rounded-[8px]"
            style={{ width: size, height: size }}
          />
        ) : (
          // رابط من مضيف لا نعرفه — يُعرض كما هو بدل إطار مكسور
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            width={size}
            height={size}
            className="shrink-0 rounded-[8px] object-cover"
            style={{ width: size, height: size }}
          />
        ))}
      {showName && <span className="truncate font-bold">{name}</span>}
    </span>
  );
}
