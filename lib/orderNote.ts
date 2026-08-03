/**
 * نصّ الطلب كما يصل صاحبة المتجر — في الخطّاف وفي بريد التأخير معاً.
 *
 * ⚠️ **ولهذا مُلفٌّ مستقلّ**: كان هذا كلّه محبوساً في `/api/notify-order`،
 *    ثم احتاجه بريدُ التأخير. **وقاعدةٌ في مكانين تعني مكاناً واحداً
 *    يُنسى** — كما وقع مع «١٥ ساعة» من قبل: قاعدةٌ في `OpenBar` وحدها،
 *    فصمت الشريط ونطقت البطاقة.
 *
 * والفكرة الحاكمة: **الرسالة تكفي لتنفيذ الطلب بلا فتح الموقع** — الرمز
 * والقسم والأصناف والمبلغ وبيانات التسليم، ورابط واتساب حيث يكون الرقم
 * رقم هاتفٍ حقاً.
 */

/** وسم القسم — سطرٌ واحد يقول أيّ عملٍ مطلوب */
export const KIND_LABEL: Record<string, string> = {
  pubg: "🎮 شدات ببجي",
  efootball: "⚽ كوينز eFootball",
  tiktok: "🎵 حساب تيك توك",
  accounts: "⚽ حساب eFootball",
  elec: "📦 إلكترونيات",
};

/**
 * الأقسام التي يكون الرقم فيها **رقم هاتف** لا آيدي لعبة.
 * في ببجي وeFootball الرقم آيدي حساب اللعبة — وبناء رابط واتساب منه
 * يفتح محادثة مع شخصٍ لا علاقة له بالطلب.
 */
export const PHONE_KINDS = new Set(["tiktok", "accounts", "elec"]);

/** أطول سلسلة أرقام في النص — رقم الزبون، فنبني منه رابط واتساب */
export function phoneIn(text: string): string {
  const runs = String(text ?? "").match(/\d[\d\s-]{6,}\d/g) ?? [];
  const best = runs
    .map((r) => r.replace(/\D/g, ""))
    .filter((d) => d.length >= 7 && d.length <= 15)
    .sort((a, b) => b.length - a.length)[0];
  return best ?? "";
}

export type NotePieces = {
  code: string;
  kind: string;
  items: string;
  total: string;
  account: string;
  buyer: string;
};

/** أسطر الطلب — بلا سطرِ العنوان، فلكلّ مُرسِلٍ عنوانُه */
export function orderLines(o: NotePieces): string[] {
  const phone = PHONE_KINDS.has(o.kind) ? phoneIn(o.account) : "";
  return [
    KIND_LABEL[o.kind] ?? "🛒 طلب",
    o.items,
    o.total && `💵 ${o.total}`,
    o.account && `📌 ${o.account}`,
    o.buyer && `👤 ${o.buyer}`,
    // رابط جاهز: ضغطة واحدة وتبدأ المحادثة مع صاحب الطلب
    phone && `💬 https://wa.me/${phone}`,
  ].filter(Boolean) as string[];
}
