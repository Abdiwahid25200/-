"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { myOrders, type SavedOrder } from "@/lib/orders";
import { fmt } from "@/lib/format";
import { IconUser } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { getProfile, isComplete, type Profile } from "@/lib/profile";
import Badge from "@/components/Badge";

const statusTone = {
  pending: "soft",
  paid: "blue",
  done: "green",
  cancelled: "outline",
} as const;

/** بطاقة الحساب — دخول بجوجل، ثم عرض طلبات هذا الزبون وحده */
export default function AccountPanel() {
  const t = useTranslations("accountPage");
  const locale = useLocale();
  const { user, ready, enabled, signOut } = useAuth();

  const [orders, setOrders] = useState<SavedOrder[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders(null);
      setProfile(null);
      return;
    }
    let live = true;
    myOrders(user).then((o) => live && setOrders(o));
    getProfile(user).then((p) => live && setProfile(p));
    return () => {
      live = false;
    };
  }, [user]);

  /* ── لم تُضبط إعدادات Firebase بعد ── */
  if (!enabled) {
    return (
      <Guest note={t("soon")}>
        <button
          type="button"
          disabled
          className="min-h-12 w-full rounded-card bg-orange font-bold text-onaccent opacity-40"
        >
          {t("login")}
        </button>
      </Guest>
    );
  }

  if (!ready) {
    return (
      <section className="rounded-card border border-line bg-surface p-6 text-center text-sm text-muted">
        …
      </section>
    );
  }

  /* ── زائر ── */
  if (!user) {
    return (
      <Guest note={t("guestNote")}>
        <Link
          href="/login"
          className="flex min-h-12 w-full items-center justify-center rounded-card bg-orange font-bold text-onaccent transition-opacity hover:opacity-90"
        >
          {t("login")}
        </Link>
      </Guest>
    );
  }

  /* ── مسجَّل الدخول ── */
  return (
    <>
      <section className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange"
        >
          <IconUser className="size-6" />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate font-bold">
            {user.displayName || t("guest")}
          </span>
          <span className="block truncate text-sm text-muted" dir="ltr">
            {user.email}
          </span>
          {profile?.phone && (
            <span className="block truncate text-sm text-muted" dir="ltr">
              +{profile.phone}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => signOut()}
          className="min-h-12 shrink-0 rounded-card border border-line px-4 text-sm font-medium text-muted transition-colors hover:border-danger hover:text-danger"
        >
          {t("signOut")}
        </button>
      </section>

      {!isComplete(profile) && (
        <Link
          href="/login"
          className="flex min-h-12 items-center justify-center rounded-card border border-dashed border-orange px-4 text-sm font-bold text-orange"
        >
          {t("completeProfile")}
        </Link>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">{t("myOrders")}</h2>

        {orders === null ? (
          <p className="text-sm text-muted">…</p>
        ) : orders.length === 0 ? (
          <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
            {t("noOrders")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {orders.map((o) => (
              <li
                key={o.id}
                className="rounded-card border border-line bg-surface p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num font-bold" dir="ltr">
                    {o.code}
                  </span>
                  <Badge tone={statusTone[o.status] ?? "soft"}>
                    {t(`status.${o.status}`)}
                  </Badge>
                  <span className="num ms-auto font-bold text-yellow" dir="ltr">
                    {fmt(o.total)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {o.items.map((i) => i.title).join(" · ")}
                </p>
                {o.createdAt && (
                  <p className="mt-1 text-xs text-muted">
                    {o.createdAt.toLocaleString(locale === "ar" ? "ar" : "en")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Guest({
  note,
  children,
}: {
  note: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("accountPage");
  return (
    <section className="rounded-card border border-line bg-surface p-6 text-center">
      <span
        aria-hidden
        className="mx-auto flex size-16 items-center justify-center rounded-full bg-orange/10 text-orange"
      >
        <IconUser className="size-8" />
      </span>
      <h2 className="mt-3 text-lg font-bold">{t("guest")}</h2>
      <p className="mt-1 text-sm text-muted">{note}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
