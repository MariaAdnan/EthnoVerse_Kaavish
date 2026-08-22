export type UploadKind = "audio" | "image" | "document" | "3d-tour";

const FILE_RULES: Record<
  UploadKind,
  { maxBytes: number; mimeTypes: string[]; extensions: string[]; label: string }
> = {
  image: {
    maxBytes: 20 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    label: "JPG, PNG, or WebP image",
  },
  audio: {
    maxBytes: 100 * 1024 * 1024,
    mimeTypes: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/ogg"],
    extensions: [".mp3", ".m4a", ".wav", ".ogg"],
    label: "MP3, M4A, WAV, or OGG audio",
  },
  document: {
    maxBytes: 50 * 1024 * 1024,
    mimeTypes: ["application/pdf"],
    extensions: [".pdf"],
    label: "PDF document",
  },
  "3d-tour": {
    maxBytes: 250 * 1024 * 1024,
    mimeTypes: ["application/zip", "application/x-zip-compressed"],
    extensions: [".zip"],
    label: "ZIP archive",
  },
};

export function validateUploadFile(file: File, kind: UploadKind) {
  const rule = FILE_RULES[kind];
  const extension = `.${file.name.split(".").pop()?.toLocaleLowerCase() ?? ""}`;
  const extensionMatches = rule.extensions.includes(extension);
  const typeMatches = !file.type || rule.mimeTypes.includes(file.type);
  if (!extensionMatches || !typeMatches) {
    throw new Error(`Choose a ${rule.label}.`);
  }
  if (file.size === 0) throw new Error("The selected file is empty.");
  if (file.size > rule.maxBytes) {
    throw new Error(
      `${rule.label} must be smaller than ${Math.round(rule.maxBytes / 1024 / 1024)} MB.`,
    );
  }
  return file;
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  return signature.every((value, index) => bytes[offset + index] === value);
}

export function matchesUploadSignature(bytes: Uint8Array, kind: UploadKind) {
  if (kind === "image") {
    return (
      startsWith(bytes, [0xff, 0xd8, 0xff]) ||
      startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) ||
      (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8))
    );
  }
  if (kind === "document") return startsWith(bytes, [0x25, 0x50, 0x44, 0x46]);
  if (kind === "3d-tour") {
    return (
      startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
      startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
      startsWith(bytes, [0x50, 0x4b, 0x07, 0x08])
    );
  }
  return (
    startsWith(bytes, [0x49, 0x44, 0x33]) ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) ||
    (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
      startsWith(bytes, [0x57, 0x41, 0x56, 0x45], 8)) ||
    startsWith(bytes, [0x4f, 0x67, 0x67, 0x53]) ||
    startsWith(bytes, [0x66, 0x74, 0x79, 0x70], 4)
  );
}

export async function validateUploadFileContents(file: File, kind: UploadKind) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!matchesUploadSignature(bytes, kind)) {
    throw new Error("The file contents do not match the selected media type.");
  }
  return file;
}

export async function resizeImage(
  file: File,
  maxLongEdge = 1920,
  quality = 0.9,
) {
  validateUploadFile(file, "image");
  const bitmap = await createImageBitmap(file);
  const longEdge = Math.max(bitmap.width, bitmap.height);
  if (longEdge <= maxLongEdge) {
    bitmap.close();
    return file;
  }

  const scale = maxLongEdge / longEdge;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("This browser cannot resize images.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Image resizing failed."));
      },
      outputType,
      quality,
    );
  });
  const stem = file.name.replace(/\.[^.]+$/, "");
  const extension = outputType === "image/png" ? "png" : "jpg";
  return new File([blob], `${stem}-${maxLongEdge}px.${extension}`, {
    type: outputType,
    lastModified: file.lastModified,
  });
}

export async function downloadRemoteFile(url: string, filename: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}.`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}
