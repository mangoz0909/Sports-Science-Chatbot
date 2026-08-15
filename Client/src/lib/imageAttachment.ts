/**
 * Turns a user-picked image file into a compact base64 data URL suitable for
 * sending inline in the ai-chat JSON body.
 *
 * Everything is downscaled and re-encoded as JPEG in the browser before it
 * leaves the page. That matters for two reasons: Supabase edge functions
 * reject large request bodies, and every extra pixel is billed as input
 * tokens by the vision model. A 1024px JPEG is plenty for the things people
 * actually photograph here — meals, nutrition labels, gym equipment, a
 * training plan on paper — while keeping the payload a few hundred KB.
 */

/** Types we accept from the file picker. Everything is re-encoded to JPEG. */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const ACCEPTED_IMAGE_ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(",");

/** Rejected before decoding — a guard against someone picking a 100MB RAW file. */
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

/** Longest edge of the re-encoded image, in pixels. */
const MAX_DIMENSION = 1024;

/**
 * Quality ladder. The first encode that fits the payload budget wins, so a
 * simple photo stays sharp and only a stubbornly large one gets squeezed.
 */
const QUALITY_LADDER = [0.8, 0.65, 0.5, 0.38];

/**
 * Hard ceiling on the data URL we will send. Must stay comfortably under the
 * limit enforced by the edge function (MAX_IMAGE_DATA_URL_LENGTH there).
 */
const MAX_DATA_URL_LENGTH = 1_400_000;

export type ImageAttachment = {
  /** `data:image/jpeg;base64,...` — sent to the function and used as the preview src. */
  dataUrl: string;
  /** Original filename, shown in the composer chip. */
  name: string;
  /** Approximate encoded size in bytes, for the composer chip. */
  bytes: number;
};

export class ImageAttachmentError extends Error {}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap handles EXIF orientation and avoids a DOM round-trip,
  // but Safari only grew `imageOrientation` support recently, so fall back to
  // an <img> when it is missing or throws on this file.
  if (typeof createImageBitmap === "function") {
    try {
      // "from-image" applies the EXIF orientation, so a photo taken sideways
      // on a phone is not sent to the model rotated. It postdates this
      // project's TS DOM lib, which still types the field as "none" | "flipY".
      const options = {
        imageOrientation: "from-image",
      } as unknown as ImageBitmapOptions;

      return await createImageBitmap(file, options);
    } catch {
      // fall through
    }
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new ImageAttachmentError("That file could not be read as an image."));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Bytes represented by a base64 data URL, without allocating the buffer. */
function base64Bytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

export async function prepareImageAttachment(file: File): Promise<ImageAttachment> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new ImageAttachmentError("Please choose a JPEG, PNG, or WebP image.");
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageAttachmentError("That image is too large. Please choose one under 20MB.");
  }

  const source = await decode(file);

  const sourceWidth = "width" in source ? source.width : 0;
  const sourceHeight = "height" in source ? source.height : 0;

  if (!sourceWidth || !sourceHeight) {
    throw new ImageAttachmentError("That image appears to be empty or corrupted.");
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new ImageAttachmentError("This browser could not process the image.");
  }

  // JPEG has no alpha channel, so a transparent PNG would otherwise composite
  // onto black and lose anything drawn in dark ink.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source as CanvasImageSource, 0, 0, width, height);

  if ("close" in source) source.close();

  let dataUrl = "";

  for (const quality of QUALITY_LADDER) {
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_DATA_URL_LENGTH) break;
  }

  if (!dataUrl.startsWith("data:image/jpeg;base64,")) {
    throw new ImageAttachmentError("This browser could not encode the image.");
  }

  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    throw new ImageAttachmentError(
      "That image is too detailed to send. Please try a smaller or simpler one."
    );
  }

  return { dataUrl, name: file.name || "image.jpg", bytes: base64Bytes(dataUrl) };
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
