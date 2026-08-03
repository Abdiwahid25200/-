/**
 * ماذا سيحدث لو ضغطتِ هذا الزرّ؟ — **نصّ التأكيد، بمصدرٍ واحد**.
 *
 * ⚠️ **أُخرج من `OrdersEditor` إلى هنا** حين وُلدت شاشة الطابور
 *    (`OrderQueue`): شاشتان تغيّران حالة الطلب، ونصُّ التحذير نفسه في
 *    موضعين يعني موضعاً واحداً يُنسى — فتقول إحداهما «تُخصم ١٢٠ نقطة»
 *    وتصمت الأخرى. وهذا بالضبط ما وقع من قبل مع «١٥ ساعة».
 */

import { doneLabel } from "@/lib/deliver";
import type { AdminOrder, OrderStatus } from "@/lib/adminOrders";
import type { PointsSettings } from "@/lib/points";

export type Plan = { to: OrderStatus; title: string; note: string; yes: string };

/**
 * السؤال قبل التنفيذ — و**يقول ماذا سيحدث** لا «هل أنتِ متأكّدة» وحدها.
 *
 * ⚠️ «Are you sure?» سؤالٌ لا يُقرأ: من ضغط زرّاً يظنّ نفسه متأكّداً
 *    فيضغط «نعم» بلا نظر. أمّا «سيُخصم من رصيده ١٢٠ نقطة» فرقمٌ يوقف
 *    الإبهام — وهو الفرق بين تحذيرٍ يعمل وتحذيرٍ يُتجاوَز.
 */
export function planOf(
  o: AdminOrder,
  to: OrderStatus,
  due: number,
  settings: PointsSettings,
  unsettled: boolean,
  /** ما خُصم فعلاً من السجلّ حين لا يحمله الطلب */
  owedBack = 0,
): Plan | null {
  const spent = (Number(o.pointsSpent) || 0) || owedBack;
  const awarded = Number(o.pointsAwarded) || 0;
  const buying = Number(o.buyPoints) || 0;

  if (to === "paid") {
    const earn = buying > 0 ? buying : due;
    const parts: string[] = ["The money is in your hands."];
    if (settings.on && earn > 0) parts.push(`The customer gains ${earn} points.`);
    if (Number(o.usePoints) > 0)
      parts.push(`And ${o.usePoints} points come off their balance.`);
    return {
      to,
      title: `Mark this order paid?`,
      note: parts.join(" "),
      yes: "Yes, mark paid",
    };
  }

  if (to === "done") {
    const w = doneLabel(o.kind).toLowerCase();
    return {
      to,
      title: `Confirm you ${w} this order?`,
      note:
        o.status === "pending"
          ? "It has not been marked paid yet — check the money arrived first."
          : "The customer sees it finished, and it leaves your list.",
      yes: `Yes, ${w}`,
    };
  }

  if (to === "cancelled") {
    if (unsettled)
      return {
        to,
        title: `Return ${spent} points to the customer?`,
        note:
          awarded > 0
            ? `${spent} points go back to their balance, and ${awarded} given for this order are taken off.`
            : `${spent} points were taken for this order and never returned. This puts them back.`,
        yes: `Yes, return ${spent} points`,
      };

    const parts: string[] = ["The customer sees it rejected."];
    if (awarded > 0) parts.push(`${awarded} points are taken back.`);
    if (spent > 0) parts.push(`${spent} points return to their balance.`);
    parts.push("Only the store owner can undo this.");
    return {
      to,
      title: "Reject this order?",
      note: parts.join(" "),
      yes: "Yes, reject it",
    };
  }
  return null;
}
