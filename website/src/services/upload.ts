import { supabase } from "../lib/supabase";
import { withTimeout } from "../lib/async";

export type UploadKind =
  | "image"
  | "audio"
  | "document"
  | "3d-tour"
  | "tour-object";

export interface CloudinaryAsset {
  url: string;
  publicId: string;
  resourceType: "image" | "video" | "raw";
}

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: CloudinaryAsset["resourceType"];
}

const cloudinaryFunction =
  import.meta.env.VITE_CLOUDINARY_ADMIN_FUNCTION?.trim() || "cloudinary-admin";

export async function uploadToCloudinary(
  file: File,
  kind: Exclude<UploadKind, "3d-tour">,
) {
  return uploadWithResourceType(file, kind);
}

export async function uploadZipToCloudinary(file: File) {
  return uploadWithResourceType(file, "3d-tour");
}

async function uploadWithResourceType(
  file: File,
  kind: UploadKind,
): Promise<CloudinaryAsset> {
  const { data: signature, error: signatureError } = await withTimeout(
    supabase.functions.invoke<UploadSignature>(cloudinaryFunction, {
      body: { action: "sign-upload", kind },
    }),
    12_000,
    "Secure upload authorization timed out.",
  );
  if (signatureError || !signature) {
    throw new Error(
      "Secure upload authorization failed. Confirm that the cloudinary-admin Supabase function is deployed.",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5 * 60_000);
  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`,
      { method: "POST", body: formData, signal: controller.signal },
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Upload failed");
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type,
  };
}

export async function deleteCloudinaryAsset(asset: CloudinaryAsset) {
  const { data, error } = await withTimeout(
    supabase.functions.invoke(cloudinaryFunction, {
      body: {
        action: "delete",
        publicId: asset.publicId,
        resourceType: asset.resourceType,
      },
    }),
    12_000,
    "Uploaded file cleanup timed out.",
  );
  if (error || data?.result !== "ok") {
    throw new Error(
      "Uploaded file cleanup failed; an administrator should remove the orphaned asset.",
    );
  }
}
