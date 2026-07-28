import { getTranslations } from "next-intl/server";
import {
  IconTrustGuarantee,
  IconTrustInstant,
  IconTrustSecure,
  IconTrustSupport,
} from "@/components/icons";
import { trustKeys } from "@/lib/content";

/**
 * أيقونات SVG حقيقية بدل الإيموجي — الإيموجي يختلف شكله
 * بين آيفون وأندرويد وويندوز، وهذه ثابتة على كل جهاز.
 */
const icons = {
  instant: IconTrustInstant,
  secure: IconTrustSecure,
  support: IconTrustSupport,
  trusted: IconTrustGuarantee,
} as const;

/** صف الثقة — أربع ضمانات تُطمئن الزبون قبل الشراء */
export default async function TrustRow() {
  const t = await getTranslations("trust");

  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {trustKeys.map((k) => {
        const Icon = icons[k];
        return (
          <div
            key={k}
            className="flex items-center gap-2.5 rounded-card border border-line bg-surface p-3"
          >
            <Icon className="size-9 shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block text-sm font-bold">{t(`${k}.title`)}</span>
              <span className="block text-xs text-muted">{t(`${k}.note`)}</span>
            </span>
          </div>
        );
      })}
    </section>
  );
}
