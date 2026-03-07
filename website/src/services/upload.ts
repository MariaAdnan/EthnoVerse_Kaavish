// src/services/upload.ts
export async function uploadToCloudinary(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ethnoverse_unsigned");

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/dve5xqucs/auto/upload",
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