import { supabase } from "./legacyAdapter";

export async function uploadProductImages(images: { name: string; blob: Blob }[]) {
  if (!supabase) throw new Error("Configure o servidor para enviar fotos.");
  const bucket = supabase.storage.from("menu-images");
  const folder = crypto.randomUUID(), paths: string[] = [];
  try {
    for (const image of images) {
      const path = `${folder}/${image.name}`;
      const { error } = await bucket.upload(path, image.blob, {
        contentType: image.blob.type, cacheControl: "31536000", upsert: false,
      });
      if (error) throw error;
      paths.push(path);
    }
    return bucket.getPublicUrl(`${folder}/640.webp`).data.publicUrl;
  } catch (error) {
    await bucket.remove(paths);
    throw error;
  }
}
