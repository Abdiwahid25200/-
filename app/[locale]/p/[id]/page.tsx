import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import BackLink from "@/components/BackLink";
import Gallery from "@/components/Gallery";
import AddToCart from "@/components/AddToCart";
import { detailItems, findItem, galleryOf } from "@/lib/items";
import { fin, fmt } from "@/lib/format";
import { itemMeta } from "@/lib/seo";

/**
 * صفحة الصنف — **مثل المواقع العالمية** (قرارها ٠٣-٠٨): معرضُ صورٍ فوق،
 * ثم الاسم والسعر والوصف وزرّ الشراء.
 *
 * ⚠️ **ولها رابطٌ خاصّ** (`/p/{id}`) — وهذا نصف الفائدة: تُرسله في
 *    واتساب وانستغرام («شوفي هذا الحساب») ويفهرسه جوجل، فيأتي منه
 *    زبائن. نافذةٌ تفتح فوق الصفحة لا تُرسَل ولا تُفهرَس.
 *
 * ⚠️ **تُبنى عند أول طلب ثم تُخزَّن دقيقة**: أصنافها في Firestore
 *    تتبدّل من اللوحة، والبناء المسبق يجمّدها على ما كانت وقت النشر.
 */
export const revalidate = 60;
export const dynamicParams = true;

/** الأصناف المعروفة وقت البناء — والباقي يُبنى عند طلبه */
export async function generateStaticParams() {
  return (await detailItems()).map((i) => ({ id: i.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const item = await findItem(id);
  return itemMeta(locale, item, `/p/${id}`);
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const item = await findItem(id);
  if (!item) notFound();

  const t = await getTranslations("item");
  const tc = await getTranslations("common");

  const imgs = galleryOf(item);
  const final = fin({ price: item.price, disc: item.disc });
  const before = item.old ?? (item.disc ? item.price : undefined);
  const buyable = item.status === "on";

  /**
   * ⚠️ **الإلكترونيات تُضاف للسلّة، والحساب يُشترى من صفحة قسمه.**
   *    الحساب **نسخةٌ واحدة لزبونٍ واحد** — ولو دخل السلّة لأمكن أن
   *    يزيد عددَه أو يشتريه اثنان معاً، فيُباع ما لا يُملك. وتدفّق
   *    القسم يسأل بيانات التسليم ويحجزه، فيبقى هو الطريق.
   */
  const backTo =
    item.kind === "elec"
      ? "/electronics"
      : item.kind === "tiktok"
        ? "/tiktok"
        : "/efootball-accounts";

  return (
    <main className="seq page-w scr-body pt-3.5">
      <BackLink href={backTo} />

      {imgs.length > 0 && <Gallery imgs={imgs} alt={item.title} />}

      <div className="flex flex-col gap-2">
        <h1 className="h2S">{item.title}</h1>
        {item.sub && <p className="f13 mu">{item.sub}</p>}

        <div className="flex items-baseline gap-2.5">
          <b className="num f28 text-yellow" dir="ltr">
            {fmt(final)}
          </b>
          {before && before > final && (
            <span className="num f13 mu line-through" dir="ltr">
              {fmt(before)}
            </span>
          )}
          {item.disc ? (
            <span className="num f11 rounded-full bg-yellow px-2 py-0.5 font-bold text-onaccent">
              −{item.disc}%
            </span>
          ) : null}
        </div>
      </div>

      {/* الوصف الكامل — وبلا وصفٍ لا يُترك عنوانٌ فوق فراغ */}
      {item.desc && (
        <section className="card">
          <b className="f13 mb-1.5 block">{t("about")}</b>
          <p className="f13 mu whitespace-pre-line leading-relaxed">{item.desc}</p>
        </section>
      )}

      {!buyable ? (
        <span className="btn o cursor-not-allowed opacity-70">{tc("soon")}</span>
      ) : item.kind === "elec" ? (
        <AddToCart id={item.id} name={item.title} price={final} img={item.img} />
      ) : (
        <Link href={backTo} className="btn">
          {t("buy")}
        </Link>
      )}
    </main>
  );
}
