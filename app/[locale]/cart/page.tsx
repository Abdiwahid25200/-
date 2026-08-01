import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";
import CartView from "./CartView";
import { privateMeta } from "@/lib/seo";

/** صفحة الزبون الخاصّة — لا تُفهرَس */
export const metadata = privateMeta;

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cart");
  const te = await getTranslations("eyebrow");

  return (
    <main className="page-w px-4 py-6">
      <BackLink href="/" />
      <SectionHead
        eyebrow={te("cart")} title={t("title")} note={t("note")} />
      <CartView />
    </main>
  );
}
