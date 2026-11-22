import { uploadProductImages } from "../../../shared/api/media";
import { demo } from "../../../shared/api/admin";
export async function optimizeUpload(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Escolha uma foto JPEG, PNG ou WebP.");
  if (file.size > 15 * 1024 * 1024)
    throw new Error("A foto deve ter até 15 MB.");
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  if (bitmap.width * bitmap.height > 40_000_000) {
    bitmap.close();
    throw new Error("A foto deve ter até 40 megapixels.");
  }
  async function resize(size: number, type = "image/webp") {
    const ratio = Math.min(1, size / Math.max(bitmap.width, bitmap.height)),
      canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("Seu navegador não conseguiu processar esta foto.");
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob && blob.type === type
            ? resolve(blob)
            : reject(
                new Error(
                  "Seu navegador não suporta esta conversão. Use uma versão atual do Chrome, Safari ou Firefox.",
                ),
              ),
        type,
        0.82,
      ),
    );
  }
  try {
    if (demo) {
      const blob = await resize(640);
      if (blob.size > 280_000)
        throw new Error("Use uma foto menor para a demonstração local.");
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Falha ao ler foto."));
        reader.readAsDataURL(blob);
      });
    }
    const images: { name: string; blob: Blob }[] = [];
    for (const size of [320, 640, 1280])
      images.push({ name: `${size}.webp`, blob: await resize(size) });
    images.push({ name: "fallback.jpg", blob: await resize(1280, "image/jpeg") });
    return await uploadProductImages(images);
  } finally {
    bitmap.close();
  }
}
