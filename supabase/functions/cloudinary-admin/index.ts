import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const KIND_CONFIG = {
  image: { folder: "ethnoverse/images", resourceType: "image" },
  audio: { folder: "ethnoverse/audio", resourceType: "video" },
  document: { folder: "ethnoverse/documents", resourceType: "raw" },
  "3d-tour": { folder: "ethnoverse/3d-captures", resourceType: "raw" },
  "tour-object": { folder: "ethnoverse/3d-tour", resourceType: "raw" },
} as const;

type UploadKind = keyof typeof KIND_CONFIG;
type ResourceType = "image" | "video" | "raw";

const ARCHIVE_DELETE_CONFIG = {
  IMAGE: {
    table: "visual_media",
    assets: [{ column: "picture_cloudinary_url", resourceType: "image" }],
  },
  AUDIO: {
    table: "interviews",
    assets: [
      { column: "audio_cloudinary_url", resourceType: "video" },
      { column: "picture_cloudinary_url", resourceType: "image" },
    ],
  },
  DOCUMENT: {
    table: "documents",
    assets: [{ column: "pdf_cloudinary_url", resourceType: "raw" }],
  },
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha1(value: string) {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function cloudinarySignature(
  parameters: Record<string, string | number>,
  apiSecret: string,
) {
  const serialized = Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return sha1(`${serialized}${apiSecret}`);
}

async function hmacSha256(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function assetFromCloudinaryUrl(
  value: unknown,
  cloudName: string,
  resourceType: ResourceType,
) {
  if (typeof value !== "string" || !value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return null;
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (parts[0] !== cloudName || parts[1] !== resourceType) return null;
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex < 0) return null;
    const publicParts = parts.slice(uploadIndex + 1);
    if (/^v\d+$/.test(publicParts[0] ?? "")) publicParts.shift();
    if (!publicParts.length) return null;
    if (resourceType !== "raw") {
      publicParts[publicParts.length - 1] = publicParts.at(-1)?.replace(/\.[^.]+$/, "") ?? "";
    }
    const publicId = publicParts.join("/");
    if (!publicId.startsWith("ethnoverse/")) return null;
    return { publicId, resourceType };
  } catch {
    return null;
  }
}

async function destroyCloudinaryAsset(
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  publicId: string,
  resourceType: ResourceType,
  timestamp: number,
) {
  const parameters = { invalidate: "true", public_id: publicId, timestamp };
  const body = new URLSearchParams({
    api_key: apiKey,
    timestamp: String(timestamp),
    public_id: publicId,
    invalidate: "true",
    signature: await cloudinarySignature(parameters, apiSecret),
  });
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    { method: "POST", body },
  );
  const result = await response.json();
  if (!response.ok || !["ok", "not found"].includes(result.result)) {
    throw new Error("Cloudinary deletion failed");
  }
}

async function requireAdmin(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Response("Authentication required", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authorization } } },
  );
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Response("Authentication required", { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (profileError || profile?.role !== "admin") {
    throw new Response("Administrator access required", { status: 403 });
  }
  return supabase;
}

export default {
  async fetch(request: Request) {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabase = await requireAdmin(request);
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
    if (!cloudName || !apiKey || !apiSecret) {
      return json({ error: "Cloudinary secrets are not configured" }, 503);
    }

    const payload = await request.json();
    const timestamp = Math.floor(Date.now() / 1_000);

    if (payload.action === "sign-upload") {
      const kind = payload.kind as UploadKind;
      const config = KIND_CONFIG[kind];
      if (!config) return json({ error: "Unsupported upload kind" }, 422);
      const parameters = { folder: config.folder, timestamp };
      return json({
        cloudName,
        apiKey,
        timestamp,
        signature: await cloudinarySignature(parameters, apiSecret),
        folder: config.folder,
        resourceType: config.resourceType,
      });
    }

    if (payload.action === "delete") {
      const publicId = String(payload.publicId ?? "");
      const resourceType = payload.resourceType as ResourceType;
      if (!publicId.startsWith("ethnoverse/") || !["image", "video", "raw"].includes(resourceType)) {
        return json({ error: "Invalid asset identifier" }, 422);
      }
      try {
        await destroyCloudinaryAsset(
          cloudName,
          apiKey,
          apiSecret,
          publicId,
          resourceType,
          timestamp,
        );
      } catch {
        return json({ error: "Cloudinary deletion failed" }, 502);
      }
      return json({ result: "ok" });
    }

    if (payload.action === "delete-archive-item") {
      const archiveType = String(payload.archiveType ?? "") as keyof typeof ARCHIVE_DELETE_CONFIG;
      const config = ARCHIVE_DELETE_CONFIG[archiveType];
      const itemId = String(payload.itemId ?? "");
      if (!config || !/^\d+$/.test(itemId)) {
        return json({ error: "Invalid archive item" }, 422);
      }
      const assetColumns = config.assets.map((asset) => asset.column).join(", ");
      const { data: item, error: itemError } = await supabase
        .from(config.table)
        .select(`id, ${assetColumns}`)
        .eq("id", Number(itemId))
        .maybeSingle();
      if (itemError || !item) return json({ error: "Archive item not found" }, 404);

      const { error: deleteError } = await supabase
        .from(config.table)
        .delete()
        .eq("id", Number(itemId));
      if (deleteError) return json({ error: "Archive item deletion failed" }, 500);

      let cleanupWarning = false;
      const itemRecord = item as Record<string, unknown>;
      for (const assetConfig of config.assets) {
        const asset = assetFromCloudinaryUrl(
          itemRecord[assetConfig.column],
          cloudName,
          assetConfig.resourceType,
        );
        if (!asset) continue;
        try {
          await destroyCloudinaryAsset(
            cloudName,
            apiKey,
            apiSecret,
            asset.publicId,
            asset.resourceType,
            timestamp,
          );
        } catch (cleanupError) {
          cleanupWarning = true;
          console.error("Cloudinary cleanup failed", asset.publicId, cleanupError);
        }
      }
      return json({ result: "ok", cleanupWarning });
    }

    if (payload.action === "sign-model-download") {
      const downloadEndpoint = Deno.env.get("MODAL_DOWNLOAD_URL");
      const downloadSecret = Deno.env.get("MODEL_DOWNLOAD_SIGNING_SECRET");
      if (!downloadEndpoint || !downloadSecret) {
        return json({ error: "Model download signing is not configured" }, 503);
      }
      const jobId = String(payload.jobId ?? "");
      const { data: job, error: jobError } = await supabase
        .from("model_jobs")
        .select("object_name, status")
        .eq("id", jobId)
        .maybeSingle();
      if (jobError || !job || job.status !== "done") {
        return json({ error: "Completed model job not found" }, 404);
      }
      const expires = Math.floor(Date.now() / 1_000) + 300;
      const signature = await hmacSha256(
        `${job.object_name}:${expires}`,
        downloadSecret,
      );
      const url = new URL(downloadEndpoint);
      url.searchParams.set("object_name", job.object_name);
      url.searchParams.set("expires", String(expires));
      url.searchParams.set("signature", signature);
      return json({ url: url.toString(), expires });
    }

    return json({ error: "Unsupported action" }, 422);
  } catch (error) {
    if (error instanceof Response) {
      return new Response(error.body, { status: error.status, headers: corsHeaders });
    }
    console.error("cloudinary-admin failed", error);
    return json({ error: "Unexpected server error" }, 500);
  }
  },
};
