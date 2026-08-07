import { NextResponse } from "next/server";
import { stampAdmin } from "@/lib/adminStamp";
import { open, signReady } from "@/lib/signed";

/**
 * 🔄 **تجديدُ الخَتْم وهي داخل اللوحة** — الخَتْم ساعةٌ واحدة (قرارها
 * ٠٧-٠٨)، واللوحة تنادي هذا الباب كل عشرين دقيقة فلا ينتهي تحت يدها.
 *
 * **ومفتاحُ التجديد ورقةُ الجهاز** لا كلمةُ السرّ:
 *
 * | من يملكها | ماذا يستطيع |
 * |---|---|
 * | صاحبةُ الجهاز الذي كُتب فيه الرمز | يجدّد بصمت — فلا رمزَ كل ساعة |
 * | من عرف كلمة السرّ ولا ورقة له | **لا شيء** — يُطلب منه الرمز، والرمز إلى بريدها |
 *
 * فلو كانت كلمةُ السرّ تكفي للتجديد لَجدّد المهاجمُ لنفسه، وعاد البابُ
 * إلى ما كان. والورقة موقّعةٌ بسرّ الخادم — لا تُصنع ولا تُبدَّل.
 *
 * ⚠️ **و`o` هي الحارس**: الورقة تُعطى للمساعد أيضاً بعد رمزه، والمساعد
 *    ليس أدمناً. فلولا هذه العلامة لَختم مساعدٌ نفسَه في `admins`
 *    وصنع لنفسه وثيقةً هناك. والقواعد تمنع الإنشاء كذلك — حارسان.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!signReady) return NextResponse.json({ ok: false, reason: "off" });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const paper = open<{ x: number; u?: string; o?: number }>(
    String(body.dev ?? "").slice(0, 600),
  );
  /* ورقةٌ مزوّرة أو منتهية أو لمساعدٍ لا لأدمن ⇒ لا تجديد، ولا تفصيل */
  if (!paper?.u || !paper.o) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: await stampAdmin(paper.u) });
}
