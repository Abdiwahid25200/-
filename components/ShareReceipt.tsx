"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fmt } from "@/lib/format";
import { doneWord } from "@/lib/deliver";
import { mergedSite } from "@/lib/overrides";
import { IconBall, IconBolt, IconDevice, IconMusic, IconShare, IconWhatsApp } from "@/components/icons";

/**
 * 📸 **إيصالٌ يُشارَك** — إعلانك المجّاني، بيد الزبون نفسه.
 *
 * اللاعب يصوّر كل شيء لحالته: تشكيلته، فوزه، شحنته. وهو يفعل ذلك اليوم
 * بلقطةٍ من شاشة طلبٍ باهتة لا اسم لك فيها. فبدل أن نتركه يعلن عنك
 * بصورةٍ رديئة، نعطيه صورةً **يفخر بنشرها** وعليها اسمُ متجرك.
 *
 * ⚠️ **ولا يُعرض إلا بعد التسليم**: صورةٌ تقول «شُحنت» وطلبُه لم يصل بعد
 *    تصنع شكوى لا فخراً. ولا تُعرض على المُلغى أصلاً.
 *
 * ⚠️ 🔒 **ولا رمزَ طلبٍ فيها ولا آيدي كامل**: هذه صورةٌ تذهب إلى حالةٍ
 *    يراها ثلاثون شخصاً — فيها ما اشترى وكم استغرق واسمُ المتجر، وليس
 *    فيها ما يُتَتبَّع به حسابُه.
 *
 * ⚠️ **والحفظ برسم اللوحة (`canvas`) لا بمكتبة**: إخراجُ عنصر HTML صورةً
 *    يحتاج مكتبةً بحجمها كلّه يحملها كل زائر لأجل زرٍّ يُضغط مرّة. ورسمُ
 *    مستطيلٍ وتدرّجٍ وثلاثة سطور بأربعين سطراً من الكود أرخص من ذلك بكثير.
 */

const icons: Record<string, (p: { className?: string }) => React.ReactElement> = {
  pubg: IconBolt,
  efootball: IconBall,
  tiktok: IconMusic,
  accounts: IconBall,
  elec: IconDevice,
};

export default function ShareReceipt({
  kind,
  title,
  minutes,
}: {
  kind: string;
  title: string;
  /** كم استغرق التسليم — صفرٌ ⇒ لا يُذكر الوقت */
  minutes: number;
}) {
  const t = useTranslations("share");
  const td = useTranslations("accountPage");
  const locale = useLocale();
  const box = useRef<HTMLDivElement>(null);

  const [brand, setBrand] = useState("Ramaan Store");
  const [host, setHost] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHost(window.location.host);
    void mergedSite()
      .then((s) => setBrand(s.brand || "Ramaan Store"))
      .catch(() => {});
  }, []);

  const Icon = icons[kind] ?? IconDevice;
  const word = td(`done.${doneWord(kind)}`);
  const took = minutes > 0 ? t("took", { n: minutes }) : "";

  const msg = [`${title} — ${word}`, took, host].filter(Boolean).join("\n");
  const waHref = `https://wa.me/?text=${encodeURIComponent(msg)}`;

  /** يرسم البطاقة على لوحةٍ ثم يحفظها — بلا مكتبة ولا خطٍّ خارجي */
  async function save() {
    setBusy(true);
    try {
      const W = 1080;
      const H = 1350;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const g = c.getContext("2d");
      if (!g) return;

      const bg = g.createLinearGradient(0, 0, W * 0.6, H);
      bg.addColorStop(0, "#078578");
      bg.addColorStop(0.55, "#05655c");
      bg.addColorStop(1, "#044f48");
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);

      /* قوسان باهتان — أثرُ ختمٍ على ورق التذكرة، كما في الرئيسية */
      g.strokeStyle = "rgba(255,255,255,.12)";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(W * 0.9, H * 0.06, 340, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(W * 0.08, H * 0.95, 300, 0, Math.PI * 2);
      g.stroke();

      g.textAlign = "center";
      g.fillStyle = "rgba(255,255,255,.85)";
      g.font = "600 34px system-ui, -apple-system, sans-serif";
      g.fillText(word.toUpperCase(), W / 2, 300);

      g.fillStyle = "#ffffff";
      g.font = "800 104px system-ui, -apple-system, sans-serif";
      /* عنوانٌ طويل يُقصّ بدل أن يخرج من الصورة */
      g.fillText(cut(g, title, W - 160), W / 2, 470);

      if (took) {
        g.fillStyle = "rgba(255,255,255,.8)";
        g.font = "500 42px system-ui, -apple-system, sans-serif";
        g.fillText(took, W / 2, 560);
      }

      /* خطّ التقطيع — نفس قسيمة الباقات */
      g.strokeStyle = "rgba(255,255,255,.45)";
      g.lineWidth = 4;
      g.setLineDash([14, 14]);
      g.beginPath();
      g.moveTo(120, H - 330);
      g.lineTo(W - 120, H - 330);
      g.stroke();
      g.setLineDash([]);

      g.fillStyle = "#ffffff";
      g.font = "800 62px system-ui, -apple-system, sans-serif";
      g.fillText(brand, W / 2, H - 220);
      g.fillStyle = "rgba(255,255,255,.75)";
      g.font = "500 40px ui-monospace, Menlo, monospace";
      g.fillText(host, W / 2, H - 150);

      const url = c.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${brand.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* البطاقة كما ستُحفظ — يراها قبل أن يشاركها */}
      <div
        ref={box}
        dir="ltr"
        className="relative flex flex-col items-center gap-3 overflow-hidden rounded-card p-5 text-center text-white"
        style={{
          background:
            "radial-gradient(130% 120% at 15% 0%, #0e8a7c 0%, transparent 62%), linear-gradient(160deg, #078578 0%, #04443f 100%)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -end-10 size-44 rounded-full border border-white/10"
        />

        <span className="relative inline-flex items-center rounded-full bg-white/16 px-3.5 py-1 text-xs font-bold tracking-[0.14em]">
          {word}
        </span>

        <span
          aria-hidden
          className="relative flex size-13 items-center justify-center rounded-card border border-white/20 bg-white/14"
        >
          <Icon className="size-7" />
        </span>

        <strong className="relative block text-2xl leading-tight">{title}</strong>
        {took && <span className="relative block text-xs opacity-80">{took}</span>}

        <span
          aria-hidden
          className="relative my-1 h-px w-full"
          style={{
            background:
              "repeating-linear-gradient(to left, rgba(255,255,255,.4) 0 6px, transparent 6px 12px)",
          }}
        />

        <span className="relative block text-xs opacity-90">
          {t("alsoYou")} · <span className="num font-bold">{host}</span>
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="lift flex min-h-12 items-center justify-center gap-2 rounded-card bg-[#25d366] px-4 font-bold text-white"
        >
          <IconWhatsApp className="size-5 rounded-md" />
          {t("send")}
        </a>
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy}
          className="flex min-h-12 items-center justify-center gap-2 rounded-card border border-line px-4 font-bold disabled:opacity-60"
        >
          <IconShare className="size-5" />
          {t("save")}
        </button>
      </div>
    </div>
  );
}

/** يقصّ النصّ حتى يسع العرض — فلا يخرج عنوانٌ طويل من الصورة */
function cut(g: CanvasRenderingContext2D, text: string, max: number): string {
  if (g.measureText(text).width <= max) return text;
  let s = text;
  while (s.length > 4 && g.measureText(`${s}…`).width > max) s = s.slice(0, -1);
  return `${s}…`;
}
