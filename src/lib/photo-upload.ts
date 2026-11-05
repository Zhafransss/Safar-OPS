export type PendingPhoto = { file: File; url: string };

export const PHOTO_ERROR = "Foto tidak bisa diproses. Coba foto lain.";

// K-T43. useWebWorker stays off because the library's worker loads a script from a public CDN.
export async function preparePhoto(file: File): Promise<PendingPhoto> {
  const { default: imageCompression } = await import("browser-image-compression");
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    fileType: "image/jpeg",
    useWebWorker: false,
  });
  return { file: compressed, url: URL.createObjectURL(compressed) };
}

export async function uploadPhotos(photos: readonly PendingPhoto[]): Promise<string[]> {
  return Promise.all(
    photos.map(async ({ file }) => {
      const body = new FormData();
      body.append("file", file, "foto.jpg");
      const response = await fetch("/api/photos", { method: "POST", body });
      if (!response.ok) throw new Error(PHOTO_ERROR);
      const { key } = (await response.json()) as { key: string };
      return key;
    }),
  );
}
