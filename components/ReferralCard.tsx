"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { ensureMyCode, type MyReferral } from "@/lib/referrals";
import { IconWhatsApp } from "./icons";
import { readPointsSettings, type PointsSettings } from "@/lib/points";

/**
 * بطاقة الدعوة — رمز الزبون، ومشاركته، وما أثمر منه.
 *
 * 💡 الجائزة **بعد أوّل طلبٍ مدفوع** لا عند التسجيل. لذلك النصّ يقول
 *    ذلك صراحة: زبونٌ ينتظر نقاطاً لا تأتي يظنّ النظام معطّلاً، فيشتكي
 *    ويترك. الوضوح هنا أرخص من أي اعتذار.
 *
 * ⚠️ ولا تُعرض البطاقة لزائرٍ غير مسجَّل ولا حين تُطفأ الدعوة من اللوحة.
 */
export default function ReferralCard({ settings: given }: { settings?: PointsSettings }) {
  const t = useTranslations("points");
  const { user } = useAuth();
  const [loaded, setLoaded] = useState<PointsSettings | null>(given ?? null);
  const [r, setR] = useState<MyReferral | null>(null);
  const [copied, setCopied] = useState(false);
  /** عنوان الموقع — يُقرأ بعد التركيب لا أثناء الرسم (وإلا اختلف الرسمان) */
  const [url, setUrl] = useState("");

  useEffect(() => setUrl(window.location.origin), []);

  const settings = given ?? loaded;

  // تُقرأ الإعدادات هنا حين لا تُمرَّر، فتصلح البطاقة لصفحةٍ مستقلّة
  useEffect(() => {
    if (given) return;
    let alive = true;
    void readPointsSettings().then((v) => alive && setLoaded(v));
    return () => {
      alive = false;
    };
  }, [given]);

  useEffect(() => {
    if (!user || !settings?.refOn) return;
    let alive = true;
    void ensureMyCode(user).then((v) => alive && setR(v));
    return () => {
      alive = false;
    };
  }, [user, settings?.refOn]);

  if (!user || !settings?.refOn || !r?.code) return null;

  const msg = t("inviteMsg", {
    brand: settings.brand,
    code: r.code,
    n: settings.refInvitee,
    url,
  });

  async function copy() {
    if (!r) return;
    try {
      await navigator.clipboard.writeText(r.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* متصفّح يمنع النسخ — الرمز معروضٌ أمامه ينسخه بيده */
    }
  }

  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h3 className="font-bold">{t("inviteTitle")}</h3>
      <p className="mt-1 text-sm text-muted">
        {t("inviteNote", { a: settings.refInviter, b: settings.refInvitee })}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span className="min-w-0 flex-1 rounded-card border border-dashed border-orange bg-orange/5 px-3 py-3 text-center">
          <span className="block text-xs text-muted">{t("inviteCode")}</span>
          <strong
            className="num block text-xl font-bold tracking-widest text-orange rtl:tracking-normal"
            dir="ltr"
          >
            {r.code}
          </strong>
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="min-h-12 shrink-0 rounded-card border border-line px-4 text-sm font-bold"
        >
          {copied ? t("inviteCopied") : t("inviteCopy")}
        </button>
      </div>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(msg)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="lift mt-3 flex min-h-12 items-center justify-center gap-2 rounded-card bg-orange px-4 font-bold text-onaccent"
      >
        <IconWhatsApp className="size-5" />
        {t("inviteShare")}
      </a>

      <p className="mt-3 text-sm text-muted">
        {r.count > 0
          ? t("inviteCount", { n: r.count, p: r.earned })
          : t("inviteNone")}
      </p>
    </section>
  );
}
