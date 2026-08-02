"use client";

import { useCallback, useEffect, useState } from "react";
import { readBin, restoreItem, type BinItem } from "@/lib/recycle";
import { clearPayCache } from "@/lib/payments";
import { clearItemsCache } from "@/lib/items";
import { IconSpinner } from "@/components/icons";

/**
 * سلّة المحذوفات — كل ما أزلتِه من المتجر، في مكان واحد، بزرّ استعادة.
 *
 * ⚠️ ما يظهر هنا **ليس محذوفاً من قاعدة البيانات**: هو مخفيّ عن الزبون
 *    وحده. أمّا ما أضفتِه أنتِ من اللوحة وحذفتِه فقد مُحي نهائياً ولا
 *    يظهر هنا — لأن استعادته تعني إعادة إنشائه لا رفع علامة.
 */
export default function RecycleBin() {
  const [rows, setRows] = useState<BinItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => setRows(await readBin()), []);

  useEffect(() => {
    void load();
  }, [load]);

  async function restore(x: BinItem) {
    const key = `${x.col}/${x.id}`;
    setBusy(key);
    const ok = await restoreItem(x.col, x.id);
    setBusy(null);
    if (!ok) return setNote("Could not restore — check your access.");
    // الذاكرتان المؤقّتتان تُفرَّغان وإلا بقي المستعاد غائباً دقيقة
    clearPayCache();
    clearItemsCache();
    setNote(`${x.name} is back in the store.`);
    void load();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-card border border-dashed border-line p-3 text-sm text-muted">
        Everything you removed from the store — hidden from customers, not
        deleted. Press Restore to bring it back. Items you created here and
        deleted are gone for good and are not listed.
      </p>

      {note && (
        <p className="rounded-card border border-line bg-surface p-2.5 text-sm font-medium">
          {note}
        </p>
      )}

      {rows === null ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <IconSpinner className="size-4" /> Loading…
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
          The bin is empty — nothing is hidden from the store.
        </p>
      ) : (
        rows.map((x) => {
          const key = `${x.col}/${x.id}`;
          return (
            <article
              key={key}
              className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-muted line-through">
                  {x.name}
                </span>
                <span className="block text-xs text-muted">{x.kind}</span>
              </span>
              <button
                type="button"
                disabled={busy === key}
                onClick={() => void restore(x)}
                className="min-h-11 shrink-0 rounded-card border border-line px-4 font-bold disabled:opacity-50"
              >
                {busy === key ? "…" : "Restore"}
              </button>
            </article>
          );
        })
      )}
    </div>
  );
}
