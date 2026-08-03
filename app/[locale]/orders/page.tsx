import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";
import MyOrders from "@/components/MyOrders";
import { privateMeta } from "@/lib/seo";

/** صفحة الطلبات — بندُ «طلباتي» في القائمة يفتحها مباشرة */
export const metadata = privateMeta;

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("accountPage");
  const te = await getTranslations("eyebrow");

  return (
    <main className="page-w scr-body pt-3.5">
      <BackLink href="/account" />
      <SectionHead eyebrow={te("account")} title={t("myOrders")} note={t("note")} />
      <MyOrders />
    </main>
  );
}
