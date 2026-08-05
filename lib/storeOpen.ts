"use client";

/**
 * قراءة حالة المتجر **من المتصفّح** وتمريرها لكل من يحتاجها.
 *
 * الحساب نفسه في `lib/openCore.ts` (بلا React) — لأن الخادم يحتاجه
 * أيضاً، ولا يستورد الخادمُ ملفاً فيه خطّافات. وهذا الملف يعيد تصدير
 * كل ما هناك، فمن كان يستورد من `storeOpen` لا يتغيّر عنده شيء.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { fbDb } from "./firebase";
import {
  DEFAULT_OPEN,
  normalizeOpen,
  openNow,
  type OpenSettings,
  type OpenState,
} from "./openCore";

export * from "./openCore";

export async function readOpenSettings(): Promise<OpenSettings> {
  const db = fbDb();
  if (!db) return DEFAULT_OPEN;
  try {
    const snap = await getDoc(doc(db, "settings", "store"));
    return normalizeOpen((snap.exists() ? snap.data() : {}) as Partial<OpenSettings>);
  } catch {
    // تعذّرت القراءة ⇒ **المتجر مفتوح**: خطأٌ في الشبكة يجب ألّا يقفل متجراً
    return DEFAULT_OPEN;
  }
}

/**
 * 🐞 **قراءةٌ لا تُتلف ما بين يديك** — عطلٌ انكشف وأنا أختبر الضريبة
 *    (٠٤-٠٨).
 *
 * `readOpenSettings` تُرجع **الإعدادات الافتراضية** حين تتعثّر الشبكة
 * (وهذا صوابٌ لمن لا يملك شيئاً: خطأٌ في الشبكة لا يقفل متجراً). لكنّ
 * المراجعة الدورية في المتصفّح كانت تستعملها، فإذا تعثّرت قراءةٌ واحدة
 * **مُسحت إعدادات المتجر الحقيقية** التي جاءت من الخادم وحلّ محلّها
 * الافتراضيّ: فتختفي الضريبة من الفاتورة، ويتبدّل شكل صفحة الإغلاق،
 * وتعود ساعات الدوام إلى ٩–٢٣ — كلّه لأن الجوّال دخل نفقاً.
 *
 * فهذه تُرجع `null` عند التعثّر، والمراجعة تتجاهلها وتُبقي ما عندها.
 * **ولا يُستبدل معلومٌ بمجهول.**
 */
async function pullOpen(): Promise<OpenSettings | null> {
  const db = fbDb();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "settings", "store"));
    return normalizeOpen((snap.exists() ? snap.data() : {}) as Partial<OpenSettings>);
  } catch {
    return null;
  }
}

/**
 * الحالة الحيّة يقرؤها كل مَن يحتاجها — من **مصدرٍ واحد**.
 *
 * ⚠️ كانت كل قطعةٍ تقرأ الوثيقة بنفسها (الشريط · بطاقة السرعة · تدفّق
 *    الشراء · السلّة) — أربع قراءاتٍ لشيءٍ واحد في كل فتحةِ صفحة، وأربع
 *    لحظاتٍ مختلفة قد تتناقض. صارت `StoreGate` تقرأ مرّةً وتُمرّرها.
 */
export const StoreOpenCtx = createContext<OpenState | null>(null);

/**
 * القراءة الحيّة نفسها — تُنادى في `StoreGate` وحدها.
 *
 * `initial` تأتي من الخادم، فأوّل رسمةٍ في المتصفّح تطابق ما رُسم هناك
 * (لا وميض)، ثم تُراجَع من Firestore وتُعاد كل دقيقة فينقلب الحال عند
 * رأس الساعة بلا إعادة تحميل.
 */
export function useLiveOpen(initial: OpenSettings, enabled = true): OpenState {
  const [s, setS] = useState<OpenSettings>(initial);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    /* ⚠️ تُقرأ الوثيقة كل دقيقة لا مرّةً واحدة: من أغلقتِ المتجر وهو
       يتصفّح يجب أن تنزل عليه الستارة، لا أن يبقى يشتري حتى يحدّث. */
    const pull = () => void pullOpen().then((v) => v && alive && setS(v));
    /* ⚠️ **ولا قراءةَ في اللحظة الأولى**: `initial` جاءت من الخادم مع
       الصفحة (وعمرها دقيقةٌ على الأكثر)، فقراءتُها ثانيةً وقت الفتح
       رحلةُ شبكةٍ بلا خبرٍ جديد — وهي تقع في أثقل لحظات الصفحة.
       المراجعة تبدأ بعد الدقيقة الأولى (بلاغ التقطيع ٠٤-٠٨). */
    const id = setInterval(() => {
      pull();
      setTick((n) => n + 1);
    }, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [enabled]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return openNow(s, Date.now() + tick * 0);
}

/** الحالة كما رآها `StoreGate` — وبلا بوّابة (اللوحة مثلاً) تقرأ بنفسها */
export function useStoreOpen(): OpenState {
  const shared = useContext(StoreOpenCtx);
  const own = useLiveOpen(DEFAULT_OPEN, shared === null);
  return shared ?? own;
}
