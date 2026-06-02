import { queryOptions } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import type { Tables } from "~/types/database";

// ── Types ──────────────────────────────────────────────────────

export type ListPreviewBook = {
  id: string;
  cover_url: string | null;
  title: string;
};

export type ListRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  slug: string;
  books_count: number;
  likes_count: number;
  is_featured: boolean;
  accent_color: string;
  created_at: string;
  preview_books: ListPreviewBook[];
};

export type ListBookItem = {
  id: string;
  position: number;
  note: string | null;
  added_at: string;
  book: Tables<"books">;
};

export type ListDetail = ListRow & {
  items: ListBookItem[];
};

// ── Slug generation ────────────────────────────────────────────

export function generateListSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base}-${Date.now().toString(36)}`;
}

// ── List columns ───────────────────────────────────────────────

const LIST_COLS =
  "id, user_id, name, description, visibility, slug, books_count, likes_count, is_featured, accent_color, created_at, preview_books:list_books(id, position, book:books(id, cover_url, title))";

const LIST_DETAIL_COLS = `
  id, user_id, name, description, visibility, slug, books_count, likes_count, is_featured, accent_color, created_at,
  items:list_books(id, position, note, added_at, book:books(id, title, authors, cover_url, google_books_id, page_count, genres, description, published_date, publisher))
`.trim();

// ── Fetch functions ────────────────────────────────────────────

async function fetchUserLists(userId: string): Promise<ListRow[]> {
  const { data, error } = await supabase
    .from("lists")
    .select(LIST_COLS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as any[]).map((row) => ({
    ...row,
    is_featured: row.is_featured ?? false,
    accent_color: row.accent_color ?? "#4A96B8",
    preview_books: ((row.preview_books ?? []) as any[])
      .sort((a: any, b: any) => a.position - b.position)
      .slice(0, 3)
      .map((lb: any) => lb.book as ListPreviewBook),
  }));
}

async function fetchList(slug: string): Promise<ListDetail | null> {
  const { data, error } = await supabase
    .from("lists")
    .select(LIST_DETAIL_COLS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const raw = data as any;
  const detail: ListDetail = {
    ...raw,
    is_featured: raw.is_featured ?? false,
    accent_color: raw.accent_color ?? "#4A96B8",
    items: ((raw.items ?? []) as any[]).sort(
      (a, b) => a.position - b.position,
    ),
  };
  return detail;
}

// ── Query options ──────────────────────────────────────────────

export const userListsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["lists", "user", userId],
    queryFn: () => fetchUserLists(userId),
    enabled: !!userId,
  });

export const listQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["lists", "slug", slug],
    queryFn: () => fetchList(slug),
    enabled: !!slug,
  });

// ── Mutation functions ─────────────────────────────────────────

export async function createListFn(params: {
  userId: string;
  name: string;
  description?: string;
  visibility: "public" | "private";
  accentColor: string;
}): Promise<ListRow> {
  const slug = generateListSlug(params.name);
  const { data, error } = await supabase
    .from("lists")
    .insert({
      user_id: params.userId,
      name: params.name,
      description: params.description ?? null,
      visibility: params.visibility,
      slug,
      accent_color: params.accentColor,
    } as any)
    .select(LIST_COLS)
    .single();
  if (error) throw error;
  const row = data as unknown as ListRow;
  return { ...row, is_featured: false, accent_color: params.accentColor };
}

export async function updateListFn(params: {
  listId: string;
  name?: string;
  description?: string | null;
  visibility?: "public" | "private";
  accentColor?: string;
  isFeatured?: boolean;
}): Promise<ListRow> {
  const updates: Record<string, unknown> = {};
  if (params.name !== undefined) updates.name = params.name;
  if (params.description !== undefined) updates.description = params.description;
  if (params.visibility !== undefined) updates.visibility = params.visibility;
  if (params.accentColor !== undefined) updates.accent_color = params.accentColor;
  if (params.isFeatured !== undefined) updates.is_featured = params.isFeatured;

  const { data, error } = await supabase
    .from("lists")
    .update(updates as any)
    .eq("id", params.listId)
    .select(LIST_COLS)
    .single();
  if (error) throw error;
  return data as unknown as ListRow;
}

export async function deleteListFn(listId: string): Promise<void> {
  const { error } = await supabase.from("lists").delete().eq("id", listId);
  if (error) throw error;
}

export async function addBookToListFn(
  listId: string,
  bookId: string,
  position: number,
): Promise<void> {
  const { error } = await supabase.from("list_books").insert({
    list_id: listId,
    book_id: bookId,
    position,
  });
  if (error) throw error;
}

export async function removeBookFromListFn(listBookId: string): Promise<void> {
  const { error } = await supabase
    .from("list_books")
    .delete()
    .eq("id", listBookId);
  if (error) throw error;
}

export async function reorderListBooksFn(
  updates: { id: string; position: number }[],
): Promise<void> {
  await Promise.all(
    updates.map(({ id, position }) =>
      supabase.from("list_books").update({ position }).eq("id", id),
    ),
  );
}

export async function toggleListLikeFn(
  listId: string,
  userId: string,
  currentlyLiked: boolean,
): Promise<void> {
  if (currentlyLiked) {
    const { error } = await supabase
      .from("list_likes")
      .delete()
      .eq("list_id", listId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("list_likes")
      .insert({ list_id: listId, user_id: userId });
    if (error) throw error;
  }
}
