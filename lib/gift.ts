/**
 * 🎁 **اطلب من صديق** — بابٌ ثانٍ للاعب الذي معه الرغبة وليس معه دفع.
 *
 * أكثر لاعبي ببجي صغار: عنده الآيدي ويعرف باقته، ولا EVC عنده ولا بطاقة.
 * فيصل إلى الدفع… ويخرج. فبدل أن نخسره صامتاً، يرسل طلبه لأخيه الكبير
 * أو صاحبه ليدفعه عنه — والشدّات تصل على آيديه هو.
 *
 * ─────────────────────────────────────────────────────────────
 * ⚠️ **لماذا الرابط يحمل الطلب، ولا وثيقة في قاعدة البيانات؟**
 *
 * جرّبتُ الوجهين. الوثيقة تعني مجموعةً جديدة **يقرأها كل غريب** — أي
 * قواعد جديدة تُنشر، وباب إنشاءٍ مفتوحٍ بلا تسجيل يُملأ بالنفايات في
 * أسبوع. والرابط لا يحتاج شيئاً من ذلك:
 *
 *   · لا قواعد تُنشر — يعمل اليوم
 *   · لا بابَ كتابةٍ مفتوحاً — فلا شيء يُفسَد
 *   · يعمل والزبون **غير مسجّل** — وهذا حال أكثر من نحتاجه
 *   · **والسعر يُقرأ حيّاً عند الفتح لا يُنسخ في الرابط**: لو غيّرتِ سعر
 *     الباقة أو أغلقتِها، رأى الدافعُ الحقيقةَ لا رقماً محفوظاً من أمس
 *
 * فالرابط **بطاقةُ تعريفٍ بالطلب** لا الطلب نفسه: القسم والباقة والآيدي
 * واسمُ الطالب. ومن فتحه دخل تدفّق الشراء المعتاد مملوءاً — بلا سطر
 * دفعٍ جديد يُكتب، ولا شاشةٍ تُصان مرّتين.
 *
 * 🔒 **ولا يحمل ما يضرّ لو قُرئ**: لا بريد ولا هاتف ولا رمز طلب.
 *    آيدي اللعبة وحده — وهو ذاهبٌ على واتساب أصلاً.
 */

/** ما يكفي لبناء الطلب عند الطرف الآخر */
export type Gift = {
  /** القسم: pubg · efootball … */
  kind: string;
  /** معرّف الباقة — السعر يُقرأ منه حيّاً */
  item: string;
  /** آيدي اللعبة أو الحساب */
  account: string;
  /** اسم الطالب كما كتبه — للعنوان وحده، ويجوز أن يكون فارغاً */
  from: string;
};

/** أطولُ ما يُقبل من كل حقل — رابطٌ منتفخ لا يُفتح على واتساب */
const MAX = { kind: 24, item: 40, account: 60, from: 24 } as const;

const trim = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

/** المسار وحده — تسبقه اللغة عبر `Link` */
export const GIFT_PATH = "/gift";

/** بناء الرابط: `/gift?k=pubg&i=u2&a=5123456789&n=Yuusuf` */
export function giftQuery(g: Gift): string {
  const q = new URLSearchParams();
  q.set("k", trim(g.kind, MAX.kind));
  q.set("i", trim(g.item, MAX.item));
  if (g.account) q.set("a", trim(g.account, MAX.account));
  if (g.from) q.set("n", trim(g.from, MAX.from));
  return `${GIFT_PATH}?${q.toString()}`;
}

/**
 * قراءة الرابط.
 *
 * ⚠️ **ويرجع `null` عند أي نقص**: رابطٌ مقصوصٌ بالنسخ لا يُفتح على
 *    شاشةٍ نصفِ فارغة — يُعرض عذرٌ صريح ويُدَلّ على المتجر.
 */
export function readGift(p: URLSearchParams | Record<string, string | undefined>): Gift | null {
  const get = (k: string) =>
    p instanceof URLSearchParams ? (p.get(k) ?? "") : (p[k] ?? "");

  const kind = trim(get("k"), MAX.kind);
  const item = trim(get("i"), MAX.item);
  if (!kind || !item) return null;

  return {
    kind,
    item,
    account: trim(get("a"), MAX.account),
    from: trim(get("n"), MAX.from),
  };
}

/**
 * إلى أين يذهب الدافع بعد أن يقبل؟ إلى صفحة القسم نفسها،
 * والباقة والآيدي محمولان معه — فلا يعيد اختيار ما اختير.
 */
export function buyHref(g: Gift): string {
  const q = new URLSearchParams({ pack: g.item });
  if (g.account) q.set("acct", g.account);
  if (g.from) q.set("for", g.from);
  q.set("gift", "1");
  return `${sectionPath(g.kind)}?${q.toString()}`;
}

/** مسار القسم — نفس جدول `lastOrder.pathOf`، ومكرَّرٌ هنا عمداً فلا يستورد ملفُّ منطقٍ ملفَّ متصفّح */
export function sectionPath(kind: string): string {
  const known: Record<string, string> = {
    pubg: "/pubg",
    efootball: "/efootball",
    tiktok: "/tiktok",
    accounts: "/efootball-accounts",
    elec: "/",
  };
  return known[kind] ?? `/s/${kind}`;
}

/**
 * رسالة واتساب الجاهزة.
 *
 * ⚠️ **الاسمُ أوّلاً والسعرُ آخراً**: من يفتح الرسالة يقرأ سطراً واحداً
 *    قبل أن يقرّر — فليكن «فلانٌ يريد كذا» لا رقماً بلا صاحب.
 */
export function giftMessage(lines: {
  head: string;
  detail: string;
  call: string;
  url: string;
}): string {
  return [lines.head, lines.detail, "", lines.call, lines.url].join("\n");
}
