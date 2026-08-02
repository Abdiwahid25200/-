"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { Link } from "@/i18n/navigation";
import { mergedItems, type ItemKind, type ShopItem } from "@/lib/items";
import { sections } from "@/lib/content";
import { fmt } from "@/lib/format";
import { IconClose, IconSearch, IconSpinner } from "./icons";

/**
 * البحث داخل المتجر — نافذة تفتح من الهيدر.
 *
 * تبحث في **كل ما يُشترى**: الشدّات والكوينز والحسابات والإلكترونيات،
 * وفي أسماء الأقسام. والمصدر هو `mergedItems` نفسه الذي تعرضه الصفحات،
 * فما تضيفه صاحبة المتجر من اللوحة يُوجَد بالبحث فوراً، والمخفيّ لا يظهر.
 *
 * والقراءة عند أوّل فتح فقط (ولها ذاكرة ثلاثين ثانية في `lib/items.ts`)،
 * فلا تُحمَّل بيانات على من لم يبحث.
 */

const KINDS: ItemKind[] = ["pubg", "efootball", "tiktok", "accounts", "elec"];

/** أين تُفتح كل نتيجة */
const HREF: Record<ItemKind, string> = {
  pubg: "/pubg",
  efootball: "/efootball",
  tiktok: "/tiktok",
  accounts: "/efootball-accounts",
  elec: "/",
};

/** تطبيع خفيف: يُسقط التشكيل ويوحّد الألف والياء، فيجد "العاب" كلمة "ألعاب" */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ً-ْ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[,\s]+/g, " ")
    .trim();

export default function SearchButton({ wide = false }: { wide?: boolean }) {
  const t = useTranslations("search");
  const tp = useTranslations("pages");

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ShopItem[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // تُقرأ مرّة واحدة عند أوّل فتح
  useEffect(() => {
    if (!open || items) return;
    Promise.all(KINDS.map((k) => mergedItems(k)))
      .then((lists) => setItems(lists.flat()))
      .catch(() => setItems([]));
  }, [open, items]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    setTimeout(() => inputRef.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const results = useMemo(() => {
    const query = norm(q);
    if (query.length < 1) return { secs: [], list: [] as ShopItem[] };

    const secs = sections
      .filter((s) => s.status === "on" && norm(tp(s.key)).includes(query))
      .slice(0, 3);

    const list = (items ?? [])
      .filter((i) =>
        [i.title, i.sub ?? "", String(i.price)].some((v) => norm(v).includes(query)),
      )
      .slice(0, 12);

    return { secs, list };
  }, [q, items, tp]);

  /** الأصناف لم تصل بعد — لا نقول "لا نتائج" ونحن لم نبحث فيها أصلاً */
  const loading = items === null;
  const empty =
    q.trim() && !loading && !results.secs.length && !results.list.length;

  const panel = (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg/95 backdrop-blur">
      {/* شريط الكتابة */}
      <div className="flex items-center gap-2 border-b border-line bg-surface p-3">
        <span aria-hidden className="text-muted">
          <IconSearch className="size-5" />
        </span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          autoCapitalize="none"
          autoCorrect="off"
          className="min-h-12 flex-1 bg-transparent text-base outline-none"
        />
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t("close")}
          className="nav-tap flex size-11 shrink-0 items-center justify-center rounded-full text-muted"
        >
          <IconClose className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {!q.trim() ? (
          <p className="p-6 text-center text-sm text-muted">{t("hint")}</p>
        ) : loading ? (
          <p className="flex items-center justify-center gap-2 p-6 text-sm text-muted">
            <IconSpinner className="size-4" /> {t("loading")}
          </p>
        ) : empty ? (
          <p className="p-6 text-center text-sm text-muted">
            {t("none", { q: q.trim() })}
          </p>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-2">
            {results.secs.map((s) => (
              <Link
                key={s.key}
                href={s.href}
                onClick={() => setOpen(false)}
                className="lift flex min-h-14 items-center gap-3 rounded-card border border-line bg-surface px-4"
              >
                <span className="text-xs font-bold text-orange">{t("section")}</span>
                <span className="font-bold">{tp(s.key)}</span>
              </Link>
            ))}

            {results.list.map((i) => (
              <Link
                key={`${i.kind}-${i.id}`}
                href={HREF[i.kind]}
                onClick={() => setOpen(false)}
                className="lift flex min-h-16 items-center gap-3 rounded-card border border-line bg-surface p-3"
              >
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate font-bold">{i.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {tp(
                      i.kind === "accounts"
                        ? "efootballAccounts"
                        : i.kind === "elec"
                          ? "electronics"
                          : i.kind,
                    )}
                  </span>
                </span>
                <span className="num shrink-0 font-bold text-yellow" dir="ltr">
                  {fmt(i.price)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* `wide` = داخل القائمة الجانبية: حقلٌ يُقرأ، لا أيقونةٌ تُخمَّن */}
      {wide ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-12 w-full items-center gap-2.5 rounded-card border border-line bg-bg px-3 text-sm text-muted transition-colors hover:border-orange"
        >
          <IconSearch className="size-5 shrink-0" />
          {t("open")}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("open")}
          className="nav-tap flex size-11 items-center justify-center rounded-full text-muted hover:text-orange"
        >
          <IconSearch className="size-6" />
        </button>
      )}

      {open && typeof document !== "undefined" && createPortal(panel, document.body)}
    </>
  );
}
