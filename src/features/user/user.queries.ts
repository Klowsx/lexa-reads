import { queryOptions } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import type { Tables } from "~/types";

export type ReadingGoalData = {
  goal: number;
  goalYear: number;
  booksRead: number;
};

async function fetchReadingGoal(userId: string): Promise<ReadingGoalData> {
  const currentYear = new Date().getFullYear();

  const [userResult, booksResult] = await Promise.all([
    supabase
      .from("users")
      .select("reading_goal, reading_goal_year")
      .eq("id", userId)
      .single(),
    supabase
      .from("user_books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "read")
      .gte("finished_at", `${currentYear}-01-01`)
      .lte("finished_at", `${currentYear}-12-31`),
  ]);

  if (userResult.error) throw userResult.error;
  if (booksResult.error) throw booksResult.error;

  return {
    goal: userResult.data.reading_goal ?? 12,
    goalYear: userResult.data.reading_goal_year ?? currentYear,
    booksRead: booksResult.count ?? 0,
  };
}

export const readingGoalQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["reading_goal", userId],
    queryFn: () => fetchReadingGoal(userId),
    enabled: !!userId,
  });

export async function updateReadingGoalFn(
  userId: string,
  goal: number,
): Promise<Pick<Tables<"users">, "reading_goal" | "reading_goal_year">> {
  const currentYear = new Date().getFullYear();
  const { data, error } = await supabase
    .from("users")
    .update({ reading_goal: goal, reading_goal_year: currentYear })
    .eq("id", userId)
    .select("reading_goal, reading_goal_year")
    .single();
  if (error) throw error;
  return data;
}
