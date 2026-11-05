import { getSessionUser } from "@/server/auth/session";
import { detectExtension, MAX_PHOTO_BYTES, newPhotoKey, savePhoto } from "@/server/integrations/photo-storage";

// The file is stored first; the report or message claims the returned key when it is sent.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response(null, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_PHOTO_BYTES) {
    return new Response(null, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = detectExtension(bytes);
  if (!extension) return new Response(null, { status: 415 });

  const key = newPhotoKey(user.id, extension);
  await savePhoto(key, bytes);
  return Response.json({ key });
}
