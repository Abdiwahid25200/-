import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";
import AccountPanel from "@/components/AccountPanel";
import { privateMeta } from "@/lib/seo";

/**
 * صفحة الحساب — **بطاقة واحدة لا غير** (قرار صاحبة المتجر):
 * من أنتِ · بريدك · رقمك · زرّ الخروج.
 *
 * ⚠️ ولا طلبات ولا نقاط ولا قائمة روابط هنا. لكلٍّ صفحته
 *    (`/orders` · `/points` · `/cart` · `/help`) وكلّها في القائمة
 *    الجانبية. صفحةٌ تجمع كل شيء تُطيل التمرير ولا تُعجّل شيئاً.
 */
export const metadata = privateMeta;

export default async function AccountPage({
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
      <BackLink href="/" />
      <SectionHead eyebrow={te("account")} title={t("title")} note={t("note")} />

      <AccountPanel />
    </main>
  );
}
