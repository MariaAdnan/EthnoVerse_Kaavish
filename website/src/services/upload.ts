// src/services/upload.ts

export async function uploadToCloudinary(file: File) {
  return uploadWithResourceType(file, "auto");
}

export async function uploadZipToCloudinary(file: File) {
  return uploadWithResourceType(file, "raw");
}

async function uploadWithResourceType(file: File, resourceType: "auto" | "raw" | "image" | "video") {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary upload configuration is missing");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Upload failed");
  }

  return data.secure_url;
}
