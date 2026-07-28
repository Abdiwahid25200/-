import { NextResponse } from "next/server";
import { pubgIdApi } from "@/lib/content";

/**
 * التحقق من آيدي لاعب ببجي.
 *
 * يعمل كوسيط بين المتصفح وخدمة التحقق الخارجية، وذلك:
 * ① يتجاوز قيود CORS لأن الطلب يخرج من السيرفر لا من المتصفح
 * ② يُبقي رابط الخدمة سرّياً — يُقرأ من PUBG_ID_API في إعدادات Vercel
 * ③ يوحّد شكل الرد مهما اختلف شكل رد الخدمة
 *
 * الردود:
 *   { ok: true,  name }      اسم اللاعب وُجد
 *   { ok: false, reason }    bad-id | not-found | manual | unavailable
 */
export async function GET(request: Request) {
  const id = (new URL(request.url).searchParams.get("id") ?? "").replace(/\D/g, "");

  if (id.length < 5) {
    return NextResponse.json({ ok: false, reason: "bad-id" }, { status: 400 });
  }

  // بلا رابط خدمة ⇒ وضع التحقق اليدوي، تماماً كالموقع القديم
  if (!pubgIdApi) {
    return NextResponse.json({ ok: false, reason: "manual" });
  }

  try {
    const url = pubgIdApi + (pubgIdApi.includes("?") ? "&" : "?") + "id=" + id;
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, reason: "unavailable" });
    }

    const data = await res.json();
    // نقبل عدة أشكال للرد لأن الخدمات تختلف بينها
    const name: string =
      data?.name || data?.data?.username || data?.username || data?.nickname || "";
    const good = (data?.ok === true || data?.status === true) && !!name;

    return NextResponse.json(
      good ? { ok: true, name } : { ok: false, reason: "not-found" },
    );
  } catch {
    // انقطاع أو مهلة ⇒ نكمل يدوياً بدل تعطيل الطلب على الزبون
    return NextResponse.json({ ok: false, reason: "manual" });
  }
}
