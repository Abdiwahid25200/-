/**
 * رفع صور لوحة الإدارة.
 *
 * الرفع يمرّ بخادم الموقع (`/api/upload`) لا بالمتصفّح مباشرة، ليبقى مفتاح
 * خدمة الصور سرّاً وليُتحقَّق أن الرافع أدمن قبل قبول أي ملف.
 * راجعي `app/api/upload/route.ts` للتفصيل.
 */

import { fbAuth } from "./firebase";

/** ٦ ميجابايت — نفس الحدّ في الخادم */
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; reason: "off" | "type" | "size" | "auth" | "error" };

export async function uploadImage(
  file: File,
  folder: string,
): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) return { ok: false, reason: "type" };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, reason: "size" };

  const auth = fbAuth();
  const user = auth?.currentUser;
  if (!user) return { ok: false, reason: "auth" };

  try {
    // رمز دخول طازج: المنتهي يُرفض عند جوجل فيفشل الرفع بلا سبب ظاهر
    const idToken = await user.getIdToken();

    const body = new FormData();
    body.append("file", file);
    body.append("folder", folder);
    body.append("idToken", idToken);

    const res = await fetch("/api/upload", { method: "POST", body });
    const d = await res.json().catch(() => null);

    if (res.ok && d?.ok && d.url) return { ok: true, url: d.url as string };

    const reason = d?.reason;
    if (reason === "off") return { ok: false, reason: "off" };
    if (reason === "auth") return { ok: false, reason: "auth" };
    if (reason === "size") return { ok: false, reason: "size" };
    if (reason === "type") return { ok: false, reason: "type" };
    return { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}
