"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useAccess } from "@/lib/adminAccess";
import DateRange from "./DateRange";
import Fact from "./Fact";
import { IconChevron } from "@/components/icons";
import { csvDate, csvName, downloadCsv } from "@/lib/csv";
import { inSpan, spanLabel, today, type Span } from "@/lib/span";
import { DONE_GROUP, DONE_GROUP_NOTE, doneLabel } from "@/lib/deliver";
import { planOf } from "@/lib/orderPlan";
import {
  CLAIM_MINUTES,
  allOrders,
  claimOrder,
  claimStale,
  canChangeStatus,
  orderFree,
  owesRefund,
  traceOf,
  type PointsTrace,
  customerOf,
  releaseOrder,
  setOrderStatus,
  type AdminOrder,
  type Customer,
  type OrderStatus,
} from "@/lib/adminOrders";
import {
  DEFAULT_POINTS,
  orderPoints,
  pointsToUsd,
  readPointsMap,
  readPointsSettings,
  type PointsMap,
  type PointsSettings,
} from "@/lib/points";

/**
 * شاشة الطلبات — قلب اللوحة.
 *
 * هنا تُدار دورة حياة الطلب كاملة: يصل الزبون طلباً، تؤكّدين الدفع
 * (فتُمنح نقاطه تلقائياً)، ثم تسلّمين. والإلغاء يخصم ما مُنح فوراً.
 *
 * ورقم الزبون يظهر هنا مباشرة — لا تحتاجين فتح Firebase للتواصل معه.
 */

/**
 * ⚠️ **كلماتٌ واحدة في كل موضع.** كانت القائمة تقول `New`/`Paid` بينما
 *    البطاقات فوقها تقول `Waiting`/`Accepted` — لشيءٍ واحد اسمان، فتظنّ
 *    من تقرؤهما أنّهما بابان.
 */
const FILTERS = [
  { v: "all", label: "All orders" },
  { v: "pending", label: "Waiting — not confirmed yet" },
  { v: "paid", label: "Accepted — paid, not sent yet" },
  /* ⚠️ المجموعة لا تُسمّى بإحدى الكلمات الثلاث: فيها شحنٌ وتسليمٌ
     وتوصيلٌ معاً، فتُسمّى بما يجمعها ويُشرح تحته. */
  { v: "done", label: `${DONE_GROUP} — ${DONE_GROUP_NOTE}` },
  { v: "cancelled", label: "Rejected — cancelled" },
] as const;

/** الاسم وحده، بلا الشرح — للسطر الضيّق فوق القائمة */
const SHORT: Record<(typeof FILTERS)[number]["v"], string> = {
  all: "All orders",
  pending: "Waiting",
  paid: "Accepted",
  done: DONE_GROUP,
  cancelled: "Rejected",
};

/* شارة الحالة — أصناف النموذج، فالشارة نفسها في Today وفي هذه الشاشة */
const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "adm-pill wait",
  paid: "adm-pill done",
  done: "adm-pill",
  cancelled: "adm-pill late",
};

/** شريط الخطورة على حافة الصفّ — يُقرأ قبل الكلمات */
const STATUS_SEV: Record<OrderStatus, string> = {
  pending: "wait",
  paid: "wait",
  done: "done",
  cancelled: "",
};

/**
 * كلماتٌ لا مصطلحات: «Waiting» أوضح من `pending` لمن يفتح اللوحة أوّل مرّة.
 *
 * ⚠️ و`done` **تتبع القسم**: شدّات ببجي «Topped up»، وحساب تيك توك
 *    «Handed over»، والجهاز «Delivered». فتُطلب بـ`statusWord(o)` لا
 *    من هذا الجدول — والجدول يترك `done` فارغاً عمداً لئلّا يُستعمل سهواً.
 */
const STATUS_WORD: Record<Exclude<OrderStatus, "done">, string> = {
  pending: "Waiting",
  paid: "Accepted",
  cancelled: "Rejected",
};

/** كلمة الحالة لهذا الطلب — ونهايتُه بكلمة قسمه */
const statusWord = (o: AdminOrder): string =>
  o.status === "done" ? doneLabel(o.kind) : (STATUS_WORD[o.status] ?? o.status);

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—";

const clockOf = (d: Date | null) =>
  d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";

/**
 * ما طُلب — سطرٌ واحد يُقرأ بلمحة.
 * صنفٌ واحد ⇒ اسمه · أكثر ⇒ الأوّل و«+2».
 */
function itemLine(o: AdminOrder): string {
  const items = o.items ?? [];
  if (items.length === 0) return o.kind || "Order";
  const first = items[0];
  const qty = Math.max(1, first.qty ?? 1);
  const head = `${first.title}${qty > 1 ? ` ×${qty}` : ""}`;
  return items.length > 1 ? `${head} +${items.length - 1}` : head;
}

/**
 * المبلغ — و**الصفر ليس عطلاً**.
 * طلبٌ دُفع كلّه بالنقاط مبلغُه صفر، فيُقال «Points» بدل `$0.00`
 * التي تجعل الشاشة تبدو مكسورة.
 */
function amountOf(o: AdminOrder): string {
  const total = Number(o.total) || 0;
  if (total > 0) return `$${total.toFixed(2)}`;
  if (o.paidBy === "points" || Number(o.usePoints) > 0)
    return `${Number(o.usePoints) || Number(o.pointsSpent) || 0} pts`;
  return "$0.00";
}

/**
 * مدى التاريخ — **يفتح على اليوم**، ويُبدَّل من شريطٍ فوق القائمة.
 *
 * ⚠️ قائمةٌ تفتح على كل الطلبات منذ الأزل تُغرق صاحبتها: مئتا طلبٍ
 *    تبحث فيها عن طلبِ اليوم. فالمدى يبدأ عند **اليوم** وحده.
 *
 * ⚠️ **وكانت الشاشة تسأل أوّلاً في صفحةٍ كاملة** ثم تعرض. فصارت التصفية
 *    في مكانين — سؤالٌ في البداية وقائمةٌ منسدلةٌ بعده — ولا يُعرف
 *    أيّهما الحاكم. أُدمجت في شاشةٍ واحدة (قرارها ٠٧-٠٨).
 *
 * ⚠️ و«متى» صارت **من … إلى** لا أزراراً جاهزة (قرارها): «آخر ٧ أيام»
 *    مدىً يتحرّك تحت قدمها، ورقمُ اليوم فيه لا يساوي رقم أمس، فلا يُقارَن
 *    بشيء ولا يُطابق ما ينزل في إكسل. والتفصيل في `lib/span.ts`.
 */

/** فاصل اليوم — «Today» و«Yesterday» ثم التاريخ */
function dayOf(d: Date | null): string {
  if (!d) return "Earlier";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

export default function OrdersEditor() {
  const { user } = useAuth();
  const access = useAccess();
  const owner = access.role === "owner";
  const me = (user?.email ?? "").toLowerCase();

  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["v"]>("pending");
  /**
   * لوحةُ التواريخ — **مطويّةٌ ما لم تُطلب** (قرارها ٠٧-٠٨).
   *
   * ⚠️ كانت الشاشة تسأل أوّلاً في صفحةٍ كاملة: «أيّ تواريخ؟ أيّ طلبات؟»
   *    ثم تعرض. فصارت التصفيةُ في مكانين — سؤالٌ في البداية وقائمةٌ
   *    منسدلةٌ بعده — ولا تُعرف أيّهما الحاكم. والآن **شاشةٌ واحدة**:
   *    تفتح على طلبات اليوم، والتواريخ تُطوى تحت زرّها.
   */
  const [dates, setDates] = useState(false);
  /* تفتح على **اليوم**: الطرفان تاريخُ اليوم نفسه، كما كانت تماماً */
  const [span, setSpan] = useState<Span>(() => ({ from: today(), to: today() }));
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  /**
   * ما ينتظر تأكيداً — `"<id>:<status>"`.
   *
   * ⚠️ **لا زرّ يمسّ نقاطاً أو حالةً من أوّل ضغطة** (طلبها): الأزرار
   *    الثلاثة متجاورة والإبهام يخطئ، و«ألغيتُ» تسحب نقاطاً وتُنهي
   *    طلباً. والسؤال يقول **ماذا سيحدث** لا «هل أنتِ متأكّدة» وحدها.
   */
  const [ask, setAsk] = useState<string | null>(null);

  const [settings, setSettings] = useState<PointsSettings>(DEFAULT_POINTS);
  const [map, setMap] = useState<PointsMap>({});
  const [people, setPeople] = useState<Record<string, Customer | null>>({});
  /** أثرُ نقاط كل طلب في السجلّ — يُقرأ عند فتح الطلب وحده */
  const [traces, setTraces] = useState<Record<string, PointsTrace>>({});

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
      // ⚠️ لا نبتلع الفشل بصمت: شاشة طلبات فارغة تعني "لا طلبات" خطأً
      setErr(true);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** رقم الزبون يُقرأ عند فتح الطلب فقط — لا نقرأ مئة وثيقة بلا داعٍ */
  async function expand(o: AdminOrder) {
    const next = open === o.id ? null : o.id;
    setOpen(next);
    if (!next) return;

    if (!(o.uid in people)) {
      setPeople((p) => ({ ...p, [o.uid]: null }));
      void customerOf(o.uid).then((c) => setPeople((p) => ({ ...p, [o.uid]: c })));
    }

    /* ⚠️ السجلّ يُقرأ للطلبات التي مسّت نقاطاً وحدها — لا قراءتين لكل
       طلبٍ نقديّ لا علاقة له بالنقاط. */
    if (!(o.id in traces) && o.code && (o.paidBy === "points" || Number(o.usePoints) > 0))
      void traceOf(o.uid, String(o.code)).then((t) =>
        setTraces((p) => ({ ...p, [o.id]: t })),
      );
  }

  /** قبول الطلب — يحجزه باسمي فيختفي من قوائم بقيّة المساعدين */
  async function accept(o: AdminOrder) {
    setBusy(o.id);
    const r = await claimOrder(o.id, me, user?.displayName ?? me);
    setBusy(null);
    if (!r.ok) {
      setNote(r.takenBy ? `Already accepted by ${r.takenBy}` : "Could not accept");
      void load();
      return;
    }
    setNote("You accepted this order — it is yours now.");
    void load();
  }

  /** فكّ الحجز — لصاحبة المتجر حين يتعثّر المساعد أو يغيب */
  async function release(o: AdminOrder) {
    setBusy(o.id);
    await releaseOrder(o.id);
    setBusy(null);
    setNote("Released — any helper can accept it now.");
    void load();
  }

  async function move(o: AdminOrder, next: OrderStatus) {
    setAsk(null);
    setBusy(o.id);
    setNote(null);
    const res = await setOrderStatus(o.id, next, map, settings, {
      email: me,
      name: user?.displayName ?? me,
    });
    setBusy(null);

    if (!res.ok) {
      setNote("Could not save — try again");
      return;
    }

    // نعيد القراءة بدل التخمين: المنح والخصم والإعادة تتشابك، والرقم
    // المعروض يجب أن يكون ما في قاعدة البيانات لا ما توقّعناه
    void load();

    if (res.delta > 0) setNote(`+${res.delta} points added`);
    else if (res.delta < 0) setNote(`${res.delta} points removed`);
    else setNote("Status updated");

    // الرصيد المعروض في البطاقة يجب أن يتبع الحركة
    setPeople((p) =>
      p[o.uid] ? { ...p, [o.uid]: { ...p[o.uid]!, points: res.balance } } : p,
    );
  }

  /**
   * ⚠️ **المساعد لا يرى ما قَبِله غيره.** بدون هذا يفتح اثنان الطلب
   *    نفسه فيشحنه كلاهما. وصاحبة المتجر ترى الكل ومعه اسم من قبله.
   */
  /**
   * ما يخصّني من الطلبات — قبل أي تصفية بالتاريخ أو الحالة.
   *
   * ⚠️ و**الحجز المتروك يعود للجميع** بعد نصف ساعة (`CLAIM_MINUTES`):
   *    مساعدٌ قَبِل طلباتٍ ثم غاب كان يبتلعها معه، فلا يراها أحدٌ سواه
   *    والزبون ينتظر بلا أن يدري أحد.
   */
  const mine = (orders ?? []).filter((o) => orderFree(o, me, owner));

  /** ما وقع في المدى المختار — منه تُحسب أعداد الشاشة الأولى */
  const inWindow = mine.filter((o) => inSpan(o.createdAt, span));

  const shown = inWindow.filter((o) => filter === "all" || o.status === filter);

  const rangeLabel = spanLabel(span);

  /**
   * تنزيل ما يُعرض الآن جدولاً لإكسل.
   *
   * ⚠️ **ما يُعرض لا كل شيء**: من اختارت «المرفوضة في يوليو» تريد ملفاً
   *    بها وحدها. وملفٌ يحمل كل الطلبات يُلغي التصفية التي تعبت عليها.
   */
  function download(rows: AdminOrder[], what: string) {
    downloadCsv(
      csvName(what, span.from, span.to),
      [
        "Date", "Code", "Item", "Qty", "Section", "Customer", "Email",
        "Account / ID", "Status", "Amount USD", "Payment", "Points used",
        "Points given", "Discount USD", "Reserved", "Handled by", "Cancel reason",
      ],
      rows.map((o) => [
        csvDate(o.createdAt),
        o.code,
        itemLine(o),
        (o.items ?? []).reduce((n, i) => n + Math.max(1, i.qty ?? 1), 0) || 1,
        o.kind || "",
        o.name || "",
        o.email || "",
        o.account || "",
        statusWord(o),
        (Number(o.total) || 0).toFixed(2),
        o.payMethod || "",
        Number(o.pointsSpent) || Number(o.usePoints) || 0,
        Number(o.pointsAwarded) || 0,
        (Number(o.discount) || 0).toFixed(2),
        o.reserved ? "yes" : "",
        o.claimedName || o.claimedBy || "Owner",
        o.cancelReason || "",
      ]),
    );
  }

  /** خيارات القائمة المنسدلة، وبجانب كلٍّ عددُه في المدى المختار */
  const filterOpts = FILTERS.map((f) => ({
    v: f.v,
    label: f.label,
    count:
      orders === null
        ? undefined
        : f.v === "all"
          ? inWindow.length
          : inWindow.filter((o) => o.status === f.v).length,
  }));

  const btn =
    "min-h-12 flex-1 rounded-card border border-line px-3 text-sm font-bold transition-colors hover:bg-bg disabled:opacity-50";

  /**
   * الشرحُ الطويل للمختار وحده — سطرٌ واحد بدل خمسةٍ على خمسة أزرار.
   * ⚠️ وما بعد الشرطة وحده: اسمُ الحالة مكتوبٌ على الزرّ فوقه، وإعادتُه
   *    هنا سطرٌ يقول ما قيل. و«All orders» بلا شرحٍ فلا سطر لها أصلاً.
   */
  const filterNote = (FILTERS.find((f) => f.v === filter)?.label ?? "").split(
    " — ",
  )[1];

  return (
    <div className="flex flex-col gap-3">
      {/* ── ① المدى: سطرٌ يقول ما يُعرض، وضغطةٌ تفتح التواريخ ──
          ⚠️ **مطويّ**: التواريخ تُبدَّل مرّةً في اليوم، والتصفية عشرين
             مرّة. فما يُلمس كثيراً ظاهرٌ، وما يُلمس نادراً تحت زرّه. */}
      <button
        type="button"
        onClick={() => setDates((d) => !d)}
        aria-expanded={dates}
        className="adm-bar"
      >
        <span className="min-w-0 flex-1">
          <b className="block truncate">{rangeLabel}</b>
          <i className="num block text-xs not-italic text-muted">
            {orders === null ? "…" : `${inWindow.length} orders`}
          </i>
        </span>
        <span className="go">
          {dates ? "Done" : "Change"}
          <IconChevron className={`size-4 ${dates ? "-rotate-90" : "rotate-90"}`} />
        </span>
      </button>

      {/* ⚠️ و**Refresh وExcel داخل اللوحة نفسها**: كانا صفّاً دائماً فوق
          القائمة يأكل سطراً في كل مرّة، وهما من أدوات المدى لا من أدوات
          اليوم. و`DateRange` يحملهما أصلاً في الشاشات الأربع. */}
      {dates && (
        <div className="rounded-card border border-line bg-surface p-3">
          <DateRange
            span={span}
            onChange={setSpan}
            onRefresh={() => void load()}
            /* ينزّل **المعروض** — بحالته ومداه معاً، لا كل الطلبات */
            onDownload={() => download(shown, `orders-${filter}`)}
            canDownload={shown.length > 0}
          />
        </div>
      )}

      {/* ── ② التصفية: أزرارٌ مرئيةٌ بعددِ كلٍّ ──
          ⚠️ كانت قائمةً منسدلة: ثلاثُ لمساتٍ لتبديل «بانتظار ⇐ مقبول»،
             ولا يُرى العددُ حتى تُفتح. والآن لمسةٌ واحدة، والأعداد كلّها
             ظاهرةٌ قبل اللمس — فتعرف أين العمل قبل أن تذهب إليه. */}
      <div className="adm-segs" role="group" aria-label="Which orders?">
        {filterOpts.map((f) => (
          <button
            key={f.v}
            type="button"
            onClick={() => setFilter(f.v)}
            aria-pressed={filter === f.v}
            className={`adm-seg${filter === f.v ? " on" : ""}`}
          >
            {SHORT[f.v]}
            <span className="num n">{f.count ?? "…"}</span>
          </button>
        ))}
      </div>
      {/* الشرحُ الذي كان في القائمة المنسدلة — لم يُفقد، صار سطراً هنا */}
      {filterNote && <p className="-mt-1 text-xs text-muted">{filterNote}</p>}

      {note && (
        <p className="rounded-card border border-line bg-surface p-2.5 text-sm font-medium">
          {note}
        </p>
      )}

      {err && (
        /* ⚠️ ومعه زرُّه: زرُّ Refresh صار داخل لوحة التواريخ المطويّة،
           فرسالةٌ تقول «اضغطي Refresh» تُرسلها تبحث عن زرٍّ لا تراه. */
        <div className="flex items-center gap-2 rounded-card border border-danger/40 bg-danger/5 p-3 text-sm">
          <span className="min-w-0 flex-1">
            Could not read orders. Check your connection, then try again.
          </span>
          <button
            type="button"
            onClick={() => void load()}
            className="min-h-11 shrink-0 rounded-card border border-line bg-surface px-3 font-bold"
          >
            Try again
          </button>
        </div>
      )}

      {orders === null ? (
        <p className="p-4 text-center text-sm text-muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
          No {filter === "all" ? "" : SHORT[filter].toLowerCase()} orders in{" "}
          {rangeLabel.toLowerCase()}.
        </p>
      ) : (
        shown.map((o, idx) => {
          const who = people[o.uid];
          /* فاصل اليوم — الطلبات مرتّبة بالأحدث، فيُرسم عند تغيّر اليوم */
          const day = dayOf(o.createdAt);
          const newDay = idx === 0 || dayOf(shown[idx - 1].createdAt) !== day;
          const due = orderPoints(o.items ?? [], map, settings.perItem);
          /* أُلغي الطلب ونقاطه لم تُسوَّ بعد — يحدث حين يُلغي الزبون
             بنفسه: هو لا يملك رصيده، فالتسوية بضغطة منكِ هنا. */
          /* ⚠️ ونقاطٌ خُصمت ولم تُسجَّل على الطلب تُعرف من **السجلّ**:
             بدونها لا يظهر زرّ الإعادة أصلاً، فتضيع نقاط الزبون بعد
             إلغاءٍ ولا يدري أحد. */
          const trace = traces[o.id];
          const owed = owesRefund(o, trace);
          const unsettled =
            (o.status === "cancelled" &&
              ((Number(o.pointsAwarded) || 0) > 0 ||
                (Number(o.pointsSpent) || 0) > 0)) ||
            owed;

          /* 🔒 الطلب المنتهي أو المرفوض لا يبدّله إلا صاحبة المتجر.
             (وتسويةُ نقاطٍ عالقة تبقى متاحة — هي تصحيحٌ لا رجوع.) */
          const locked = canChangeStatus(o, owner) || unsettled;

          /* السؤال المعلّق على هذا الطلب، وما سيحدث لو أُكِّد */
          const pending = ask?.startsWith(`${o.id}:`)
            ? (ask.split(":")[1] as OrderStatus)
            : null;
          const plan = pending
            ? planOf(o, pending, due, settings, unsettled, trace?.spent ?? 0)
            : null;
          const asking2 = plan !== null;

          return (
            <div key={o.id} className="contents">
              {newDay && (
                <p className="px-1 pt-2 text-xs font-bold text-muted">{day}</p>
              )}
            <article
              className="rounded-card border border-line bg-surface"
            >
              <button
                type="button"
                onClick={() => void expand(o)}
                className={`adm-q border-0 ${STATUS_SEV[o.status] ?? ""}`}
              >
                <span className="sv" />
                {/* ⚠️ **ما طُلب أوّلاً لا رمز الطلب.** «M-537817» لا يقول
                    شيئاً، و«660 UC ×1» يقول كل شيء. الرمز سطرٌ صغير تحته. */}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{itemLine(o)}</span>
                  <span className="block truncate text-xs text-muted">
                    {o.name || o.email || "—"} · {clockOf(o.createdAt)}
                  </span>
                  <span className="num block truncate text-xs text-muted">
                    {o.code}
                  </span>
                </span>

                <span className="flex shrink-0 flex-col items-end gap-1">
                  {/* مبلغٌ صفريّ ليس عطلاً: طلبٌ دُفع بالنقاط. فيُقال */}
                  <span className="num font-bold text-gold">{amountOf(o)}</span>
                  <span className={STATUS_STYLE[o.status] ?? ""}>
                    {statusWord(o)}
                  </span>
                  {/* حجزٌ وصل خارج الدوام — يُنفَّذ أوّل ما تفتحين */}
                  {o.reserved && (
                    <span className="rounded-full bg-orange/15 px-2 py-0.5 text-xs font-bold text-orange">
                      Reserved
                    </span>
                  )}
                  {o.claimedBy &&
                    (String(o.claimedBy).toLowerCase() === me ? (
                      <span className="text-xs text-muted">yours</span>
                    ) : claimStale(o.claimedAt) &&
                      o.status !== "done" &&
                      o.status !== "cancelled" ? (
                      /* حجزٌ مضى عليه نصف ساعة بلا حركة — لم يعد يحبسه */
                      <span className="rounded-full bg-danger/12 px-2 py-0.5 text-xs font-bold text-danger">
                        Stuck
                      </span>
                    ) : (
                      <span className="max-w-24 truncate text-xs text-muted">
                        {o.claimedName || o.claimedBy}
                      </span>
                    ))}
                </span>
              </button>

              {open === o.id && (
                <div className="flex flex-col gap-4 border-t border-line p-3">
                  {/* ═══ ① ما طُلب ═══ */}
                  <section className="flex flex-col gap-2">
                    <p className="adm-ttl">Order</p>

                    <ul className="flex flex-col gap-1 rounded-card border border-line p-2.5 text-sm">
                      {(o.items ?? []).map((it, i) => (
                        <li key={`${it.id}-${i}`} className="flex gap-2">
                          <span className="min-w-0 flex-1 truncate">
                            {it.title}
                            {it.qty > 1 && <span className="num"> ×{it.qty}</span>}
                          </span>
                          <span className="num shrink-0 text-muted">
                            ${Number(it.price ?? 0).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Fact k="Section" v={o.kind} />
                    <Fact
                      k="Account / ID"
                      v={
                        o.account ? (
                          <span className="num break-all" dir="ltr">
                            {o.account}
                          </span>
                        ) : null
                      }
                    />
                    <Fact k="Payment" v={o.payMethod} />

                    {o.paidBy === "points" && (
                      <Fact
                        k="Paid with"
                        tone="font-bold text-orange"
                        v={(() => {
                            /**
                             * ⚠️ **الصفر هنا لا يعني «لم يدفع».**
                             *
                             * الزبون يخصم نقاطه بنفسه ثم يؤكَّد الطلب. فإن
                             * تعثّر التأكيد بقي `pointsSpent: 0` **ونقاطُه
                             * مخصومةٌ فعلاً**. وكانت الشاشة تقارن الصفر
                             * بسعر الأصناف فتصرخ «النقاط تغطّي $0.00» عن
                             * طلبٍ مدفوعٍ تماماً — إنذارٌ كاذب يُفزع بلا سبب.
                             *
                             * فيُقرأ **المطلوب** (`usePoints`) لا المسجَّل
                             * وحده، ويُقال ما يجب فعله لا ما يبدو خطأً.
                             */
                            const spent = Number(o.pointsSpent) || 0;
                            const want = Number(o.usePoints) || 0;
                            const value = (o.items ?? []).reduce(
                              (n, i) => n + (Number(i.price) || 0) * Math.max(1, i.qty ?? 1),
                              0,
                            );
                            const covers = (spent || want) / 100;

                            return (
                              <>
                                {spent > 0 ? `Points · ${spent} pts` : `Points · ${want} pts asked`}

                                {spent === 0 && want > 0 && (
                                  <span className="mt-1 block text-sm font-medium text-text">
                                    Not recorded on the order yet. Press{" "}
                                    <strong>Mark paid</strong> — if the customer
                                    already had them taken, nothing is charged twice.
                                  </span>
                                )}

                                {covers + 0.005 < value && (
                                  <span className="mt-1 block font-medium text-danger">
                                    Points cover only ${covers.toFixed(2)} of $
                                    {value.toFixed(2)} — check before delivering.
                                  </span>
                                )}
                              </>
                            );
                        })()}
                      />
                    )}

                    <Fact
                      k="Buying points"
                      tone="num font-bold text-orange"
                      v={
                        Number(o.buyPoints) > 0
                          ? `${o.buyPoints} pts for $${Number(o.total ?? 0).toFixed(2)}`
                          : null
                      }
                    />

                    <Fact
                      k="Points discount"
                      tone="num text-orange"
                      v={
                        Number(o.usePoints) > 0
                          ? `−$${Number(o.discount ?? 0).toFixed(2)} (${o.usePoints} pts)`
                          : null
                      }
                    />

                    <Fact
                      k="Cancelled"
                      tone="text-danger"
                      v={
                        o.cancelReason
                          ? `${o.cancelledBy === "customer" ? "by customer" : "by you"} — ${o.cancelReason}`
                          : null
                      }
                    />

                    {settings.on && (
                      <p className="text-sm text-muted">
                        {o.pointsAwarded
                          ? `Awarded ${o.pointsAwarded} points`
                          : `Will award ${Number(o.buyPoints) > 0 ? Number(o.buyPoints) : due} points on payment`}
                      </p>
                    )}
                  </section>

                  {/* ═══ ② من طلبه ═══
                      ⚠️ كان الزبونُ مبعثراً وسط تفاصيل الطلب: الهاتف بين
                         «طريقة الدفع» و«البريد»، وزرُّ واتساب بعدهما بأربعة
                         أسطر. والآن كتلةٌ واحدة يُغلقها زرُّ التواصل. */}
                  <section className="flex flex-col gap-2">
                    <p className="adm-ttl">Customer</p>

                    <Fact k="Name" v={o.name} />
                    <Fact
                      k="Phone"
                      v={
                        who === undefined ? (
                          "…"
                        ) : who === null ? (
                          "not registered"
                        ) : who.phone ? (
                          <span className="num" dir="ltr">
                            {who.phone}
                          </span>
                        ) : null
                      }
                    />
                    <Fact
                      k="Email"
                      v={
                        o.email ? (
                          <span className="break-all" dir="ltr">
                            {o.email}
                          </span>
                        ) : null
                      }
                    />
                    <Fact
                      k="Points"
                      tone="num"
                      v={
                        who
                          ? `${who.points} · $${pointsToUsd(who.points).toFixed(2)}`
                          : null
                      }
                    />

                    {who?.phone && (
                      <a
                        href={`https://wa.me/${who.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Ramaan Store — order ${o.code}`)}`}
                        target="_blank"
                        rel="noopener"
                        className="flex min-h-12 items-center justify-center rounded-card bg-orange px-3 font-bold text-onaccent"
                      >
                        WhatsApp the customer
                      </a>
                    )}
                  </section>

                  {/* ═══ ③ ماذا أفعل الآن ═══
                      ⚠️ **كتلةٌ واحدة في آخر البطاقة**: التحذير والقبول ومن
                         غيّر الحالة والأزرار الثلاثة كانت متفرّقةً بين
                         التفاصيل، فلا يُعرف أين ينتهي الخبر ويبدأ العمل. */}
                  <section className="flex flex-col gap-2">
                    <p className="adm-ttl">What to do</p>

                  {/* ⚠️ الخياران **مفصولان سطرَين**: كانا جملةً واحدة تخلط
                      «شحنتِ» بـ«Mark paid» — والشحن غيرُ الدفع. */}
                  {unsettled && (
                    <div className="rounded-card border border-danger/40 bg-danger/5 p-2.5 text-sm">
                      <p className="font-bold">
                        {owed
                          ? `${trace?.spent ?? 0} points are still taken from this customer.`
                          : "The customer cancelled this order."}
                      </p>
                      <ul className="mt-1.5 flex flex-col gap-1">
                        <li>
                          Nothing sent yet: press{" "}
                          <strong>Return {trace?.spent || Number(o.pointsSpent) || 0} points</strong> —
                          it puts them back on their balance.
                        </li>
                        <li>
                          Already sent it: press <strong>Mark paid</strong>, then{" "}
                          <strong>{doneLabel(o.kind)}</strong>.
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* القبول أوّلاً: لا يعمل مساعدٌ على طلبٍ لم يقبله.
                      والحجز الساقط يُؤخذ بالزرّ نفسه — لا خطوة إضافية. */}
                  {!o.claimedBy ||
                  (String(o.claimedBy).toLowerCase() !== me &&
                    !owner &&
                    claimStale(o.claimedAt)) ? (
                    <button
                      type="button"
                      disabled={busy === o.id}
                      onClick={() => void accept(o)}
                      className="min-h-12 rounded-card bg-orange px-3 font-bold text-onaccent disabled:opacity-50"
                    >
                      Accept this order
                    </button>
                  ) : (
                    <p className="flex flex-wrap items-center gap-2 rounded-card border border-line p-2.5 text-sm">
                      <span className="text-muted">Accepted by</span>
                      <strong>
                        {String(o.claimedBy).toLowerCase() === me
                          ? "you"
                          : o.claimedName || o.claimedBy}
                      </strong>
                      {/* ⚠️ يُقال متى سقط الحجز، وإلّا بدا الزرّ متاحاً بلا سبب */}
                      {String(o.claimedBy).toLowerCase() !== me &&
                        claimStale(o.claimedAt) && (
                          <span className="text-danger">
                            — idle for over {CLAIM_MINUTES} min, anyone may take it
                          </span>
                        )}
                      {owner && (
                        <button
                          type="button"
                          disabled={busy === o.id}
                          onClick={() => void release(o)}
                          className="ms-auto min-h-9 rounded-card border border-line px-3 text-sm font-bold text-danger"
                        >
                          Release
                        </button>
                      )}
                    </p>
                  )}

                  {/* من أنهى الطلب ومتى — الحالة وحدها لا تقول من فعلها */}
                  {o.statusBy && (
                    <p className="text-xs text-muted">
                      {statusWord(o)} by{" "}
                      <strong className="text-text">
                        {String(o.statusBy).toLowerCase() === me
                          ? "you"
                          : o.statusByName || o.statusBy}
                      </strong>
                      {o.statusAt && ` · ${fmtDate(o.statusAt)}`}
                    </p>
                  )}

                  {/* 🔒 قفل الحالة النهائية — المساعد يدفع للأمام ولا يرجع */}
                  {!locked ? (
                    <p className="rounded-card border border-line bg-bg p-2.5 text-sm text-muted">
                      This order is <strong>{statusWord(o)}</strong>. Only the
                      store owner can change it now.
                    </p>
                  ) : asking2 && plan ? (
                    /* ── السؤال: ماذا سيحدث لو أكّدتِ؟ ── */
                    <div className="flex flex-col gap-2 rounded-card border-2 border-orange bg-orange/5 p-3">
                      <p className="text-sm font-bold">{plan.title}</p>
                      <p className="text-sm text-muted">{plan.note}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy === o.id}
                          onClick={() => void move(o, plan.to)}
                          className={`min-h-12 flex-1 rounded-card px-3 font-bold text-onaccent disabled:opacity-50 ${
                            plan.to === "cancelled" ? "bg-danger" : "bg-orange"
                          }`}
                        >
                          {plan.yes}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAsk(null)}
                          className="min-h-12 flex-1 rounded-card border border-line px-3 font-bold"
                        >
                          No, go back
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy === o.id || o.status === "paid" || (!owner && !o.claimedBy)}
                        onClick={() => setAsk(`${o.id}:paid`)}
                        className={btn}
                      >
                        Mark paid
                      </button>
                      {/* ⚠️ الزرّ بكلمة قسمه: «Topped up» لشدّات ببجي،
                          و«Handed over» لحساب تيك توك، و«Delivered» للجهاز.
                          زرٌّ يقول «Delivered» عن شحن شدّاتٍ يُربك من يقرؤه. */}
                      <button
                        type="button"
                        disabled={busy === o.id || o.status === "done" || (!owner && !o.claimedBy)}
                        onClick={() => setAsk(`${o.id}:done`)}
                        className={btn}
                      >
                        {doneLabel(o.kind)}
                      </button>
                      <button
                        type="button"
                        disabled={
                          busy === o.id ||
                          (o.status === "cancelled" && !unsettled) ||
                          (!owner && !o.claimedBy)
                        }
                        onClick={() => setAsk(`${o.id}:cancelled`)}
                        className={`${btn} text-danger`}
                      >
                        {unsettled
                          ? `Return ${trace?.spent || Number(o.pointsSpent) || 0} points`
                          : "Cancel"}
                      </button>
                    </div>
                  )}
                  </section>
                </div>
              )}
            </article>
            </div>
          );
        })
      )}
    </div>
  );
}
