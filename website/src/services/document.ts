import { supabase } from "../lib/supabase";
import {
  optionalText,
  requireHttpUrl,
  requireText,
  requireUuid,
} from "../lib/validation";

export async function getDocumentsByCommunity(communityId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select(`id, title, description, pdf_cloudinary_url, author, pages, file_size_kb, created_at, communities(name)`)
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getDocumentById(id: string | number) {
  const { data, error } = await supabase
    .from("documents")
    .select(`*, communities(community_id, name)`)
    .eq("id", Number(id))
    .single();
  if (error) throw error;
  return data;
}

export async function createDocument(payload: {
  title: string;
  description?: string | null;
  community_id: string;
  pdf_cloudinary_url: string;
  author?: string | null;
  pages?: number | null;
  file_size_kb?: number | null;
}) {
  const validated = {
    title: requireText(payload.title, "Title", 200),
    description: optionalText(payload.description, "Description", 5_000),
    community_id: requireUuid(payload.community_id, "Community"),
    pdf_cloudinary_url: requireHttpUrl(payload.pdf_cloudinary_url, "Document URL"),
    author: optionalText(payload.author, "Author", 200),
    pages:
      payload.pages == null
        ? null
        : Math.max(1, Math.min(100_000, Math.trunc(payload.pages))),
    file_size_kb:
      payload.file_size_kb == null
        ? null
        : Math.max(1, Math.min(100_000_000, Math.trunc(payload.file_size_kb))),
  };
  const { data, error } = await supabase
    .from("documents")
    .insert([validated])
    .select()
    .single();
  return { data, error };
}
