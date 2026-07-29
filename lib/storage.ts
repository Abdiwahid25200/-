/**
 * رفع صور الموقع إلى Firebase Storage.
 *
 * ⚠️ درسٌ من الموقع القديم: كانت الصور تُحوَّل base64 وتُحشر داخل وثيقة
 *    Firestore، فتضرب حدّ المليون بايت ويتعطّل الحفظ. هنا الصورة **ملف**
 *    في Storage، وفي Firestore رابطها فقط.
 *
 * والرفع لا يقبله إلا الأدمن — الشرط في `storage.rules` لا في هذا الملف،
 * فلا ينفع تجاوزه من المتصفّح.
 */

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { fbStorage } from "./firebase";

/** ٥ ميجابايت — نفس الحدّ في `storage.rules` */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; reason: "off" | "type" | "size" | "error" };

/** اسم آمن: بلا مسافات ولا حروف تكسر الرابط، مع بصمة وقت تمنع التصادم */
function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = (dot > -1 ? name.slice(dot + 1) : "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "jpg"}`;
}

/**
 * يرفع صورة ويرجع رابطها الدائم.
 * `folder` يحدّد مكانها: `sections` · `packages` · `products` · `slides` · `pay`
 */
export async function uploadImage(
  file: File,
  folder: string,
): Promise<UploadResult> {
  const storage = fbStorage();
  if (!storage) return { ok: false, reason: "off" };
  if (!file.type.startsWith("image/")) return { ok: false, reason: "type" };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, reason: "size" };

  try {
    // كل الصور تحت products/ لأن قواعد Storage تسمح بالقراءة العامة هناك
    const path = `products/${folder}/${safeName(file.name)}`;
    const r = ref(storage, path);
    await uploadBytes(r, file, { contentType: file.type });
    return { ok: true, url: await getDownloadURL(r) };
  } catch {
    return { ok: false, reason: "error" };
  }
}
