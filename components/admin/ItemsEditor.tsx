"use client";

import { useEffect, useState } from "react";
import {
  allItems,
  newItemId,
  removeItem,
  saveItem,
  type ItemKind,
  type ShopItem,
} from "@/lib/items";
import ImagePicker from "./ImagePicker";
import { IconCheckCircle, IconSpinner, IconTrash } from "@/components/icons";

const KINDS: { v: ItemKind; label: string; titleLabel: string }[] = [
  { v: "pubg", label: "شدات ببجي", titleLabel: "الكمّية (مثال: 660 UC)" },
  { v: "efootball", label: "كوينز eFootball", titleLabel: "اسم الباقة" },
  { v: "tiktok", label: "حسابات تيك توك", titleLabel: "اسم الحساب" },
  { v: "accounts", label: "حسابات eFootball", titleLabel: "اسم الحساب" },
  { v: "elec", label: "إلكترونيات", titleLabel: "اسم المنتج" },
];

const STATUSES = [
  { v: "on", label: "معروض ويُشترى" },
  { v: "soon", label: "قريباً" },
  { v: "off", label: "مخفي" },
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

  const load = (k: ItemKind) => {
    setItems(null);
    allItems(k).then(setItems);
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
    const ok = await saveItem(it.id, {
      kind: it.kind,
      title: it.title,
      sub: it.sub ?? "",
      price: Number(it.price) || 0,
      img: it.img ?? "",
      status: it.status,
      order: it.order,
      custom: it.custom,
    });
    setBusy(null);
    setSaved(ok ? it.id : null);
    if (!ok) alert("تعذّر الحفظ — تأكّدي من الاتصال.");
  }

  async function del(it: ShopItem) {
    if (!confirm(`حذف "${it.title}"؟`)) return;
    setBusy(it.id);
    const ok = await removeItem(it);
    setBusy(null);
    if (ok) load(kind);
    else alert("تعذّر الحذف.");
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
  const meta = KINDS.find((k) => k.v === kind)!;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
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
          <IconSpinner className="size-4" /> جارٍ التحميل…
        </p>
      ) : (
        <>
          {items.map((it) => {
            const isOpen = open === it.id;
            return (
              <section key={it.id} className="rounded-card border border-line bg-surface">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : it.id)}
                  className="flex w-full items-center gap-3 p-3.5 text-start"
                >
                  <span className="size-11 shrink-0 overflow-hidden rounded-card bg-bg">
                    {it.img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.img} alt="" className="size-full object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate font-bold">
                      {it.title || "بلا اسم"}
                    </span>
                    <span className="num block text-xs text-muted" dir="ltr">
                      ${Number(it.price).toFixed(2)}
                      {it.status !== "on" &&
                        ` · ${STATUSES.find((s) => s.v === it.status)?.label}`}
                    </span>
                  </span>
                  {saved === it.id && <IconCheckCircle className="size-5 text-yellow" />}
                  <span aria-hidden className="text-muted">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div className="flex flex-col gap-4 border-t border-line p-4">
                    <ImagePicker
                      value={it.img}
                      folder={kind}
                      onChange={(url) => patch(it.id, { img: url ?? "" })}
                    />

                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium">{meta.titleLabel}</span>
                      <input
                        value={it.title}
                        onChange={(e) => patch(it.id, { title: e.target.value })}
                        className={field}
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium">سطر صغير تحته</span>
                      <input
                        value={it.sub ?? ""}
                        onChange={(e) => patch(it.id, { sub: e.target.value })}
                        className={field}
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium">السعر بالدولار</span>
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

                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium">الترتيب</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={it.order ?? ""}
                          placeholder="الأصغر أولاً"
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
                      <span className="font-medium">الحالة</span>
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

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => save(it)}
                        disabled={busy === it.id}
                        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-card bg-orange font-bold text-onaccent disabled:opacity-50"
                      >
                        {busy === it.id && <IconSpinner className="size-4" />}
                        حفظ
                      </button>
                      <button
                        type="button"
                        onClick={() => del(it)}
                        disabled={busy === it.id}
                        className="flex min-h-12 items-center gap-2 rounded-card border border-line px-4 text-sm text-muted hover:border-danger hover:text-danger"
                      >
                        <IconTrash className="size-4" />
                        حذف
                      </button>
                    </div>
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
            + إضافة صنف جديد
          </button>
        </>
      )}
    </div>
  );
}
