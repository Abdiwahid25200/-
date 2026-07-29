"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/auth";
import Logo from "@/components/Logo";
import {
  IconChat,
  IconClose,
  IconDevice,
  IconDoc,
  IconMenu,
  IconUser,
} from "@/components/icons";

/**
 * قائمة اللوحة الجانبية.
 *
 * الترويسة كانت تحمل رابط المتجر وزرّ الخروج جنباً إلى جنب مع العنوان،
 * فتضيق على الجوال. نقلناهما هنا، وتبقى الترويسة للاسم وحده.
 */
export default function AdminMenu({
  tab,
  onTab,
}: {
  tab: "items" | "sections" | "faq";
  onTab: (t: "items" | "sections" | "faq") => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const row =
    "flex min-h-12 w-full items-center gap-3 rounded-card px-3 text-start font-medium transition-colors hover:bg-bg";

  const drawer = (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close menu"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/50"
      />
      <aside className="relative ms-auto flex h-full w-[min(20rem,85vw)] flex-col gap-1 overflow-y-auto border-s border-line bg-surface p-4">
        <div className="mb-2 flex items-center gap-3">
          <Logo solid className="size-10 shrink-0 rounded-[12px]" />
          <span className="min-w-0 flex-1 truncate font-bold">Ramaan Admin</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex size-10 items-center justify-center rounded-card text-muted hover:text-text"
          >
            <IconClose className="size-5" />
          </button>
        </div>

        <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-muted">
          Manage
        </p>
        <button
          type="button"
          onClick={() => {
            onTab("items");
            setOpen(false);
          }}
          className={`${row} ${tab === "items" ? "text-orange" : ""}`}
        >
          <IconDevice className="size-5 shrink-0" />
          Products
        </button>
        <button
          type="button"
          onClick={() => {
            onTab("sections");
            setOpen(false);
          }}
          className={`${row} ${tab === "sections" ? "text-orange" : ""}`}
        >
          <IconDoc className="size-5 shrink-0" />
          Sections
        </button>
        <button
          type="button"
          onClick={() => {
            onTab("faq");
            setOpen(false);
          }}
          className={`${row} ${tab === "faq" ? "text-orange" : ""}`}
        >
          <IconChat className="size-5 shrink-0" />
          Q&A
        </button>

        <p className="mt-3 px-3 pb-1 text-xs font-bold uppercase tracking-wide text-muted">
          Account
        </p>
        <a href="https://eramaan.com" className={row}>
          <IconUser className="size-5 shrink-0" />
          View store
        </a>
        <button type="button" onClick={() => signOut()} className={`${row} text-danger`}>
          <IconClose className="size-5 shrink-0" />
          Sign out
        </button>

        {user?.email && (
          <p className="num mt-auto break-all px-3 pt-4 text-xs text-muted" dir="ltr">
            {user.email}
          </p>
        )}
      </aside>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex size-12 shrink-0 items-center justify-center rounded-card border border-line text-muted transition-colors hover:text-text"
      >
        <IconMenu className="size-6" />
      </button>
      {mounted && open && createPortal(drawer, document.body)}
    </>
  );
}
