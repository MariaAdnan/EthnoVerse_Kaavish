import { supabase } from "../lib/supabase";

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
  const { data, error } = await supabase
    .from("documents")
    .insert([payload])
    .select()
    .single();
  return { data, error };
}