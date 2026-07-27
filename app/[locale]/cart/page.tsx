import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import CartView from "./CartView";

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cart");

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <SectionHead title={t("title")} note={t("note")} />
      <CartView />
    </main>
  );
}
