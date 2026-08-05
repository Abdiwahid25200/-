"use client";

import { useEffect, useState } from "react";
import {
  allPromos,
  deletePromo,
  EMPTY_PROMO,
  normCode,
  promoOff,
  savePromo,
  type Promo,
} from "@/lib/promos";
import { IconCheckCircle, IconPlus, IconSpinner, IconTrash } from "@/components/icons";
import { allItems, type ItemKind } from "@/lib/items";
import { readCosts, type Costs } from "@/lib/costs";

/**
 * 🎟️ **رموز الخصم** — طلبها (٠٤-٠٨).
 *
 * لكل رمزٍ بطاقة: نوعه وقيمته، وأقلّ طلبٍ يقبله، وسقفُ خصمه، وكم مرّةً
 * يُستعمل، ومتى ينتهي. والعدّاد يُعرض ولا يُكتب — يزيده الزبون بشرائه.
 *
 * ⚠️ **والاسم هو المفتاح**: اسم الوثيقة هو الرمز نفسه، فتبديل الاسم
 *    بعد الحفظ يصنع رمزاً ثانياً ولا يعيد تسمية الأوّل. لذلك يُقفل
 *    الحقل بعد أوّل حفظ — ومن أرادت تبديله تحذف وتُنشئ.
 */
/**
 * 🐞 **بلاغها (٠٤-٠٨): «لا أستطيع الضغط على الاسم»** — وكانت محقّة،
 *    وكان العطل عطلين:
 *
 * ① **الحقل يُقفل بعد الحفظ** — بحجّة أن اسم الوثيقة لا يُعاد تسميته.
 *    وهي تريد كوداً **باسم كل مؤثّر**، فقفلُ الاسم يمنعها من عملها.
 *    والحلّ في الكود لا في القفل: التسمية = وثيقةٌ جديدة بالاسم الجديد
 *    ثم حذفُ القديمة. **ويُقال لها صراحةً أن القديم يتوقّف.**
 *
 * ② **ومفتاح الصفّ كان الاسمَ نفسه** (`key={p.code}`) — فمع كل حرفٍ
 *    يتبدّل المفتاح، فيهدم React الحقل ويبنيه، **فيفلت التركيز بعد
 *    حرفٍ واحد**. صار لكل صفٍّ مفتاحٌ ثابت لا يتغيّر مهما بُدّل الاسم.
 */
type Row = Promo & {
  /** مفتاحٌ داخليّ ثابت — لا يظهر ولا يُحفظ */
  rid: string;
  /** اسم الوثيقة في قاعدة البيانات — غائبٌ لما لم يُحفظ بعد */
  docId?: string;
};

export default function PromosEditor() {
  const [list, setList] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  /**
   * 🛡️ **حارس التكلفة** — تقولها هي: «اجعل الثلاثة لا تخسرني».
   *
   * تُقرأ الأسعار والتكاليف مرّةً، فيُحسب لكل رمزٍ **أسوأ صنف**: الذي
   * يهبط سعره بعد الرمز تحت تكلفته. ويُقال بالاسم والرقم قبل الحفظ.
   *
   * ⚠️ **وفي اللوحة لا عند الزبون**: التكلفة سرّيةٌ لا يقرأها متصفّحه
   *    أصلاً (القواعد تمنعه)، فالحارس تحذيرٌ ومنعٌ عندك لا حسابٌ عنده.
   */
  const [priced, setPriced] = useState<{ id: string; title: string; price: number }[]>([]);
  const [costs, setCosts] = useState<Costs>({});

  useEffect(() => {
    void readCosts().then(setCosts);
    const kinds: ItemKind[] = ["pubg", "efootball", "tiktok", "accounts", "elec"];
    void Promise.all(kinds.map((k) => allItems(k))).then((all) =>
      setPriced(
        all
          .flat()
          .filter((i) => !i.hidden && i.status !== "off" && Number(i.price) > 0)
          .map((i) => ({ id: i.id, title: i.title || i.id, price: Number(i.price) })),
      ),
    );
  }, []);

  /**
   * 🛡️ **أكبر خصمٍ لا يبيع صنفاً بأقلّ من تكلفته** — قرارها (٠٤-٠٨):
   *    «اجعله يمنعني أو يخفض النسبة تلقائياً كي لا أخسر».
   *
   * وهو **أضيقُ فرقٍ بين سعرٍ وتكلفته** في المتجر كلّه: ما دام سقفُ
   * الخصم دونه، فلا صنفَ يهبط تحت تكلفته مهما كانت النسبة.
   *
   * ⚠️ **ويُقرَّب إلى الأسفل**: `Math.floor` لا `round` — سنتٌ في صالحك
   *    خيرٌ من سنتٍ عليك.
   * ⚠️ **وما لا تكلفة له لا يُحسب**: لا يُخمَّن ما لم يُكتب.
   * ⚠️ **و`null` تعني: لا تكلفة مكتوبة أصلاً** — فلا حارسَ يمكن أن
   *    يعمل، ولا يُمنع الحفظ بحجّةٍ لا نملك دليلها.
   */
  function safeCap(): number | null {
    let cap = Infinity;
    for (const it of priced) {
      const cost = costs[it.id];
      if (cost === undefined || cost <= 0) continue;
      cap = Math.min(cap, it.price - cost);
    }
    return Number.isFinite(cap) ? Math.floor(cap * 100) / 100 : null;
  }

  /**
   * 🕳️ **ما لا يعرفه الحارس لا يحرسه** — قرارها (٠٤-٠٨).
   *
   * حارس التكلفة يقيس على التكاليف المكتوبة وحدها. وصنفٌ بلا تكلفة
   * **يمرّ عليه أيّ كودٍ بلا اعتراض** — فتظنّ كلَّ شيءٍ محروساً وفيه
   * ثغرة. فيُقال العدد والأسماء صراحةً: في الشاشة دائماً، وفي لحظة
   * الحفظ مرّةً أخرى.
   */
  const blind = priced.filter((it) => !(Number(costs[it.id]) > 0));

  const blindNote =
    blind.length === 0
      ? ""
      : `\n\n${blind.length} item${blind.length > 1 ? "s" : ""} still have no cost (${blind
          .slice(0, 3)
          .map((b) => b.title)
          .join(", ")}${blind.length > 3 ? "…" : ""}) — the guard cannot protect ${
          blind.length > 1 ? "them" : "it"
        }.`;

  /** أسوأ صنفٍ يبيعه هذا الرمز بخسارة — أو `null` إن كان كلّه رابحاً */
  function worstLoss(p: Promo) {
    let worst: { title: string; left: number; cost: number } | null = null;
    for (const it of priced) {
      const cost = costs[it.id];
      if (cost === undefined || cost <= 0) continue;
      const left = Math.round((it.price - promoOff(p, it.price)) * 100) / 100;
      if (left >= cost) continue;
      if (!worst || left - cost < worst.left - worst.cost)
        worst = { title: it.title, left, cost };
    }
    return worst;
  }

  const load = () => {
    setList(null);
    void allPromos().then((rows) =>
      setList(rows.map((p) => ({ ...p, rid: p.code, docId: p.code }))),
    );
  };
  useEffect(load, []);

  const patch = (rid: string, p: Partial<Promo>) => {
    setList((l) => (l ?? []).map((x) => (x.rid === rid ? { ...x, ...p } : x)));
    setSaved(null);
  };

  async function save(row: Row) {
    const { rid, docId, ...p } = row;
    const code = normCode(p.code);
    if (!code) return alert("Write the code first.");

    /* 🛡️ **سقفٌ إجباريّ للنسبة**: «50» تُكتب مكان «5» في لحظة، وبلا
       سقفٍ تصير نصفَ كل طلبٍ في المتجر حتى تنتبهي. */
    if (p.kind === "pct" && p.max <= 0)
      return alert(
        "Percent codes need a Max discount.\nWithout a cap, one typo can halve every order.",
      );

    /**
     * 🛡️ **حارس التكلفة — يمنع أو يُخفّض، ولا يكتفي بالتحذير.**
     *
     * قرارها (٠٤-٠٨): «اجعله يمنعني أو يخفض النسبة تلقائياً كي لا
     * أخسر». وكان يسأل ويمضي — والسؤالُ في لحظة انشغالٍ يُضغط «نعم».
     *
     * فصار: يُحسب أكبر خصمٍ آمن، ثم إمّا **يُخفَّض السقف إليه** بعلمك،
     * وإمّا **يُمنع الحفظ** إن كان الربح لا يحتمل خصماً أصلاً.
     */
    let safe: Promo = { ...p, code };
    let lowered = false;
    const cap = safeCap();

    if (cap !== null) {
      const bad = worstLoss(safe);

      if (cap <= 0) {
        /* ⚠️ أرخص فرقٍ في المتجر صفرٌ أو سالب: لا خصمَ يمرّ بلا خسارة.
           والعلاج في السعر أو التكلفة لا في الكود — فيُقال ويُمنع. */
        alert(
          bad
            ? `Cannot save: “${bad.title}” already leaves no margin (price $${bad.left.toFixed(2)}, cost $${bad.cost.toFixed(2)}).\nRaise its price or hide it, then add the code.`
            : "Cannot save: one of your items has no margin left. Fix its price or cost first.",
        );
        return;
      }

      /* النسبة يحكمها سقفُها، والمبلغُ الثابت يحكم نفسه */
      const isPct = safe.kind === "pct";
      const now = isPct ? safe.max : safe.value;

      if (now > cap) {
        const word = isPct ? "Max discount" : "Amount";
        if (
          !confirm(
            `${word} $${now.toFixed(2)} would sell an item below cost.\n\nIt will be saved as $${cap.toFixed(2)} — the largest discount that still keeps every item profitable.\n\nSave it that way?${blindNote}`,
          )
        )
          return;
        safe = isPct ? { ...safe, max: cap } : { ...safe, value: cap };
        patch(rid, isPct ? { max: cap } : { value: cap });
        lowered = true;
      }
    }

    /* ⚠️ **ولا يُسأل مرّتين**: من خُفّض سقفُه قرأ التنبيه في سؤاله. */
    if (!lowered && blindNote && !confirm(`Save ${code}?${blindNote}`)) return;

    /* ⚠️ **ولا يُدهس رمزٌ قائم**: اسمٌ يخصّ كوداً آخر يمحو إعداداته
       وعدّاده. فيُسأل عنه صراحةً قبل الكتابة فوقه. */
    if (
      docId !== code &&
      (list ?? []).some((x) => x.rid !== rid && x.docId === code) &&
      !confirm(`${code} already exists. Overwrite it?`)
    )
      return;

    setBusy(rid);
    const ok = await savePromo(safe);
    if (!ok) {
      setBusy(null);
      return alert("Could not save — check your connection.");
    }

    /**
     * 🔤 **التسمية = وثيقةٌ جديدة ثم حذفُ القديمة** — اسم الوثيقة هو
     *    الرمز نفسه، ولا تُعاد تسميةُ وثيقةٍ في فايرستور.
     *
     * ⚠️ **ويُقال ما يترتّب عليه**: من كتب القديم في جوّاله لم يعد
     *    يعمل — وهذا ما يجب أن تعرفه قبل أن يسألها المؤثّر.
     */
    if (docId && docId !== code) {
      await deletePromo(docId);
      alert(`Renamed ${docId} → ${code}.\nThe old code no longer works.`);
    }

    setBusy(null);
    setSaved(rid);
    setList((l) =>
      (l ?? []).map((x) => (x.rid === rid ? { ...x, code, docId: code } : x)),
    );
  }

  async function del(row: Row) {
    /* ما لم يُحفظ بعد يُزال من الشاشة بلا سؤالٍ ولا نداءِ شبكة */
    if (!row.docId) {
      setList((l) => (l ?? []).filter((x) => x.rid !== row.rid));
      return;
    }
    if (!confirm(`Delete ${row.docId}? Customers who saved it stop getting the discount.`))
      return;
    setBusy(row.rid);
    const ok = await deletePromo(row.docId);
    setBusy(null);
    if (ok) load();
    else alert("Could not delete.");
  }

  function add() {
    /* ⚠️ **ويُترك الاسم فارغاً**: اسمٌ مولَّد كـ`NEW56` يُحفظ بالخطأ
       فيصير كوداً حقيقياً بلا معنى. والفارغُ يُطالبها بكتابته. */
    setList((l) => [
      ...(l ?? []),
      { ...EMPTY_PROMO, code: "", rid: `new-${Date.now()}` },
    ]);
  }

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange";

  if (list === null)
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <IconSpinner className="size-4" /> Loading…
      </p>
    );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        A customer types the code at checkout and the discount comes off the
        order. Codes are case-insensitive.
      </p>

      {/* 🕳️ الثغرة تُقال قبل أن تُكتشف بطلبٍ خاسر */}
      {blind.length > 0 && (
        <p className="adm-warn soft text-sm">
          <span>
            <b className="block">
              {blind.length} item{blind.length > 1 ? "s" : ""} have no cost yet
            </b>
            Codes cannot protect {blind.length > 1 ? "them" : "it"} from selling
            at a loss: {blind.slice(0, 5).map((b) => b.title).join(" · ")}
            {blind.length > 5 ? " …" : ""}. Write it under Items → the item →
            Cost (private).
          </span>
        </p>
      )}

      {list.map((p) => {

        const left = p.uses > 0 ? Math.max(0, p.uses - p.used) : null;
        return (
          <section
            key={p.rid}
            className={`flex flex-col gap-3 rounded-card border bg-surface p-3 ${
              p.on ? "border-line" : "border-dashed border-line/70"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                value={p.code}
                onChange={(e) => patch(p.rid, { code: e.target.value.toUpperCase() })}
                placeholder="AXMED"
                dir="ltr"
                aria-label="Code name"
                className={`${field} num flex-1 font-bold uppercase`}
              />
              <button
                type="button"
                onClick={() => void del(p)}
                disabled={busy === p.rid}
                aria-label={`Delete ${p.code || "code"}`}
                className="flex min-h-12 shrink-0 items-center rounded-card border border-danger/40 px-3 text-danger disabled:opacity-50"
              >
                <IconTrash className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Type</span>
                <select
                  value={p.kind}
                  onChange={(e) =>
                    patch(p.rid, { kind: e.target.value as Promo["kind"] })
                  }
                  className={field}
                >
                  <option value="pct">Percent off</option>
                  <option value="flat">Fixed amount</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">
                  {p.kind === "pct" ? "Percent" : "Amount (USD)"}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={p.kind === "pct" ? 1 : 0.5}
                  min={0}
                  value={p.value || ""}
                  onChange={(e) => patch(p.rid, { value: Number(e.target.value) || 0 })}
                  dir="ltr"
                  className={`${field} num text-start`}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Minimum order</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={0.5}
                  min={0}
                  value={p.min || ""}
                  placeholder="Any"
                  onChange={(e) => patch(p.rid, { min: Number(e.target.value) || 0 })}
                  dir="ltr"
                  className={`${field} num text-start`}
                />
              </label>

              {/* ⚠️ سقفٌ للنسبة وحدها: «٥٠٪» على طلبٍ بمئة دولار خمسون */}
              {p.kind === "pct" && (
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Max discount</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.5}
                    min={0}
                    value={p.max || ""}
                    placeholder="No cap"
                    onChange={(e) => patch(p.rid, { max: Number(e.target.value) || 0 })}
                    dir="ltr"
                    className={`${field} num text-start`}
                  />
                </label>
              )}

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Times it can be used</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={p.uses || ""}
                  placeholder="Unlimited"
                  onChange={(e) => patch(p.rid, { uses: Number(e.target.value) || 0 })}
                  dir="ltr"
                  className={`${field} num text-start`}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Last day</span>
                <input
                  type="date"
                  value={p.until}
                  onChange={(e) => patch(p.rid, { until: e.target.value })}
                  dir="ltr"
                  className={`${field} num text-start`}
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-card border border-line p-3">
              <input
                type="checkbox"
                checked={p.on}
                onChange={(e) => patch(p.rid, { on: e.target.checked })}
                className="size-5 shrink-0 accent-orange"
              />
              <span className="min-w-0 flex-1 text-sm font-medium">
                Code is working
              </span>
            </label>

            {/* 🛡️ الحارسان اللذان يمنعان الخسارة الجماعية */}
            <label className="flex items-center gap-3 rounded-card border border-line p-3">
              <input
                type="checkbox"
                checked={p.perUser}
                onChange={(e) => patch(p.rid, { perUser: e.target.checked })}
                className="size-5 shrink-0 accent-orange"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  Once per customer
                </span>
                <span className="block text-sm text-muted">
                  Keeps a shared code harmless. Needs the customer to sign in.
                </span>
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-card border border-line p-3">
              <input
                type="checkbox"
                checked={p.withSale}
                onChange={(e) => patch(p.rid, { withSale: e.target.checked })}
                className="size-5 shrink-0 accent-orange"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  Works on already-discounted items
                </span>
                <span className="block text-sm text-muted">
                  Off means one discount at a time.
                </span>
              </span>
            </label>

            {(() => {
              const bad = worstLoss(p);
              return bad ? (
                <p className="adm-warn text-sm">
                  <span>
                    <b className="block">
                      “{bad.title}” would sell below your cost
                    </b>
                    <span className="num" dir="ltr">
                      ${bad.left.toFixed(2)} vs cost ${bad.cost.toFixed(2)} — you
                      lose ${(bad.cost - bad.left).toFixed(2)} each
                    </span>
                  </span>
                </p>
              ) : null;
            })()}

            {/* ما ستفعله الأرقام — بالمثال لا بالوصف */}
            <p className="num rounded-card bg-bg p-3 text-sm text-muted" dir="ltr">
              $10.00 → −${promoOff({ ...p, code: p.code }, 10).toFixed(2)} = $
              {(10 - promoOff({ ...p, code: p.code }, 10)).toFixed(2)}
              {"  ·  "}
              used {p.used}
              {left !== null ? ` · ${left} left` : ""}
            </p>

            <button
              type="button"
              onClick={() => void save(p)}
              disabled={busy === p.rid}
              className="flex min-h-12 items-center justify-center gap-2 rounded-card bg-orange font-bold text-onaccent disabled:opacity-50"
            >
              {busy === p.rid ? (
                <IconSpinner className="size-4" />
              ) : saved === p.rid ? (
                <IconCheckCircle className="size-4" />
              ) : null}
              {saved === p.rid ? "Saved" : "Save"}
            </button>
          </section>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="flex min-h-12 items-center justify-center gap-2 rounded-card border border-dashed border-orange font-bold text-orange"
      >
        <IconPlus className="size-4" />
        Add a code
      </button>
    </div>
  );
}
