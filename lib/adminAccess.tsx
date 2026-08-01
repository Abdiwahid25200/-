"use client";

import { createContext, useContext } from "react";
import { NO_ACCESS, type Access, type Perm } from "./staff";

/**
 * صلاحيات من يستعمل اللوحة الآن — تُحسب مرّة في البوّابة وتُقرأ في كل تبويب.
 *
 * ⚠️ هذه **واجهة فقط**: تُخفي ما لا يُسمح به لئلّا يرى المساعد أزراراً لا
 *    تعمل. المنع الحقيقي في `firestore.rules` عند الخادم.
 */
const Ctx = createContext<Access>(NO_ACCESS);

export const AccessProvider = Ctx.Provider;

export function useAccess() {
  return useContext(Ctx);
}

/** هل يملك هذا الباب؟ صاحبة المتجر تملك كل الأبواب دائماً */
export function useCan(p: Perm): boolean {
  const a = useContext(Ctx);
  return a.role === "owner" || a.can[p] === true;
}
