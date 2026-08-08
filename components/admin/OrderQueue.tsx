"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { readCosts, type Costs } from "@/lib/costs";
import { useAccess } from "@/lib/adminAccess";
import { doneLabel } from "@/lib/deliver";
import { planOf, type Plan } from "@/lib/orderPlan";
import {
  allOrders,
  claimOrder,
  customerOf,
  orderFree,
  setOrderStatus,
  type AdminOrder,
  type Customer,
  type OrderStatus,
} from "@/lib/adminOrders";
import {
  DEFAULT_POINTS,
  orderPoints,
  readPointsMap,
  readPointsSettings,
  type PointsMap,
  type PointsSettings,
} from "@/lib/points";
import {
  IconBolt,
  IconChecks,
  IconChevron,
  IconReceipt,
  IconSpinner,
  IconWhatsApp,
} from "@/components/icons";

/**
 * **الطابور — طلبٌ واحد، زرٌّ واحد، ثم التالي.**
 *
 * قالت: **«لا أتعب بالطلبات — ابنِ لي شكلاً أسهل».** والتعب لم يكن في
 * الشاشة القديمة سوءاً، بل في **عدد القرارات**: تختارين المدى، ثم
 * الحالة، ثم تبحثين بالعين في قائمة، ثم تفتحين طلباً، ثم تقرئين، ثم
 * تنسخين الآيدي، ثم ترجعين، ثم تفتحين الذي يليه. ثمانِ خطواتٍ لطلبٍ
 * عمله ضغطتان.
 *
 * وهنا **لا قائمة ولا مرشّح ولا تاريخ**: الطلب الأقدم يملأ الشاشة بكل ما
 * يلزم لتنفيذه، وزرٌّ واحد كبير ينقله خطوته التالية، **ثم يأتي الذي
 * يليه من تلقاء نفسه**. تنتهين حين تفرغ الشاشة.
 *
 * | القرار | لماذا |
 * |---|---|
 * | الأقدم أوّلاً | الزبون الذي ينتظر منذ ساعة أولى ممّن طلب قبل دقيقة — والقائمة كانت تعرض الأحدث أوّلاً |
 * | زرٌّ رئيسيّ واحد | حالة الطلب تحدّد الخطوة: `pending` ⇐ «قبضتُ المال»، `paid` ⇐ كلمة قسمه |
 * | الآيدي بخطٍّ كبير وزرّ نسخ | هذا **العمل نفسه**: تنسخينه وتلصقينه في تطبيق الشحن |
 * | «تخطّي» لا «رجوع» | الطلب الذي لا تستطيعين تنفيذه الآن يُؤجَّل ولا يُفقد |
 *
 * ⚠️ **ونصّ التأكيد من `lib/orderPlan.ts`** — هو نفسه الذي تقوله شاشة
 *    الطلبات الكاملة. شاشتان تمسّان النقاط، ونصّان مختلفان يعنيان أن
 *    إحداهما ستكذب يوماً.
 *
 * ⚠️ **والمنتهي لا يدخل الطابور**: الطابور ما ينتظرك، والمنتهي تاريخٌ
 *    مكانه الشاشة الكاملة (بحثها ومداها وملفّ إكسل).
 */

/** كم مضى — «12 min» · «3 h» · «2 d» */
function ago(d: Date | null | undefined): string {
  if (!d) return "";
  const m = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h` : `${Math.round(h / 24)} d`;
}

/** متأخّر: انتظر فوق ساعة — الشريط الأحمر */
const LATE_MIN = 60;
const lateBy = (d: Date | null | undefined) =>
  d ? (Date.now() - d.getTime()) / 60000 >= LATE_MIN : false;

const itemLine = (o: AdminOrder) =>
  (o.items ?? [])
    .map((i) => `${i.title}${(i.qty ?? 1) > 1 ? ` ×${i.qty}` : ""}`)
    .join(" · ") || o.code;

/** عنوان خانة البيانات — يتبع القسم، فتعرف ما تنسخه قبل أن تقرأه */
function fieldLabel(kind: string | undefined): string {
  switch (String(kind ?? "")) {
    case "pubg":
      return "Player ID — top this up";
    case "efootball":
      return "eFootball ID";
    case "tiktok":
    case "accounts":
      return "Send the account here";
    case "elec":
      return "Deliver to";
    default:
      return "Customer details";
  }
}

export default function OrderQueue({ onAll }: { onAll: () => void }) {
  const { user } = useAuth();
  const access = useAccess();
  const owner = access.role === "owner";
  const me = (user?.email ?? "").toLowerCase();

  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [err, setErr] = useState(false);
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [who, setWho] = useState<Customer | null>(null);
  /** ما أنجزتِه في هذه الجلسة — يظهر في شاشة النهاية */
  const [done, setDone] = useState(0);

  const [settings, setSettings] = useState<PointsSettings>(DEFAULT_POINTS);
  const [map, setMap] = useState<PointsMap>({});
  /* 🛡️ التكاليف — تُقرأ مرّةً، ومنها ربحُ كل طلبٍ قبل تأكيده */
  const [costs, setCosts] = useState<Costs>({});
  useEffect(() => {
    void readCosts().then(setCosts);
  }, []);

  const load = useCallback(async () => {
    setErr(false);
    try {
      const [list, s, m] = await Promise.all([
        allOrders(),
        readPointsSettings(),
        readPointsMap(),
      ]);
      setOrders(list);
      setSettings(s);
      setMap(m);
    } catch {
      setErr(true);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * ما ينتظرك — **الأقدم أوّلاً**.
   *
   * ⚠️ والمنتهي والمرفوض خارجه: الطابور طابورُ عملٍ لا سجلّ.
   * ⚠️ و`orderFree` يُبقي على قاعدة الحجز: المساعد لا يرى ما قَبِله غيره.
   */
  const queue = useMemo(
    () =>
      (orders ?? [])
        .filter((o) => o.status === "pending" || o.status === "paid")
        .filter((o) => orderFree(o, me, owner))
        .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)),
    [orders, me, owner],
  );

  const o: AdminOrder | undefined = queue[Math.min(i, queue.length - 1)];

  /* رقم الزبون — يُقرأ للطلب المعروض وحده، لا لمئة طلبٍ في القائمة */
  useEffect(() => {
    setWho(null);
    setCopied(false);
    setAsk(null);
    if (!o?.uid) return;
    let live = true;
    void customerOf(o.uid).then((c) => live && setWho(c));
    return () => {
      live = false;
    };
  }, [o?.uid, o?.id]);

  /**
   * 🔒 حجزُ الطلب للمساعد بمجرّد وصوله إليه.
   *
   * بدونه يفتح مساعدان الطابور معاً فيريان الطلب نفسه أوّلاً، فيشحنه
   * كلاهما. وصاحبةُ المتجر لا تحتاجه: هي ترى كل شيء أصلاً.
   */
  useEffect(() => {
    if (!o || owner || o.claimedBy) return;
    void claimOrder(o.id, me, user?.displayName ?? me);
  }, [o, owner, me, user?.displayName]);

  if (orders === null)
    return (
      <p className="flex items-center justify-center gap-2 p-8 text-sm text-muted">
        <IconSpinner className="size-4" /> Loading…
      </p>
    );

  if (err)
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-muted">Could not read the orders.</p>
        <button type="button" onClick={() => void load()} className="adm-btn">
          Try again
        </button>
      </div>
    );

  /* ── لا شيء ينتظر ── */
  if (!o)
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-orange/10 text-orange">
          <IconChecks className="size-8" />
        </span>
        <span>
          <b className="block text-lg">Nothing is waiting</b>
          <span className="block text-sm text-muted">
            {done > 0
              ? `You handled ${done} ${done === 1 ? "order" : "orders"} just now.`
              : "Every order is handled. Come back when one arrives."}
          </span>
        </span>
        {/* ⚠️ كان `className="go"` — و`.go` معرّفةٌ داخل `.adm-needs`
            و`.adm-bar` وحدهما، فخرج الزرّ هنا بلا تنسيق. */}
        <button type="button" onClick={onAll} className="adm-btn">
          See all orders
          <IconChevron className="size-4" />
        </button>
      </div>
    );

  const late = lateBy(o.createdAt);
  const due = orderPoints(o.items ?? [], map, settings.perItem);
  /* الخطوة التالية لهذا الطلب — الحالة تقرّرها، لا أنتِ */
  const next: OrderStatus = o.status === "pending" ? "paid" : "done";
  const nextWord = next === "paid" ? "Mark paid" : doneLabel(o.kind);
  const plan: Plan | null = ask ? planOf(o, ask, due, settings, false, 0) : null;

  const total = Number(o.total) || 0;
  const spent = Number(o.usePoints) || Number(o.pointsSpent) || 0;

  /* 🛡️ تكلفة أصناف الطلب — بلا تكلفةٍ مكتوبة لا رقم ولا تخمين */
  const lines = o.items ?? [];
  const known = lines.filter((l) => costs[l.id] !== undefined && costs[l.id]! > 0);
  const cost = known.reduce((n, l) => n + (costs[l.id] ?? 0) * (Number(l.qty) || 1), 0);
  /* الضريبة ليست ربحاً — تُطرح من الإيراد قبل المقارنة بالتكلفة */
  const margin =
    known.length === lines.length && lines.length > 0
      ? Math.round((total - (Number(o.tax) || 0) - cost) * 100) / 100
      : null;
  const phone = (who?.phone ?? "").replace(/\D/g, "");

  async function move(to: OrderStatus) {
    if (!o) return;
    setAsk(null);
    setBusy(true);
    setNote(null);
    const res = await setOrderStatus(o.id, to, map, settings, {
      email: me,
      name: user?.displayName ?? me,
    });
    setBusy(false);

    if (!res.ok) {
      setNote("Could not save — try again");
      return;
    }

    /* ⚠️ **يخرج من الطابور بلا انتظار القراءة**: إعادة القراءة تأخذ
       ثانيةً أو ثانيتين، وبقاءُ الطلب المنتهي على الشاشة يجعلها تضغط
       الزرّ مرّتين. فيُشطب محلّياً أوّلاً، ثم تُصحَّح القائمة من القاعدة. */
    if (to !== "paid") setDone((n) => n + 1);
    setOrders((list) =>
      (list ?? []).map((x) => (x.id === o.id ? { ...x, status: to } : x)),
    );
    setNote(
      res.delta > 0
        ? `Done — ${res.delta} points added to the customer`
        : to === "paid"
          ? "Marked paid — now do it and press the green button"
          : "Done — it left your queue",
    );
    void load();
  }

  function copyId() {
    if (!o?.account) return;
    void navigator.clipboard?.writeText(o.account).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => setNote("Could not copy — read it and type it"),
    );
  }

  const waLink = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        `Ramaan Store — order ${o.code}: ${itemLine(o)}`,
      )}`
    : null;

  return (
    <div className="flex flex-col gap-3">
      {/* ── أين أنتِ من الطابور ── */}
      <div className="flex items-center justify-between gap-2">
        <span className="adm-ttl !mb-0">
          Order {Math.min(i, queue.length - 1) + 1} of {queue.length}
        </span>
        <button type="button" onClick={onAll} className="text-sm font-bold text-orange">
          All orders
        </button>
      </div>

      <div className="flex gap-1" aria-hidden>
        {queue.slice(0, 12).map((q, n) => (
          <span
            key={q.id}
            className={`h-1 flex-1 rounded-full ${
              n < i ? "bg-orange/30" : n === i ? "bg-orange" : "bg-line"
            }`}
          />
        ))}
      </div>

      {/* ── الطلب نفسه ── */}
      <section
        className={`flex flex-col gap-3 overflow-hidden rounded-card border bg-surface p-4 ${
          late ? "border-danger/50" : "border-line"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className={`adm-pill ${late ? "late" : "wait"}`}>
              {o.status === "pending" ? "Not paid yet" : "Paid — do it now"}
            </span>
            <b className="mt-2 block text-lg leading-tight">{itemLine(o)}</b>
            <span className="num block text-sm text-muted" dir="ltr">
              {o.code} · {o.kind || "order"} · {ago(o.createdAt)} ago
            </span>
          </span>
          <b className="num shrink-0 text-xl text-yellow" dir="ltr">
            ${total.toFixed(2)}
          </b>
        </div>

        {/**
         * 🛡️ **ربحك في هذا الطلب — قبل «مدفوع» لا بعد الشهر.**
         *
         * طلبها (٠٤-٠٨): «اجعل الثلاثة لا تخسرني». والخصمُ والكودُ
         * والضريبة تتقاطع في هذا السطر: بضاعةٌ بكذا، ناقص كذا، وتكلفتك
         * كذا. فإن كان الربح سالباً رأيتِه **بالأحمر وأنت واقفةٌ عند
         * الزرّ**، لا في حساب آخر الشهر.
         *
         * ⚠️ **ولا يظهر بلا تكلفة**: من لم تُكتب تكلفتُه لا يُخمَّن له
         *    ربح — ورقمٌ مخمَّن أسوأ من لا رقم.
         */}
        {margin !== null && (
          <p
            className={`num rounded-card p-3 text-sm ${
              margin < 0 ? "adm-warn" : "bg-bg text-muted"
            }`}
            dir="ltr"
          >
            cost ${cost.toFixed(2)} · you make ${margin.toFixed(2)}
            {o.promo ? ` · code ${o.promo} −$${(Number(o.promoOff) || 0).toFixed(2)}` : ""}
            {o.tax ? ` · tax $${(Number(o.tax) || 0).toFixed(2)}` : ""}
          </p>
        )}

        {o.reserved && (
          <p className="adm-warn soft text-sm">
            <span>Reserved while you were closed — the customer is waiting.</span>
          </p>
        )}

        {/* ── ما تنسخينه لتنفيذ الطلب ── */}
        {o.account && (
          <div className="rounded-card border border-dashed border-orange/50 bg-orange/5 p-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-muted">
              {fieldLabel(o.kind)}
            </span>
            <div className="mt-1 flex items-center gap-2">
              <b className="num min-w-0 flex-1 break-all text-xl" dir="ltr">
                {o.account}
              </b>
              <button
                type="button"
                onClick={copyId}
                className={`min-h-11 shrink-0 rounded-card px-3 font-bold ${
                  copied ? "bg-success/15 text-success" : "bg-orange text-onaccent"
                }`}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* ── من هو، وكيف يُدفع ── */}
        <dl className="flex flex-col gap-1 text-sm">
          <Line k="Customer" v={o.name || who?.name || o.email || "—"} />
          <Line k="Pays with" v={o.payMethod || (o.paidBy === "points" ? "Points" : "—")} />
          {spent > 0 && <Line k="Points used" v={`${spent} pts`} />}
          {Number(o.buyPoints) > 0 && (
            <Line k="Buying points" v={`${o.buyPoints} pts`} />
          )}
        </dl>

        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center justify-center gap-2 rounded-card border border-line font-bold"
          >
            <IconWhatsApp className="size-5" />
            Message the customer
          </a>
        )}
      </section>

      {note && <p className="adm-warn soft text-sm"><span>{note}</span></p>}

      {/* ── التأكيد: يقول ماذا سيحدث، لا «هل أنتِ متأكّدة» ── */}
      {plan ? (
        <section className="flex flex-col gap-2 rounded-card border-2 border-orange bg-orange/5 p-3">
          <b>{plan.title}</b>
          <span className="text-sm text-muted">{plan.note}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void move(plan.to)}
              disabled={busy}
              className="min-h-12 flex-1 rounded-card bg-orange font-bold text-onaccent disabled:opacity-40"
            >
              {plan.yes}
            </button>
            <button
              type="button"
              onClick={() => setAsk(null)}
              className="min-h-12 rounded-card border border-line px-4 font-bold"
            >
              Back
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* ── الزرّ الواحد ── */}
          <button
            type="button"
            onClick={() => setAsk(next)}
            disabled={busy}
            className="flex min-h-14 items-center justify-center gap-2 rounded-card bg-orange text-lg font-bold text-onaccent disabled:opacity-40"
          >
            {busy ? <IconSpinner className="size-5" /> : <IconBolt className="size-5" />}
            {nextWord}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setI((n) => Math.min(n + 1, queue.length - 1))}
              disabled={busy || i >= queue.length - 1}
              className="min-h-12 flex-1 rounded-card border border-line font-bold disabled:opacity-40"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={() => setAsk("cancelled")}
              disabled={busy}
              className="min-h-12 rounded-card border border-danger/40 px-4 font-bold text-danger disabled:opacity-40"
            >
              Reject
            </button>
          </div>
        </>
      )}

      <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted">
        <IconReceipt className="size-3.5" />
        Finished ones live in All orders
      </p>
    </div>
  );
}

/**
 * سطرُ بيان — **يختفي إن كان فارغاً** (لغةُ اللوحة الجديدة ٠٧-٠٨).
 * `—` تشغل سطراً في شاشةٍ كل سطرٍ فيها يبعد الزرَّ عن الإبهام.
 */
function Line({ k, v }: { k: string; v: string }) {
  if (!v || v === "—") return null;
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-muted">{k}</dt>
      <dd className="min-w-0 break-words text-end font-medium">{v}</dd>
    </div>
  );
}
