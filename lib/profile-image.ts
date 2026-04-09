import { supabase } from "@/lib/supabase";

const PROFILE_IMAGES_BUCKET = "profile-images";

function getFileExtension(uri: string) {
  const cleanUri = uri.split("?")[0] || uri;
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() || "jpg";
}

function getContentType(extension: string) {
  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    default:
      return "image/jpeg";
  }
}

export async function uploadProfileImage(userId: string, uri: string) {
  const extension = getFileExtension(uri);
  const contentType = getContentType(extension);
  const path = `${userId}/avatar.${extension}`;
  const response = await fetch(uri);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: blob.type || contentType,
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
