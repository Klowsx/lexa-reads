import type { Tables, UpsertUserBookParams } from "~/types";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";

async function fetchUserBook(userId: string, bookId: string) {
  const { data, error } = await supabase
    .from("user_books")
    .select("*")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export const userBookQueryOptions = (userId: string, bookId: string) =>
  queryOptions({
    queryKey: ["user_books", userId, bookId],
    queryFn: () => fetchUserBook(userId, bookId),
    enabled: !!userId && !!bookId,
  });

export async function upsertUserBookFn(
  userId: string,
  params: UpsertUserBookParams,
): Promise<Tables<"user_books">> {
  const { bookId, ...fields } = params;
  const { data, error } = await supabase
    .from("user_books")
    .upsert(
      { user_id: userId, book_id: bookId, ...fields },
      { onConflict: "user_id,book_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUserBookFn(userId: string, bookId: string): Promise<void> {
  const { error } = await supabase
    .from("user_books")
    .delete()
    .eq("user_id", userId)
    .eq("book_id", bookId);
  if (error) throw error;
}