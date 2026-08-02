"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { fmt } from "@/lib/format";
import {
  IconBarwaaqo,
  IconChevron,
  IconDoc,
  IconShieldCheck,
  IconSpinner,
  IconUser,
} from "@/components/icons";
import { DEFAULT_POINTS, readPointsSettings } from "@/lib/points";
import { Link } from "@/i18n/navigation";
import { getProfile, isComplete, type Profile } from "@/lib/profile";
import DeleteAccount from "./DeleteAccount";

/**
 * بطاقة الحساب — من أنتِ، ورقمك، والخروج.
 *
 * ⚠️ **لا طلبات هنا ولا نقاط** (قرار صاحبة المتجر): لكلٍّ صفحته —
 *    `/orders` و`/points` — وتُفتحان من قائمة الروابط أسفل الصفحة.
 *    صفحةٌ تجمع كل شيء تُطيل التمرير ولا تُعجّل شيئاً.
 */
export default function AccountPanel() {
  const t = useTranslations("accountPage");
  const locale = useLocale();
  const { user, ready, enabled, signOut } = useAuth();

  const [failed, setFailed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  /** هل نجحت قراءة الملف الشخصي؟ `null` وحده لا يفرّق بين "لا وثيقة" و"فشل" */
  const [profileRead, setProfileRead] = useState(false);
  /** اسم برنامج النقاط كما ضبطتِه — لا ثابتاً في الكود */
  const [pointsBrand, setPointsBrand] = useState(DEFAULT_POINTS.brand);

  useEffect(() => {
    let alive = true;
    void readPointsSettings()
      .then((p) => alive && setPointsBrand(p.brand))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  /** رقم يتغيّر فيُعاد التحميل — زرّ "أعيدي المحاولة" */
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileRead(false);
      return;
    }
    let live = true;
    setFailed(false);
    setProfileRead(false);
    getProfile(user)
      .then((p) => {
        if (!live) return;
        setProfile(p);
        setProfileRead(true);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [user, tick]);

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
      <section className="flex items-center justify-center rounded-card border border-line bg-surface p-6 text-muted">
        {/* ⚠️ كان المحرف … — ممنوع بقرارها، وأيقونةٌ تدور أوضحُ منه */}
        <IconSpinner className="size-5" />
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
      {/* ⚠️ زرّ الخروج في صفٍّ مستقلّ لا بجانب الاسم: كان يجلس في الزاوية
          السفلية اليمنى للبطاقة، وهناك يعوم زرّ الدردشة — فيغطّي طرفه.
          وبريدٌ طويل كان يضغطه حتى يكاد يختفي. */}
      {/* ⚠️ **صورةٌ في الوسط ثمّ صفوف** — كما في النموذج. كانت بطاقةً
          واحدة فيها الاسمُ وزرُّ الخروج، فلا يجد الزبون طلباتِه ولا
          رصيدَه إلا بالقائمة الجانبية. الآن كلّ ما يخصّه أمامه. */}
      <div className="flex flex-col items-center gap-1.5 py-2 text-center">
        <span
          aria-hidden
          className="mb-1 flex size-18 items-center justify-center rounded-full bg-orange/10 text-orange"
        >
          <IconUser className="size-9" />
        </span>
        <span className="text-xl font-bold">{user.displayName || t("guest")}</span>
        {profile?.phone ? (
          <span className="num text-sm text-muted" dir="ltr">
            +{profile.phone}
          </span>
        ) : (
          <span className="truncate text-sm text-muted" dir="ltr">
            {user.email}
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-2.5">
        <AccountRow href="/orders" Icon={IconDoc} label={t("myOrders")} />
        <AccountRow href="/points" Icon={IconBarwaaqo} label={pointsBrand} gold />
        <AccountRow href="/policy" Icon={IconShieldCheck} label={t("policyRow")} />
      </nav>

      <button
        type="button"
        onClick={() => signOut()}
        className="min-h-12 rounded-card border border-line text-sm font-bold text-danger transition-colors hover:border-danger"
      >
        {t("signOut")}
      </button>

      {/* 🔒 حذف الحساب — تشترطه متاجر التطبيقات، وبدونه يُرفض التطبيق */}
      <DeleteAccount />

      {/* الدعوة لإكمال التسجيل تحتاج قراءةً **ناجحة**: بلا وثيقة ⇒ تظهر
          (زبونة جديدة)، وبقراءةٍ فاشلة ⇒ لا تظهر، فلا تُدعى من أكملته */}
      {profileRead && !isComplete(profile) && (
        <Link
          href="/login"
          className="flex min-h-12 items-center justify-center rounded-card border border-dashed border-orange px-4 text-sm font-bold text-orange"
        >
          {t("completeProfile")}
        </Link>
      )}

    </>
  );
}

/** صفٌّ في «حسابي» — صفيحةٌ وأيقونة واسمٌ وسهم، كما في النموذج */
function AccountRow({
  href,
  Icon,
  label,
  gold,
}: {
  href: string;
  Icon: (p: { className?: string }) => React.ReactElement;
  label: string;
  gold?: boolean;
}) {
  return (
    <Link
      href={href}
      className="lift flex min-h-14 items-center gap-3 rounded-card border border-line bg-surface p-3"
    >
      <span
        aria-hidden
        className={`flex size-10 shrink-0 items-center justify-center rounded-card ${
          gold ? "bg-yellow/12 text-yellow" : "bg-orange/10 text-orange"
        }`}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1 truncate font-bold">{label}</span>
      <IconChevron className="size-4 shrink-0 text-muted rtl:rotate-180" />
    </Link>
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
