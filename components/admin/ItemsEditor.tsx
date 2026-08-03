"use client";

import { useEffect, useState } from "react";
import {
  allItems,
  DETAIL_KINDS,
  newItemId,
  removeItem,
  restoreItem,
  saveItem,
  type ItemDoc,
  type ItemKind,
  type ShopItem,
} from "@/lib/items";
import { customSections } from "@/lib/overrides";
import { diff, hasChanges } from "@/lib/dirty";
import { profitOf, readCosts, saveCost, type Costs } from "@/lib/costs";
import ImagePicker from "./ImagePicker";
import GalleryPicker from "./GalleryPicker";
import {
  IconCheckCircle,
  IconMinus,
  IconPlus,
  IconSpinner,
  IconTrash,
} from "@/components/icons";

type KindOption = { v: ItemKind; label: string; titleLabel: string };

/** الحقول التي تكتبها هذه الشاشة — ومنها تُبنى النسخة الأصل والفرق */
function payloadOf(i: ShopItem): ItemDoc {
  return {
    kind: i.kind,
    title: i.title,
    sub: i.sub ?? "",
    price: Number(i.price) || 0,
    points: i.points === undefined ? undefined : Number(i.points) || 0,
    img: i.img ?? "",
    status: i.status,
    order: i.order,
    custom: i.custom,
  };
}

const KINDS: KindOption[] = [
  { v: "pubg", label: "PUBG UC", titleLabel: "Amount (e.g. 660 UC)" },
  { v: "efootball", label: "eFootball", titleLabel: "Pack name" },
  { v: "tiktok", label: "TikTok", titleLabel: "Account name" },
  { v: "accounts", label: "eFootball accounts", titleLabel: "Account name" },
  { v: "elec", label: "Electronics", titleLabel: "Product name" },
];

const STATUSES = [
  { v: "on", label: "Live" },
  { v: "soon", label: "Coming soon" },
  { v: "off", label: "Hidden" },
] as const;

/**
 * تعديل الباقات والمنتجات: الصورة · الاسم · السعر · الحالة · الترتيب،
 * مع إضافة صنف جديد وحذفه.
 *
 * الحذف يفرّق بين نوعين عمداً: المضاف من هنا يُمحى، والأصلي يُخفى —
 * لأن مسح الأصلي من قاعدة البيانات لا يمحوه من الملفات فيعود ويحتار من حذفه.
 */
export default function ItemsEditor() {
  const [kind, setKind] = useState<ItemKind>("pubg");
  const [items, setItems] = useState<ShopItem[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  /** الأقسام التي أنشأتها صاحبة المتجر — تظهر هنا كي تملأها بأصنافها */
  const [extra, setExtra] = useState<KindOption[]>([]);
  /** التكاليف — مجموعة منفصلة لا يقرأها أحد سواك (`lib/costs.ts`) */
  const [costs, setCosts] = useState<Costs>({});

  useEffect(() => {
    void readCosts().then(setCosts);
  }, []);

  useEffect(() => {
    void customSections().then((list) =>
      setExtra(
        list.map((c) => ({
          v: c.key as ItemKind,
          label: c.over?.title?.ar || c.over?.title?.en || c.key,
          titleLabel: "Item name",
        })),
      ),
    );
  }, []);

  /**
   * ⚠️ **نسخة ما حُمِّل** — بها وحدها نعرف ما لمستِه أنتِ.
   *    بدونها كانت الشاشة ترسل الوثيقة كاملة فتمحو تعديل مساعدٍ آخر
   *    على حقلٍ لم تفتحيه أصلاً (`lib/dirty.ts`).
   */
  const [base, setBase] = useState<Record<string, ItemDoc>>({});

  const load = (k: ItemKind) => {
    setItems(null);
    allItems(k).then((list) => {
      setItems(list);
      setBase(Object.fromEntries(list.map((i) => [i.id, payloadOf(i)])));
    });
  };

  useEffect(() => load(kind), [kind]);

  function patch(id: string, p: Partial<ShopItem>) {
    setItems((list) =>
      (list ?? []).map((i) => (i.id === id ? { ...i, ...p } : i)),
    );
    setSaved(null);
  }

  async function save(it: ShopItem) {
    setBusy(it.id);
    // التكلفة تُحفظ في مجموعتها الخاصّة، لا مع بيانات المنتج العامّة
    if (costs[it.id] !== undefined) await saveCost(it.id, costs[it.id]);

    /* ما تغيّر وحده. صنفٌ جديد لا نسخةَ له ⇒ يُرسل كاملاً. */
    const changed = diff(base[it.id], payloadOf(it));

    if (!hasChanges(changed)) {
      setBusy(null);
      setSaved(it.id);           // لا شيء ليُحفظ — ولا داعي لكتابةٍ فارغة
      return;
    }

    const ok = await saveItem(it.id, changed);
    setBusy(null);
    setSaved(ok ? it.id : null);
    // النسخة الأصل تتقدّم بما حُفظ، فحفظٌ ثانٍ لا يعيد إرسال ما مضى
    if (ok) setBase((b) => ({ ...b, [it.id]: payloadOf(it) }));
    else alert("Could not save — check your connection.");
  }

  async function del(it: ShopItem) {
    // الفرق حقيقي فيُقال: المضاف من اللوحة يُمحى، والأصلي يُخفى ويُرجَع
    const msg = it.custom
      ? `Delete “${it.title || "Untitled"}” for good? This cannot be undone.`
      : `Remove “${it.title || "Untitled"}” from the store?\nCustomers stop seeing it. You can restore it here anytime.`;
    if (!confirm(msg)) return;
    setBusy(it.id);
    const ok = await removeItem(it);
    setBusy(null);
    if (ok) {
      setOpen(null);
      load(kind);
    } else alert("Could not delete.");
  }

  async function restore(it: ShopItem) {
    setBusy(it.id);
    const ok = await restoreItem(it);
    setBusy(null);
    if (ok) load(kind);
    else alert("Could not restore.");
  }

  function add() {
    const id = newItemId(kind);
    setItems((list) => [
      ...(list ?? []),
      { id, kind, title: "", price: 0, status: "on", custom: true },
    ]);
    setOpen(id);
    setSaved(null);
  }

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange";
  const kinds = [...KINDS, ...extra];
  const meta =
    kinds.find((k) => k.v === kind) ??
    ({ v: kind, label: String(kind), titleLabel: "Item name" } as KindOption);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {kinds.map((k) => (
          <button
            key={k.v}
            type="button"
            onClick={() => setKind(k.v)}
            className={`min-h-11 rounded-card border px-3.5 text-sm font-medium ${
              kind === k.v ? "border-orange text-orange" : "border-line text-muted"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {items === null ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <IconSpinner className="size-4" /> Loading…
        </p>
      ) : (
        <>
          {items.map((it) => {
            const isOpen = open === it.id;
            return (
              <section
                key={it.id}
                className={`rounded-card border bg-surface ${
                  it.hidden ? "border-dashed border-line/70" : "border-line"
                }`}
              >
                {/* الصفّ ليس زرّاً واحداً: الحذف والاسترجاع هنا في متناول
                    الإصبع، بلا فتح البطاقة والنزول إلى أسفلها.

                    ⚠️ وشريط الخطورة (`.sv`) أوّلَه: **الحالة تُرى قبل أن
                    تُقرأ** — الأخضر يعمل، والذهبيّ «قريباً»، والرماديّ
                    مخفيٌّ عن الزبون. */}
                <div
                  className={`adm-q border-0 py-0 pe-1 ps-0 ${
                    it.hidden || it.status === "off"
                      ? ""
                      : it.status === "soon"
                        ? "wait"
                        : "done"
                  }`}
                >
                  <span className="sv my-3" />
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : it.id)}
                    className={`flex min-w-0 flex-1 items-center gap-3 py-3 text-start ${
                      it.hidden ? "opacity-55" : ""
                    }`}
                  >
                    <span className="size-11 shrink-0 overflow-hidden rounded-card bg-bg">
                      {it.img && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.img} alt="" className="size-full object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span
                        className={`block truncate font-bold ${
                          it.hidden ? "line-through" : ""
                        }`}
                      >
                        {it.title || "Untitled"}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <span className="num shrink-0 text-sm font-bold text-gold" dir="ltr">
                          ${Number(it.price).toFixed(2)}
                        </span>
                        {it.hidden ? (
                          <span className="adm-st">Removed</span>
                        ) : (
                          it.status !== "on" && (
                            <span className={`adm-st ${it.status === "soon" ? "soon" : ""}`}>
                              {STATUSES.find((s) => s.v === it.status)?.label}
                            </span>
                          )
                        )}
                      </span>
                    </span>
                    {saved === it.id && <IconCheckCircle className="size-5 text-yellow" />}
                  </button>

                  {it.hidden ? (
                    <button
                      type="button"
                      onClick={() => restore(it)}
                      disabled={busy === it.id}
                      className="min-h-12 shrink-0 rounded-card border border-orange px-3 text-sm font-bold text-orange disabled:opacity-50"
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => del(it)}
                      disabled={busy === it.id}
                      aria-label={`Remove ${it.title || "item"}`}
                      className="flex size-12 shrink-0 items-center justify-center rounded-card text-muted hover:text-danger disabled:opacity-50"
                    >
                      {busy === it.id ? (
                        <IconSpinner className="size-4" />
                      ) : (
                        <IconTrash className="size-5" />
                      )}
                    </button>
                  )}

                  {/* 🔒 أيقونةٌ مرسومة لا محرف: `−` و`+` كانا محرفَين
                      يتغيّر شكلهما بين جهازٍ وجهاز — القرار المقفول (ب) */}
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : it.id)}
                    aria-label={isOpen ? "Close" : "Edit"}
                    className="flex size-12 shrink-0 items-center justify-center text-muted"
                  >
                    {isOpen ? <IconMinus className="size-5" /> : <IconPlus className="size-5" />}
                  </button>
                </div>

                {isOpen && (
                  <div className="flex flex-col gap-4 border-t border-line p-4">
                    <ImagePicker
                      value={it.img}
                      folder={kind}
                      onChange={(url) => patch(it.id, { img: url ?? "" })}
                    />

                    {/* معرض صفحة الصنف — للحسابات والإلكترونيات وحدها:
                        باقةُ شدّاتٍ لا صفحة لها فلا معرض لها. */}
                    {DETAIL_KINDS.includes(kind) && (
                      <GalleryPicker
                        value={it.imgs}
                        folder={kind}
                        label="Photos on the item page"
                        onChange={(imgs) => patch(it.id, { imgs })}
                      />
                    )}

                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium">{meta.titleLabel}</span>
                      <input
                        value={it.title}
                        onChange={(e) => patch(it.id, { title: e.target.value })}
                        className={field}
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium">Small line below</span>
                      <input
                        value={it.sub ?? ""}
                        onChange={(e) => patch(it.id, { sub: e.target.value })}
                        className={field}
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium">Price (USD)</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={it.price}
                          onChange={(e) =>
                            patch(it.id, { price: Number(e.target.value) })
                          }
                          dir="ltr"
                          className={`${field} num text-start`}
                        />
                      </label>

                      {/* 🔒 التكلفة والربح — لكِ وحدك، لا يراهما الزبون */}
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium">Cost (private)</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0}
                          value={costs[it.id] ?? ""}
                          placeholder="What you pay"
                          onChange={(e) =>
                            setCosts((c) => ({
                              ...c,
                              [it.id]:
                                e.target.value === "" ? 0 : Number(e.target.value),
                            }))
                          }
                          dir="ltr"
                          className={`${field} num text-start`}
                        />
                      </label>

                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium">Profit</span>
                        <span
                          className={`num flex min-h-12 items-center rounded-card border border-line px-3 font-bold ${
                            (profitOf(Number(it.price), costs[it.id]) ?? 0) < 0
                              ? "text-danger"
                              : "text-orange"
                          }`}
                          dir="ltr"
                        >
                          {costs[it.id] === undefined
                            ? "—"
                            : `$${(profitOf(Number(it.price), costs[it.id]) ?? 0).toFixed(2)}`}
                        </span>
                      </label>

                      {/* نقاط الولاء — الفراغ يعني «استعملي الافتراضي العام» */}
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium">Points</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          value={it.points ?? ""}
                          placeholder="Default"
                          onChange={(e) =>
                            patch(it.id, {
                              points:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            })
                          }
                          dir="ltr"
                          className={`${field} num text-start`}
                        />
                      </label>

                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium">Order</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={it.order ?? ""}
                          placeholder="Lowest first"
                          onChange={(e) =>
                            patch(it.id, {
                              order: e.target.value === "" ? undefined : Number(e.target.value),
                            })
                          }
                          dir="ltr"
                          className={`${field} num text-start`}
                        />
                      </label>
                    </div>

                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium">Status</span>
                      <select
                        value={it.status}
                        onChange={(e) =>
                          patch(it.id, { status: e.target.value as ShopItem["status"] })
                        }
                        className={field}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.v} value={s.v}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    {it.hidden && (
                      <p className="text-xs text-muted">
                        Removed from the store — customers do not see it. Tap
                        “Restore” above to bring it back.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => save(it)}
                      disabled={busy === it.id}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-card bg-orange font-bold text-onaccent disabled:opacity-50"
                    >
                      {busy === it.id && <IconSpinner className="size-4" />}
                      Save
                    </button>
                  </div>
                )}
              </section>
            );
          })}

          <button
            type="button"
            onClick={add}
            className="min-h-12 rounded-card border border-dashed border-orange font-bold text-orange"
          >
            + Add new item
          </button>
        </>
      )}
    </div>
  );
}
