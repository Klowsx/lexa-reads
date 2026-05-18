import type { Tables, Enums } from "./database";

export type UserProfile = Pick<
  Tables<"users">,
  | "id"
  | "username"
  | "display_name"
  | "avatar_url"
  | "bio"
  | "favorite_genres"
  | "books_read_count"
  | "reviews_count"
  | "followers_count"
  | "following_count"
  | "is_private"
  | "reading_goal"
  | "reading_goal_year"
  | "onboarding_completed"
  | "created_at"
>;
