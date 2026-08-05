/**
 * هل المتجر مفتوح الآن؟ — إغلاقٌ يدويّ أو خارج ساعات العمل.
 *
 * ⚠️ **الوقت يُحسب بتوقيت متجرك لا بتوقيت جهاز الزبون.**
 *    زبونٌ في لندن ساعتُه غير ساعتك؛ لو حسبنا بجهازه لفُتح المتجر
 *    وأُغلق في أوقاتٍ لا تعرفينها. فنأخذ التوقيت العالمي ونضيف إليه
 *    فارق بلدك (٣+ افتراضاً) — فالنتيجة واحدة لكل زبائن الأرض.
 *
 * 🔒 **قرارها (٠٣-٠٨): شكلان يحجبان الموقع وواحد يحجب الطلب وحده.**
 *    الستارة واللافتة ⇐ الزبون لا يرى المتجر أصلاً، واحدةٌ تملأ الشاشة.
 *    الطابور ⇐ الموقع يعمل كالمعتاد والطلب يصير حجزاً.
 *    والحجب **للإغلاق اليدويّ وحده** — لا لانتهاء الدوام: المتجر يُغلق
 *    كل ليلة، وحجبُه كل ليلة يعني موقعاً محجوباً نصف عمره أمام جوجل.
 *
 * ⚠️ **حسابٌ صافٍ بلا React ولا Firebase عمداً** — ولهذا فُصل عن
 *    `storeOpen.ts`: الحاجزُ يُرسَم على **الخادم** أوّلاً (وإلّا ظهر المتجر
 *    لحظةً ثم اختفى)، والخادم لا يستورد ملفاً فيه `useState`. فهنا
 *    الحساب، وهناك الخطّافات والقراءة من المتصفّح.
 */

import type { Multilang } from "./content";

/**
 * شكل صفحة الإغلاق — ثلاثة، تختار صاحبة المتجر واحداً:
 *
 * | | |
 * |---|---|
 * | `curtain` | ستارةٌ بلون العلامة وعدّادٌ تنازليّ — **تحجب الموقع كلّه** |
 * | `sign` | لافتةٌ ورقية على بابٍ زجاجيّ — **تحجب الموقع كلّه** |
 * | `queue` | المتجر يصير طابوراً: **يحجز** ويُنفَّذ أوّل ما تفتحين |
 *
 * ⚠️ و`queue` وحده **لا يمنع الطلب ولا يحجب شيئاً** — يحوّله إلى حجز.
 *    فلا تضيع طلبات الليل، وتفتحين صباحاً على طابورٍ جاهز لا على صفر.
 */
export type ClosedStyle = "curtain" | "sign" | "queue";

export type OpenSettings = {
  /** إغلاق يدويّ — للمعاينة والتحديث */
  closed: boolean;
  /** سطرٌ يشرح سبب الإغلاق (اختياري) */
  closedNote: Partial<Multilang>;
  /** شكل الصفحة التي يراها الزبون */
  style: ClosedStyle;
  /** عنوانٌ يكتبه صاحب المتجر — فارغٌ ⇒ نصّ الترجمة */
  closedTitle: Partial<Multilang>;
  /** وعنوانُ ونصُّ «انتهى الدوام» */
  hoursTitle: Partial<Multilang>;
  hoursNote: Partial<Multilang>;
  /** الشعار أو الصورة في وسط الصفحة — فارغةٌ ⇒ شعار المتجر */
  closedImage: string;
  /** رقم واتساب من نفس الوثيقة — فزرّ التواصل يعمل في صفحة الإغلاق */
  whatsapp: string;
  /** تطبيق ساعات العمل */
  hoursOn: boolean;
  /** `09:00` · `23:00` */
  openFrom: string;
  openTo: string;
  /** أيام العطلة: ٠ الأحد … ٦ السبت. الافتراضي: الجمعة */
  offDays: number[];
  /** فارق توقيت بلدك عن غرينتش */
  tzOffset: number;
  /**
   * 💰 **الضريبة أو الرسوم** — طلبها (٠٤-٠٨).
   *
   * رقمان يعملان معاً: نسبةٌ من المبلغ (`taxPct`) ومبلغٌ ثابت لكل طلب
   * (`taxFlat`). فراغهما معاً ⇒ **لا سطر ضريبةٍ أصلاً** ولا يتغيّر شيء.
   *
   * ⚠️ **ولماذا هما في وثيقة المتجر لا في كل صنف**: رقمٌ تكتبينه مرّةً
   *    خيرٌ من رقمٍ تكتبينه في مئة صنفٍ فتنسينه في واحد — والنسيان هنا
   *    خسارةٌ في كل طلبٍ من ذلك الصنف.
   * ⚠️ **وهما هنا لا في `SiteOverride`**: هذه الوثيقة تُقرأ على الخادم
   *    مرّةً وتُمرَّر لكل الشاشات (`StoreGate`)، فلا قراءةَ جديدة في
   *    تدفّق الشراء ولا رقمٌ يظهر متأخّراً بعد أن يقرأ الزبون المبلغ.
   */
  taxPct: number;
  taxFlat: number;
};

export const DEFAULT_OPEN: OpenSettings = {
  closed: false,
  closedNote: {},
  style: "curtain",
  closedTitle: {},
  hoursTitle: {},
  hoursNote: {},
  closedImage: "",
  whatsapp: "",
  hoursOn: false,
  openFrom: "09:00",
  openTo: "23:00",
  offDays: [5],
  tzOffset: 3,
  taxPct: 0,
  taxFlat: 0,
};

export type OpenState = {
  open: boolean;
  /** `closed` مُقفل بيدك · `day` يوم عطلة · `hours` خارج الدوام */
  reason: "closed" | "day" | "hours" | null;
  settings: OpenSettings;
};

const mins = (t: string) => {
  const [h, m] = (t || "0:0").split(":").map((x) => Number(x) || 0);
  return h * 60 + m;
};

/** يُحسب من الإعدادات وحدها — بلا شبكة، فيصلح للاختبار والعرض معاً */
export function openNow(s: OpenSettings, at = Date.now()): OpenState {
  if (s.closed) return { open: false, reason: "closed", settings: s };
  if (!s.hoursOn) return { open: true, reason: null, settings: s };

  const local = new Date(at + s.tzOffset * 3_600_000);
  if (s.offDays.includes(local.getUTCDay()))
    return { open: false, reason: "day", settings: s };

  const now = local.getUTCHours() * 60 + local.getUTCMinutes();
  const from = mins(s.openFrom);
  const to = mins(s.openTo);
  // دوامٌ يعبر منتصف الليل (٩م – ٢ص) يُحسب على شقّين
  const inside = from <= to ? now >= from && now < to : now >= from || now < to;

  return inside
    ? { open: true, reason: null, settings: s }
    : { open: false, reason: "hours", settings: s };
}

/**
 * وثيقةٌ خام ⇐ إعداداتٌ مضمونة الشكل.
 *
 * ⚠️ **مفصولةٌ عن القراءة عمداً**: تُنادى من المتصفّح (بحزمة Firebase)
 *    ومن الخادم (بقراءة REST في `storeOpenServer.ts`) — ولو كُتب التحقّق
 *    مرّتين لاختلف الطرفان يوماً ما، فيحجب أحدهما ولا يحجب الآخر.
 */
export function normalizeOpen(v: Partial<OpenSettings>): OpenSettings {
  return {
    closed: v.closed === true,
    closedNote: v.closedNote ?? {},
    style:
      v.style === "sign" || v.style === "queue" || v.style === "curtain"
        ? v.style
        : DEFAULT_OPEN.style,
    closedTitle: v.closedTitle ?? {},
    hoursTitle: v.hoursTitle ?? {},
    hoursNote: v.hoursNote ?? {},
    closedImage: (v.closedImage ?? "").trim(),
    whatsapp: (v.whatsapp ?? "").replace(/\D/g, ""),
    hoursOn: v.hoursOn === true,
    openFrom: v.openFrom || DEFAULT_OPEN.openFrom,
    openTo: v.openTo || DEFAULT_OPEN.openTo,
    offDays: Array.isArray(v.offDays) ? v.offDays : DEFAULT_OPEN.offDays,
    tzOffset: Number.isFinite(Number(v.tzOffset))
      ? Number(v.tzOffset)
      : DEFAULT_OPEN.tzOffset,
    /* ⚠️ **ولا سالب ولا فوق المئة**: حقلٌ مكتوبٌ بيدٍ واحدة على جوّال،
       و«-٥» أو «٥٠٠» يقلبان الفاتورة. يُقصّان هنا مرّةً فلا يمرّان. */
    taxPct: clampNum(v.taxPct, 0, 100),
    taxFlat: clampNum(v.taxFlat, 0, 10000),
  };
}

const clampNum = (v: unknown, lo: number, hi: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;
};

/**
 * 💰 **مبلغ الضريبة على مبلغٍ ما** — مصدرٌ واحد يقرؤه تدفّق الشراء
 *    والسلّة وشاشة الملخّص، فلا يختلف رقمان في شاشتين.
 *
 * ⚠️ **وتُحسب على المبلغ قبل خصم النقاط** — لأنها ضريبةٌ على قيمة ما
 *    اشتراه لا على ما تبقّى في جيبه. (وهذا ما تفعله المتاجر كلّها.)
 * ⚠️ **وتُقرَّب إلى سنتين** فلا يظهر `$0.30000000000000004` في فاتورة.
 */
export const taxOn = (amount: number, s: Pick<OpenSettings, "taxPct" | "taxFlat">) => {
  const base = Number(amount) || 0;
  if (base <= 0) return 0;
  const pct = (base * (Number(s.taxPct) || 0)) / 100;
  const flat = Number(s.taxFlat) || 0;
  return Math.round((pct + flat) * 100) / 100;
};

/**
 * هل يستطيع الزبون إرسال طلبٍ الآن؟
 *
 * مفتوح ⇒ نعم. مغلقٌ بنمط **الطابور** ⇒ نعم، لكنه **حجز** يُنفَّذ عند
 * الفتح. وما عدا ذلك ⇒ لا.
 */
export const canOrderNow = (st: OpenState) =>
  st.open || st.settings.style === "queue";

/**
 * هل يُحجب الموقع كلّه الآن؟ — **الشرطان معاً**:
 * ① أغلقتِه بيدك (لا انتهاءُ دوام) ② والشكل ستارةٌ أو لافتة.
 *
 * ⚠️ ولماذا الإغلاق اليدويّ وحده: انتهاء الدوام يقع كل ليلة، وحجبُ
 *    الموقع كل ليلة يجعل جوجل يزوره فيجد ستارةً — فيهبط ترتيبه.
 *    أمّا الإغلاق بيدكِ فقرارٌ لحظيّ تعرفين مدّته.
 */
export const blocksSite = (st: OpenState) =>
  !st.open && st.reason === "closed" && st.settings.style !== "queue";

/** هذا الطلب حجزٌ لا طلبٌ فوريّ؟ */
export const isReservation = (st: OpenState) =>
  !st.open && st.settings.style === "queue";

/** متى نفتح؟ نصٌّ قصير: «09:00» — أو غداً إن كان اليوم عطلة */
export function opensAt(s: OpenSettings): string {
  return s.openFrom || "09:00";
}

/** كم بقي على الفتح — بالدقائق. صفرٌ إن كان الحساب غير ممكن */
export function minutesToOpen(s: OpenSettings, at = Date.now()): number {
  if (!s.hoursOn) return 0;
  const local = new Date(at + s.tzOffset * 3_600_000);
  const now = local.getUTCHours() * 60 + local.getUTCMinutes();
  const from = mins(s.openFrom);
  const left = from - now;
  return left > 0 ? left : left + 24 * 60;
}
