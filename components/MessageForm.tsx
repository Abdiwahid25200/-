"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { site } from "@/lib/content";
import { IconSuccess } from "./icons";

/**
 * نموذج مراسلة الدعم.
 * بلا قاعدة بيانات بعد: يفتح واتساب برسالة جاهزة إن توفّر الرقم،
 * وإلا يعرض الرسالة لتُنسخ. يُربط بـ marjan-support-msgs في المرحلة ٣.
 */
export default function MessageForm() {
  const t = useTranslations("contactForm");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  const ready = name.trim() && contact.trim() && msg.trim();

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 py-2 outline-none focus:border-orange";

  function send() {
    if (!ready) return;
    const body = `${t("name")}: ${name}\n${t("contact")}: ${contact}\n\n${msg}`;
    if (site.whatsapp) {
      window.open(
        `https://wa.me/${site.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(body)}`,
        "_blank",
        "noopener",
      );
    }
    setSent(true);
  }

  if (sent) {
    return (
      <section className="rounded-card border-2 border-yellow bg-surface p-6 text-center">
        <span
          aria-hidden
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-yellow/15 text-yellow"
        >
          <IconSuccess className="size-8" />
        </span>
        <h2 className="mt-2 text-lg font-bold">{t("sentTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("sentNote")}</p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setName("");
            setContact("");
            setMsg("");
          }}
          className="mt-4 min-h-11 rounded-card border border-line px-5 text-sm font-medium text-muted transition-colors hover:border-orange hover:text-orange"
        >
          {t("again")}
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="mb-1 text-xl font-bold">{t("title")}</h2>
      <p className="mb-4 text-sm text-muted">{t("note")}</p>

      <div className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name") + " *"}
            aria-label={t("name")}
            className={field}
          />
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={t("contact") + " *"}
            aria-label={t("contact")}
            dir="ltr"
            className={`${field} text-start`}
          />
        </div>

        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={4}
          placeholder={t("message") + " *"}
          aria-label={t("message")}
          className={`${field} resize-y`}
        />

        <button
          type="button"
          onClick={send}
          disabled={!ready}
          className="min-h-12 self-start rounded-card bg-navy px-7 font-bold text-white transition-opacity enabled:hover:opacity-90 disabled:opacity-40"
        >
          {t("send")}
        </button>

        <p className="text-xs text-muted">
          {site.whatsapp ? t("goesWa") : t("goesAdmin")}
        </p>
      </div>
    </section>
  );
}
