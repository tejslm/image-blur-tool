import type { LoadedImage } from "./types";

export const ACCEPTED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const ACCEPTED_EXT = /\.(png|jpe?g|webp)$/i;
const MAX_DIMENSION = 12000;
const MAX_PIXELS = 36_000_000;

export interface ImageErrorInfo {
  message: string;
  kind: "unsupported" | "too-large" | "corrupt";
}

function hasAllowedExtension(name: string): boolean {
  return ACCEPTED_EXT.test(name);
}

/**
 * Provide a friendly message for a file that isn't an accepted image type.
 * Returns null when the file looks like an image we can try to decode.
 */
export function checkFileAccepted(file: File): ImageErrorInfo | null {
  const mimeAccepted = ACCEPTED_MIME.has(file.type);
  if (mimeAccepted) return null;
  return {
    message: "This image format isn't supported. Try PNG, JPG, or WebP.",
    kind: "unsupported",
  };
}

function checkDimensions(width: number, height: number): ImageErrorInfo | null {
  const pixels = width * height;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION || pixels > MAX_PIXELS) {
    return {
      message: "This image is too large to process safely. Try a smaller version.",
      kind: "too-large",
    };
  }
  return null;
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  const rejectedByMime = checkFileAccepted(file);
  const mimeRejects = rejectedByMime !== null;
  const nameLooksLikeImage = file.name !== "" && hasAllowedExtension(file.name);

  if (mimeRejects && !nameLooksLikeImage) {
    throw rejectedByMime;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw { message: "That image couldn't be opened. Try another file.", kind: "corrupt" } satisfies ImageErrorInfo;
  }

  const tooLarge = checkDimensions(bitmap.width, bitmap.height);
  if (tooLarge) {
    bitmap.close();
    throw tooLarge;
  }

  const name = nameLooksLikeImage || file.name !== "" ? file.name : null;
  return { bitmap, name, width: bitmap.width, height: bitmap.height };
}

export function loadImageFromBitmap(bitmap: ImageBitmap, name: string | null): LoadedImage {
  return { bitmap, name, width: bitmap.width, height: bitmap.height };
}