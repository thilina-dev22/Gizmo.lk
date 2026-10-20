// Bank slips are sent inline with the order as data URLs, so they must stay well below
// the API's request size limit (Vercel functions accept ~4.5MB bodies).
const MAX_RAW_SLIP_BYTES = 2.5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];

export interface PreparedSlip {
  dataUrl: string;
  isPdf: boolean;
  fileName: string;
  sizeLabel: string;
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unsupported image"));
    image.src = src;
  });
}

async function compressImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    // White background so transparent screenshots stay readable as JPEG
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Validates and shrinks a bank slip so it can be attached to the order request. */
export async function prepareBankSlip(file: File): Promise<PreparedSlip> {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

  if (isPdf) {
    if (file.size > MAX_RAW_SLIP_BYTES) {
      throw new Error("This PDF is larger than 2.5MB. Please upload a screenshot (JPG/PNG) of the slip instead.");
    }
    const dataUrl = await readAsDataUrl(file);
    return {
      dataUrl: dataUrl.replace(/^data:[^;]*;/, "data:application/pdf;"),
      isPdf: true,
      fileName: file.name,
      sizeLabel: formatBytes(file.size),
    };
  }

  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("Please upload a JPG, PNG or PDF of your bank deposit slip.");
  }

  try {
    const dataUrl = await compressImage(file);
    return { dataUrl, isPdf: false, fileName: file.name, sizeLabel: formatBytes(Math.round((dataUrl.length * 3) / 4)) };
  } catch {
    // Browsers that can't decode the format (e.g. HEIC outside Safari) — send the original if small enough
    if (ACCEPTED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_RAW_SLIP_BYTES) {
      return { dataUrl: await readAsDataUrl(file), isPdf: false, fileName: file.name, sizeLabel: formatBytes(file.size) };
    }
    throw new Error("We couldn't read this image. Please upload a JPG or PNG screenshot of your slip.");
  }
}
