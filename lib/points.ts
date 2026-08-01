/**
 * نظام النقاط — Ramaan Store
 *
 * 🔒 **القاعدة الأولى: النقاط لا تُكتب من جهاز الزبون أبداً.**
 *    لو كان الرصيد حقلاً يكتبه صاحبه، لفتح أي شخص أدوات المتصفّح وكتب
 *    لنفسه مليون نقطة. لذلك `firestore.rules` تمنع الزبون من تغيير
 *    `points` في وثيقته — يقرأها فقط — والكتابة للأدمن وحده.
 *
 * 💵 قيمة النقطة: **سنت واحد** (قرار صاحبة المتجر: عشر نقاط = عشرة سنتات).
 *
 * 🧾 ولماذا سجلّ حركات (`users/{uid}/ledger`) لا رقمٌ مجرّد؟
 *    لأن الطلب المُلغى **يُخصم منه فوراً**، ولا نعرف كم نخصم إلا إذا
 *    سجّلنا كم مُنح ومتى ولأي طلب. والسجلّ يجيب الزبون حين يسأل
 *    "من أين جاءت نقاطي؟" بلا أن تفتحي قاعدة البيانات.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { fbDb } from "./firebase";
import { withTimeout } from "./timeout";
import { readPackages, readProducts } from "./overrides";

/**
 * هويّة برنامج النقاط.
 * برنامج الولاء اسمٌ يحفظه الزبون لا «نقاط» مجرّدة — فله اسمه وشعاره،
 * ويظهران أينما ذُكرت النقاط. وكلاهما يُغيَّر من اللوحة.
 */
export const POINTS_BRAND = "Barwaaqo";
export const POINTS_ICON = "/images/points/barwaaqo-icon.png";
export const POINTS_WORDMARK = "/images/points/barwaaqo.png";

/** قيمة النقطة الواحدة بالدولار — ١٠ نقاط = ٠٫١٠ دولار */
export const USD_PER_POINT = 0.01;

/** رصيد بالنقاط ⇐ قيمته بالدولار، مقرّبة إلى سنتين */
export const pointsToUsd = (points: number) =>
  Math.round(Math.max(0, points) * USD_PER_POINT * 100) / 100;

/** المبلغ بالدولار ⇐ كم نقطة يلزم لتغطيته */
export const usdToPoints = (usd: number) => Math.ceil(usd / USD_PER_POINT);

/* ═══════════════════════════════════════════════════════════
   إعدادات النقاط — تُعدَّل من لوحة الإدارة (`settings/points`)
   ═══════════════════════════════════════════════════════════ */

export type PointsSettings = {
  /** يعمل النظام أصلاً؟ إطفاؤه يُخفي النقاط من الموقع كلّه */
  on: boolean;
  /** نقاط أي صنف لم تُحدَّد له قيمة — فلا تملئين خمسين باقة يدوياً */
  perItem: number;
  /** أقلّ رصيد يُسمح باستعماله خصماً */
  minRedeem: number;
  /**
   * لا تظهر **قيمة** النقاط للزبون حتى تبلغ هذا المبلغ بالدولار.
   * السبب: «٣ نقاط = ٠٫٠٣ دولار» رقمٌ يُصغّر الهديّة في عين الزبون،
   * فنُريه العدد وحده حتى يصير للقيمة معنى.
   */
  showFrom: number;
  /** يبيع المتجر نقاطاً؟ */
  sell: boolean;
  /** أقلّ شراء بالنقاط — ٢٥ نقطة = ٠٫٢٥ دولار */
  minBuy: number;
  /** اسم البرنامج كما يراه الزبون */
  brand: string;
  /** شعاره — مسار في `public/` أو رابط مرفوع من اللوحة */
  logo: string;
};

export const DEFAULT_POINTS: PointsSettings = {
  on: true,
  perItem: 0,
  minRedeem: 100,
  showFrom: 0.15,
  sell: true,
  minBuy: 25,
  brand: POINTS_BRAND,
  logo: POINTS_ICON,
};

/**
 * ⚠️ لا يرمي خطأً أبداً: تعذّر القراءة ⇒ الإعدادات الافتراضية.
 * صفحة الزبون يجب ألّا تنكسر لأن وثيقة إعدادات غائبة.
 */
export async function readPointsSettings(): Promise<PointsSettings> {
  const db = fbDb();
  if (!db) return DEFAULT_POINTS;
  try {
    const snap = await withTimeout(getDoc(doc(db, "settings", "points")));
    const v = (snap.exists() ? snap.data() : {}) as Partial<PointsSettings>;
    return {
      on: typeof v.on === "boolean" ? v.on : DEFAULT_POINTS.on,
      perItem: Number(v.perItem) || DEFAULT_POINTS.perItem,
      minRedeem: Number(v.minRedeem) || DEFAULT_POINTS.minRedeem,
      showFrom:
        v.showFrom === undefined ? DEFAULT_POINTS.showFrom : Number(v.showFrom) || 0,
      sell: typeof v.sell === "boolean" ? v.sell : DEFAULT_POINTS.sell,
      minBuy: Number(v.minBuy) || DEFAULT_POINTS.minBuy,
      brand: (v.brand ?? "").trim() || DEFAULT_POINTS.brand,
      logo: (v.logo ?? "").trim() || DEFAULT_POINTS.logo,
    };
  } catch {
    return DEFAULT_POINTS;
  }
}

/* ═══════════════════════════════════════════════════════════
   كم نقطة يستحقّ هذا الطلب؟
   ═══════════════════════════════════════════════════════════ */

/** آيدي الصنف ⇐ نقاطه. مصدره تعديلات الإدارة، فلا يُلمس `lib/data.ts` */
export type PointsMap = Record<string, number>;

export async function readPointsMap(): Promise<PointsMap> {
  const [packs, prods] = await Promise.all([readPackages(), readProducts()]);
  const out: PointsMap = {};
  for (const [id, v] of Object.entries({ ...packs, ...prods })) {
    const p = Math.round(Number((v as { points?: number }).points));
    if (Number.isFinite(p) && p > 0) out[id] = p;
  }
  return out;
}

/**
 * ⚠️ **تُحسَب هنا لا في متصفّح الزبون.**
 * لو أرسل الزبون عدد النقاط مع طلبه لكتب ما شاء. هذه الدالة تعمل في
 * لوحة الإدارة وقت التأكيد، وتقرأ القيم من مصدرها الموثوق.
 */
export function orderPoints(
  items: { id: string; qty?: number }[],
  map: PointsMap,
  fallback: number,
): number {
  return items.reduce(
    (sum, it) => sum + (map[it.id] ?? fallback) * Math.max(1, it.qty ?? 1),
    0,
  );
}

/* ═══════════════════════════════════════════════════════════
   قراءة رصيد الزبون وسجلّه
   ═══════════════════════════════════════════════════════════ */

export type LedgerRow = {
  id: string;
  /** موجب = مُنحت · سالب = خُصمت */
  delta: number;
  /** `order` عند التأكيد · `cancel` عند الإلغاء · `manual` بيد الإدارة */
  reason: string;
  /** رمز الطلب المرتبط، إن وُجد */
  code: string;
  at: Date | null;
};

export async function myPoints(user: User | null): Promise<number> {
  const db = fbDb();
  if (!db || !user) return 0;
  const snap = await withTimeout(getDoc(doc(db, "users", user.uid)));
  return Number(snap.data()?.points) || 0;
}

/**
 * آخر الحركات. ترتيبٌ بحقل واحد بلا `where` — تكفيه الفهارس التلقائية،
 * فلا نحتاج إنشاء فهرس مركّب يدوياً (درسُ صفحة "طلباتي").
 */
export async function myLedger(
  user: User | null,
  n = 20,
): Promise<LedgerRow[]> {
  const db = fbDb();
  if (!db || !user) return [];
  const snap = await withTimeout(
    getDocs(
      query(
        collection(db, "users", user.uid, "ledger"),
        orderBy("at", "desc"),
        fbLimit(n),
      ),
    ),
  );
  return snap.docs.map((d) => {
    const v = d.data();
    return {
      id: d.id,
      delta: Number(v.delta) || 0,
      reason: String(v.reason ?? ""),
      code: String(v.code ?? ""),
      at: v.at?.toDate?.() ?? null,
    };
  });
}

/* ═══════════════════════════════════════════════════════════
   شراء النقاط
   ═══════════════════════════════════════════════════════════ */

/**
 * طلبُ شراء نقاط — يمرّ **بنفس مسار أي طلب**: يُنشأ `pending`، وتؤكّدينه
 * من اللوحة، فتُضاف النقاط. لا مسار جانبيّ ولا رصيد يزيد بلا مراجعتك.
 *
 * ⚠️ والنقاط المشتراة **لا تربح نقاطاً فوقها** — وإلا اشترى الزبون
 *    نقاطاً بنقاطٍ فصار الرصيد يولّد نفسه.
 */
export async function buyPointsOrder(
  user: User | null,
  points: number,
): Promise<{ ok: true; code: string } | { ok: false }> {
  const n = Math.round(points);
  const db = fbDb();
  if (!db || !user || !Number.isFinite(n) || n <= 0) return { ok: false };

  const total = Math.round(n * USD_PER_POINT * 100) / 100;
  const code = `PT-${Date.now().toString(36).toUpperCase()}`;

  try {
    const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
    await addDoc(collection(db, "orders"), {
      code,
      kind: "points",
      items: [{ id: "points", title: `${n} points`, qty: 1, price: total }],
      total,
      buyPoints: n,
      payMethod: "",
      account: "",
      uid: user.uid,
      email: user.email ?? "",
      name: user.displayName ?? "",
      status: "pending",
      createdAt: serverTimestamp(),
    });
    return { ok: true, code };
  } catch {
    return { ok: false };
  }
}
