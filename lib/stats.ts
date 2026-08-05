"use client";

/**
 * أرقام الثقة — ما يراه الغريب قبل أن يدفع.
 *
 * ⚠️ **لماذا وثيقة مستقلّة لا عدٌّ للطلبات؟**
 *    قواعدنا تمنع الزائر من قراءة `orders` — وهذا صواب لا يُمسّ.
 *    فلو أردنا عدّها في المتصفّح لَما استطاع الزائر ذلك أصلاً، ولو
 *    فتحناها له لَقرأ طلبات الناس. الحلّ: رقمٌ مُجمَّع في
 *    `settings/stats` — يقرأه الجميع، ولا يكتبه إلا من يملك الطلبات.
 *
 * ⚠️ **ولا يُعرض رقمٌ ضعيف**: أقلّ من عشرين طلباً تُضعف الثقة لا تبنيها،
 *    فالشريط يُخفي نفسه حتى يصير الرقم مقنعاً.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { fbDb } from "./firebase";
import { share } from "./share";
import { withTimeout } from "./timeout";

/** دون هذا العدد لا يظهر الشريط */
export const MIN_ORDERS = 20;

/** طلبٌ نُسي شهراً لا يمثّل سرعتك — يُستبعد من المتوسّط */
const MAX_MINUTES = 60 * 24 * 3;

export type PublicStats = {
  /** عدد الطلبات المسلَّمة */
  done: number;
  /** مجموع دقائق التسليم — المتوسّط يُقسم عند العرض */
  minutes: number;

  /* ── آخر تسليم — للشريط الحيّ في الرئيسية ──
     🔒 **اسمُ الصنف ووقتُه لا غير.** الوثيقة يقرأها كل زائر، فلا يدخلها
        اسمٌ ولا رقمٌ ولا آيدي لعبة ولا رمز طلب. «٦٦٠ شدّة قبل ٣ دقائق»
        تُثبت أن المتجر يعمل، ولا تكشف من اشترى. */
  lastItem: string;
  lastAt: Date | null;
};

export const EMPTY_STATS: PublicStats = {
  done: 0,
  minutes: 0,
  lastItem: "",
  lastAt: null,
};

/** متوسّط دقائق التسليم — صفرٌ إن لم يُقَس شيء بعد */
export function avgMinutes(s: PublicStats): number {
  return s.done > 0 && s.minutes > 0 ? Math.round(s.minutes / s.done) : 0;
}

/** ⚠️ مشتركة: شريطُ الحالة وشريطُ الأرقام يسألان عنها في الصفحة نفسها */
export const readStats = (): Promise<PublicStats> =>
  share("stats", 60_000, readStatsRaw);

async function readStatsRaw(): Promise<PublicStats> {
  const db = fbDb();
  if (!db) return EMPTY_STATS;
  try {
    const snap = await withTimeout(getDoc(doc(db, "settings", "stats")));
    const v = snap.exists() ? snap.data() : {};
    return {
      done: Math.max(0, Number(v.done) || 0),
      minutes: Math.max(0, Number(v.minutes) || 0),
      lastItem: String(v.lastItem ?? "").slice(0, 60),
      lastAt: v.lastAt?.toDate?.() ?? null,
    };
  } catch {
    return EMPTY_STATS;
  }
}

/**
 * يُنادى بعد تسليم طلب — **خارج معاملة الحالة عمداً**.
 * عدّادُ عرضٍ لا يستحقّ أن يُفشل تسليم طلبٍ لو رُفضت كتابته.
 */
export async function bumpDelivered(
  createdAt: unknown,
  /** ما سُلّم — يُنشر في الشريط الحيّ. بلاه يُحدَّث العدّاد وحده */
  item?: string,
): Promise<void> {
  const db = fbDb();
  if (!db) return;

  const started =
    createdAt instanceof Date
      ? createdAt.getTime()
      : typeof (createdAt as { toDate?: () => Date })?.toDate === "function"
        ? (createdAt as { toDate: () => Date }).toDate().getTime()
        : 0;

  const mins = started ? Math.round((Date.now() - started) / 60_000) : 0;
  const counted = mins > 0 && mins <= MAX_MINUTES ? mins : 0;

  try {
    /* ⚠️ اسمُ الصنف يُقصّ إلى ٦٠ حرفاً: عنوانٌ طويل كتبتِه من اللوحة
       يكسر سطر الشريط على الجوّال، والقصّ عند الكتابة أضمنُ من القصّ
       عند العرض — فلا تُخزَّن في وثيقةٍ عامّة نصوصٌ لا داعي لها. */
    const clean = String(item ?? "").trim().slice(0, 60);

    await setDoc(
      doc(db, "settings", "stats"),
      {
        done: increment(1),
        minutes: increment(counted),
        ...(clean ? { lastItem: clean, lastAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    /* عدّادٌ فقط — لا يُبلَّغ ولا يُعطّل شيئاً */
  }
}

/**
 * إعادة الحساب من الطلبات نفسها — لصاحبة المتجر.
 * تُستعمل مرّة عند التشغيل ليُحسب ما سُلّم قبل بناء العدّاد.
 */
export async function recalcStats(n = 1000): Promise<PublicStats | null> {
  const db = fbDb();
  if (!db) return null;
  try {
    const snap = await withTimeout(
      getDocs(
        query(collection(db, "orders"), orderBy("createdAt", "desc"), fbLimit(n)),
      ),
      20_000,
    );

    let done = 0;
    let minutes = 0;
    /* الطلبات مرتّبةٌ بالأحدث، فأوّلُ مسلَّمٍ نلقاه هو آخرُ تسليم */
    let lastItem = "";
    let lastAt: Date | null = null;

    for (const d of snap.docs) {
      const v = d.data();
      if (v.status !== "done") continue;
      done += 1;

      if (!lastItem) {
        lastItem = String(v.items?.[0]?.title ?? "").trim().slice(0, 60);
        lastAt = v.updatedAt?.toDate?.() ?? v.createdAt?.toDate?.() ?? null;
      }

      const from = v.createdAt?.toDate?.()?.getTime?.() ?? 0;
      const to = v.updatedAt?.toDate?.()?.getTime?.() ?? 0;
      const m = from && to ? Math.round((to - from) / 60_000) : 0;
      if (m > 0 && m <= MAX_MINUTES) minutes += m;
    }

    await setDoc(
      doc(db, "settings", "stats"),
      {
        done,
        minutes,
        ...(lastItem ? { lastItem, ...(lastAt ? { lastAt } : {}) } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return { done, minutes, lastItem, lastAt };
  } catch {
    return null;
  }
}

/**
 * أقصى متوسّطٍ يستحقّ أن يُقال — بالدقائق.
 *
 * ⚠️ **الرقم هنا دعوةٌ للشراء لا تقريرٌ محاسبيّ**: «٤ دقائق» تبيع،
 *    و«١٥ ساعة» تصرف الزبون إلى غيرك وهو واقفٌ على بابك. ولا نكذب:
 *    نصمت. والمتوسّط يتحسّن وحده كلّما شُحن بسرعة، فيعود الرقم بلا كود.
 *
 * 🔒 **وموضعه هنا لا في المكوّنات**: كانت القاعدة في `OpenBar` وحدها،
 *    فبقيت `GiftProof` تقول «15 h average delivery» في صفحة الألعاب
 *    بينما يصمت شريط الترويسة عن الرقم نفسه — قاعدةٌ في مكانين تعني
 *    مكاناً واحداً يُنسى.
 */
export const MAX_SHOW_MIN = 120;

/** هل يُقال المتوسّط؟ صفرٌ لا يُقال، والبطيء لا يُقال */
export const tellSpeed = (avg: number) => avg > 0 && avg <= MAX_SHOW_MIN;
