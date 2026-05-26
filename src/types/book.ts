import { Database } from "./database";

export type UpsertUserBookParams = {
  bookId: string;
  status: Database["public"]["Enums"]["user_book_status"];
  rating?: number | null;
  started_at?: string | null;
  finished_at?: string | null;
  tags?: string[] | null;
};
