"use client";

import { useAuth } from "@/lib/auth";

/** خروج من اللوحة — مهمّ على جهاز مشترك (النصّ إنجليزي بطلبها) */
export default function AdminSignOut() {
  const { signOut } = useAuth();
  return (
    <button
      type="button"
      onClick={() => signOut()}
      className="min-h-11 shrink-0 rounded-card border border-line px-3.5 text-sm font-medium text-muted transition-colors hover:border-danger hover:text-danger"
    >
      Sign out
    </button>
  );
}
