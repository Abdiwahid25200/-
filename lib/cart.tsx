"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartLine = {
  id: string;
  name: string;
  price: number; // السعر النهائي بعد الخصم
  /** عليه خصمٌ أصلاً — فلا يجتمع معه كود خصم إلا بإذنها */
  sale?: boolean;
  img?: string;
  qty: number;
};

type CartApi = {
  lines: CartLine[];
  count: number;
  total: number;
  add: (item: Omit<CartLine, "qty">) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  ready: boolean;
};

const KEY = "rs-cart";
const Ctx = createContext<CartApi | null>(null);

/** سلة الإلكترونيات — محفوظة على الجهاز، فلا تضيع عند تحديث الصفحة */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* تخزين معطّل أو بيانات تالفة — نبدأ بسلة فارغة */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* التخزين ممتلئ أو محظور — السلة تبقى بالذاكرة فقط */
    }
  }, [lines, ready]);

  const add = useCallback((item: Omit<CartLine, "qty">) => {
    setLines((prev) => {
      const at = prev.findIndex((l) => l.id === item.id);
      if (at === -1) return [...prev, { ...item, qty: 1 }];
      const next = [...prev];
      next[at] = { ...next[at], qty: next[at].qty + 1 };
      return next;
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback(
    (id: string) => setLines((prev) => prev.filter((l) => l.id !== id)),
    [],
  );

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartApi>(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const total = +lines.reduce((s, l) => s + l.price * l.qty, 0).toFixed(2);
    return { lines, count, total, add, setQty, remove, clear, ready };
  }, [lines, add, setQty, remove, clear, ready]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart يجب أن يُستخدم داخل CartProvider");
  return c;
}
