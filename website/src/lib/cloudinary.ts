// src/lib/cloudinary.ts

export async function uploadToCloudinary(file: File) {
    console.log("Cloudinary config:", {
  cloud: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
});

  const formData = new FormData();
  
  formData.append("file", file);
  formData.append(
    "upload_preset",
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  );

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Cloudinary upload failed");
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    public_id: data.public_id,
    resource_type: data.resource_type, // image | video | raw
    format: data.format,
  };
}
