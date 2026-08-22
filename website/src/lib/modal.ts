import { supabase } from "./supabase";
import { withTimeout } from "./async";

const cloudinaryFunction =
  import.meta.env.VITE_CLOUDINARY_ADMIN_FUNCTION?.trim() || "cloudinary-admin";

export async function requestModelDownloadUrl(jobId: string) {
  const { data, error } = await withTimeout(
    supabase.functions.invoke<{ url: string }>(
      cloudinaryFunction,
      { body: { action: "sign-model-download", jobId } },
    ),
    12_000,
    "Model download authorization timed out.",
  );
  if (error || !data?.url) {
    throw new Error("A secure model download link could not be created.");
  }
  return data.url;
}

export async function downloadModel(jobId: string, filename: string) {
  const url = await requestModelDownloadUrl(jobId);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
