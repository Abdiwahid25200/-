"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { myOrders, type SavedOrder } from "@/lib/orders";
import OrderCard from "@/components/OrderCard";
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

  if (orders.length === 0)
    return (
      <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
        {t("noOrders")}
      </p>
    );

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} onChanged={() => setTick((n) => n + 1)} />
      ))}
    </ul>
  );
}
