import { getTranslations, setRequestLocale } from "next-intl/server";
import BackLink from "@/components/BackLink";
import LoginFlow from "@/components/LoginFlow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });
  return { title: t("welcome") };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-8">
      <BackLink href="/account" />
      <LoginFlow />
    </main>
  );
}
