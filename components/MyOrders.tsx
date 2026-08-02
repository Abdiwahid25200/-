"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { myOrders, type SavedOrder } from "@/lib/orders";
import OrderCard from "@/components/OrderCard";
import LiveOrder from "@/components/LiveOrder";
import { IconBarwaaqo } from "@/components/icons";
import { fmt } from "@/lib/format";
import { isBuyable, pubg } from "@/lib/data";
import { Link } from "@/i18n/navigation";

/**
 * قائمة طلبات الزبون — **وحدها، بلا بقيّة صفحة الحساب**.
 *
 * صار لها صفحتها `/orders` لأن بند «طلباتي» في القائمة كان ينزل إلى
 * قسمٍ داخل صفحة الحساب: يمرّ الزبون بالنقاط وبياناته قبل أن يصل إلى
 * ما طلبه. الآن كل بند يفتح صفحته.
 *
 * ⚠️ ويقول الخطأ صراحةً: حسابٌ يبدو فارغاً وطلبُه محفوظ أسوأ من رسالة.
 */
export default function MyOrders() {
  const t = useTranslations("accountPage");
  const { user, ready } = useAuth();

  const [orders, setOrders] = useState<SavedOrder[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) {
      setOrders(null);
      return;
    }
    let live = true;
    setFailed(false);
    setOrders(null);
    myOrders(user)
      .then((o) => live && setOrders(o))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [user, tick]);

  if (!ready) return <p className="text-sm text-muted">…</p>;

  if (!user)
    return (
      <Link
        href="/login"
        className="flex min-h-12 items-center justify-center rounded-card bg-orange px-4 font-bold text-onaccent"
      >
        {t("signIn")}
      </Link>
    );

  if (failed)
    return (
      <div className="rounded-card border border-dashed border-danger/60 p-6 text-center text-sm">
        <p className="text-danger">{t("ordersError")}</p>
        <button
          type="button"
          onClick={() => setTick((n) => n + 1)}
          className="mt-3 min-h-12 rounded-card border border-line px-4 font-medium"
        >
          {t("retry")}
        </button>
      </div>
    );

  if (orders === null) return <p className="text-sm text-muted">…</p>;

  /**
   * ⚠️ **الفراغ أخطر شاشة في المتجر** — من وصلها ولم يجد ما يضغطه خرج.
   *    فصارت مكانَ بيع: ثلاث باقاتٍ بأسعارها ووعدُ نقاط أوّل طلب.
   */
  if (orders.length === 0) return <NoOrders />;

  /* ── الطلب الحيّ أوّلاً ──
     ⚠️ **واحدٌ لا أكثر**: من له ثلاثة طلبات تمشي معاً يرى ثلاث بطاقات
        داكنة تملأ الشاشة فيضيع السؤال في الزحام. الأحدث هو الذي ينتظره،
        وبقيّتها تظهر في العمود بحالتها. */
  const live = orders.find((o) => o.status === "pending" || o.status === "paid");
  const rest = orders.filter((o) => o.id !== live?.id);

  return (
    <div className="flex flex-col gap-5">
      {live && <LiveOrder order={live} />}

      {rest.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-sm font-bold text-muted">{t("earlier")}</h2>
          <ul className="flex flex-col gap-3">
            {rest.map((o) => (
              <OrderCard key={o.id} order={o} onChanged={() => setTick((n) => n + 1)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * لا طلبات بعد — **وشاشةٌ تبيع لا تعتذر**.
 * القسائم تُقرأ من `lib/data.ts` فتتبع أسعارك وحالاتك، ولا تُكتب هنا.
 */
function NoOrders() {
  const t = useTranslations("accountPage");
  const te = useTranslations("emptyOrders");
  const live = pubg.filter(isBuyable).slice(0, 3);

  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-line p-6 text-center">
      <IconBarwaaqo className="size-16 text-orange/40" />
      <div className="flex flex-col gap-1">
        <strong className="text-lg">{t("noOrders")}</strong>
        <p className="text-sm text-muted">{te("note")}</p>
      </div>

      {live.length > 0 && (
        <ul className="grid w-full grid-cols-3 gap-2">
          {live.map((p) => (
            <li key={p.id}>
              <Link
                href="/pubg"
                className="lift flex flex-col items-center gap-1 rounded-card border border-line bg-surface p-3"
              >
                <span className="num text-lg font-bold leading-none text-orange">
                  {p.amount}
                </span>
                <span className="text-xs text-muted">{te("uc")}</span>
                <span className="num text-sm font-bold text-yellow">
                  {fmt(p.price)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
