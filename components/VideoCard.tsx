"use client";

import { useState } from "react";
import { IconPlay } from "@/components/icons";
import { youtubeThumb } from "@/lib/video";

/**
 * 🎬 **لوحةُ شرح المتجر** في صفحة الدعم — طلبها (٠٧-٠٨): «رابط فيديو
 * أشرح فيه الموقع، وتصميمٌ فريدٌ لها».
 *
 * **والتصميم من لغة متجرها لا من خارجها**: الصفيحةُ **سداسية** (`.hex`)
 * كما في بلاطات الأقسام — وهي «وجه عملة» في لغة Coast، فتُقرأ العينُ
 * الشكلَ نفسه في الرئيسية وفي الدعم. والوسمُ `.eyeS` نفسه فوق كل
 * ترويسةِ قسم. فالكتلة جديدةٌ ولا تبدو غريبةً عن المتجر.
 *
 * 🚨 **ولا يُحمَّل مشغّل يوتيوب حتى تُضغط**: الإطارُ يجلب أكثر من
 *    ميغابايت من السكربتات ويفتح وصلاتٍ لأربعة نطاقات على **كل** من
 *    فتح صفحة الدعم — شاهد أو لم يشاهد. وبلاغُها (٠٤-٠٨) «تقطيع
 *    وتأخير في التطبيق» كان من هذا الجنس. فالمعروضُ صورةٌ ساكنة
 *    (خمسةَ عشرَ كيلوبايت)، والمشغّلُ لمن ضغط وحده.
 *
 * ⚠️ **والضغطةُ تُشغّل فوراً** (`autoplay=1`): من ضغط «تشغيل» يريد
 *    المشاهدة — ولو حُمّل المشغّلُ صامتاً لَاحتاج ضغطةً ثانية على زرٍّ
 *    آخر في مكانٍ آخر.
 */
export default function VideoCard({
  id,
  eyebrow,
  title,
  play,
}: {
  id: string;
  eyebrow: string;
  title: string;
  play: string;
}) {
  const [on, setOn] = useState(false);

  return (
    <section className="overflow-hidden rounded-card border border-line bg-navy shadow-sm">
      {/* نسبة ١٦:٩ ثابتة في الحالتين — فلا يقفز التخطيط عند الضغط */}
      <div className="relative aspect-video">
        {on ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setOn(true)}
            aria-label={play}
            className="group absolute inset-0 size-full text-start"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={youtubeThumb(id)}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />

            {/* ⚠️ تدرّجٌ داكن من الأسفل — نفسُ حيلة بلاطات الأقسام:
                يضمن قراءة الكلام مهما كانت الصورة فاتحة */}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/35 to-navy/10"
            />

            {/* الصفيحة السداسية — علامةُ المتجر نفسها */}
            <span
              aria-hidden
              className="hex absolute left-1/2 top-1/2 flex size-[68px] -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-orange text-onaccent transition-transform duration-200 group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            >
              {/* المثلّث مزاحٌ قليلاً: مركزُ الشكل البصريّ لا الهندسيّ */}
              <IconPlay className="size-7 translate-x-[2px]" />
            </span>

            <span className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4">
              <span className="eyeS !text-white/70">{eyebrow}</span>
              <b className="text-[15px] leading-snug text-white">{title}</b>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
