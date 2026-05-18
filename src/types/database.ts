export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          cancelled_at: string | null
          id: string
          requested_at: string | null
          scheduled_delete_at: string | null
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          id?: string
          requested_at?: string | null
          scheduled_delete_at?: string | null
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          id?: string
          requested_at?: string | null
          scheduled_delete_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_feed: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          book_id: string | null
          club_id: string | null
          comments_count: number | null
          created_at: string | null
          id: string
          likes_count: number | null
          list_id: string | null
          metadata: Json | null
          review_id: string | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          book_id?: string | null
          club_id?: string | null
          comments_count?: number | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          list_id?: string | null
          metadata?: Json | null
          review_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          book_id?: string | null
          club_id?: string | null
          comments_count?: number | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          list_id?: string | null
          metadata?: Json | null
          review_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feed_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "reading_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feed_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feed_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_likes: {
        Row: {
          activity_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_likes_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      book_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          page_number: number | null
          type: Database["public"]["Enums"]["book_note_type"] | null
          updated_at: string | null
          user_book_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          page_number?: number | null
          type?: Database["public"]["Enums"]["book_note_type"] | null
          updated_at?: string | null
          user_book_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          page_number?: number | null
          type?: Database["public"]["Enums"]["book_note_type"] | null
          updated_at?: string | null
          user_book_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_notes_user_book_id_fkey"
            columns: ["user_book_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      book_recommendations: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          note: string | null
          recipient_id: string
          seen_at: string | null
          sender_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          note?: string | null
          recipient_id: string
          seen_at?: string | null
          sender_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          note?: string | null
          recipient_id?: string
          seen_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_recommendations_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_recommendations_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_recommendations_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          authors: string[] | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          genres: string[] | null
          google_books_id: string
          id: string
          isbn_10: string | null
          isbn_13: string | null
          language: string | null
          open_library_id: string | null
          page_count: number | null
          published_date: string | null
          published_year: number | null
          publisher: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          authors?: string[] | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          genres?: string[] | null
          google_books_id: string
          id?: string
          isbn_10?: string | null
          isbn_13?: string | null
          language?: string | null
          open_library_id?: string | null
          page_count?: number | null
          published_date?: string | null
          published_year?: number | null
          publisher?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          authors?: string[] | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          genres?: string[] | null
          google_books_id?: string
          id?: string
          isbn_10?: string | null
          isbn_13?: string | null
          language?: string | null
          open_library_id?: string | null
          page_count?: number | null
          published_date?: string | null
          published_year?: number | null
          publisher?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      buddy_reads: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          initiator_id: string
          partner_id: string
          status: Database["public"]["Enums"]["buddy_read_status"] | null
          updated_at: string | null
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          initiator_id: string
          partner_id: string
          status?: Database["public"]["Enums"]["buddy_read_status"] | null
          updated_at?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          initiator_id?: string
          partner_id?: string
          status?: Database["public"]["Enums"]["buddy_read_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buddy_reads_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_reads_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_reads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          parent_id: string | null
          reply_to_user_id: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["comment_target_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          parent_id?: string | null
          reply_to_user_id?: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["comment_target_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          parent_id?: string | null
          reply_to_user_id?: string | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["comment_target_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_reply_to_user_id_fkey"
            columns: ["reply_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
          status: Database["public"]["Enums"]["follow_status"] | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
          status?: Database["public"]["Enums"]["follow_status"] | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
          status?: Database["public"]["Enums"]["follow_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      list_books: {
        Row: {
          added_at: string | null
          book_id: string
          id: string
          list_id: string
          note: string | null
          position: number
        }
        Insert: {
          added_at?: string | null
          book_id: string
          id?: string
          list_id: string
          note?: string | null
          position?: number
        }
        Update: {
          added_at?: string | null
          book_id?: string
          id?: string
          list_id?: string
          note?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "list_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_books_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_likes: {
        Row: {
          created_at: string | null
          id: string
          list_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          list_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          list_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_likes_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          books_count: number | null
          created_at: string | null
          description: string | null
          id: string
          likes_count: number | null
          name: string
          slug: string
          updated_at: string | null
          user_id: string
          visibility: Database["public"]["Enums"]["list_visibility"] | null
        }
        Insert: {
          books_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          likes_count?: number | null
          name: string
          slug: string
          updated_at?: string | null
          user_id: string
          visibility?: Database["public"]["Enums"]["list_visibility"] | null
        }
        Update: {
          books_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          likes_count?: number | null
          name?: string
          slug?: string
          updated_at?: string | null
          user_id?: string
          visibility?: Database["public"]["Enums"]["list_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          email_weekly_digest: boolean | null
          push_activity_like: boolean | null
          push_comment: boolean | null
          push_new_follower: boolean | null
          push_recommendation: boolean | null
          push_review_like: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          email_weekly_digest?: boolean | null
          push_activity_like?: boolean | null
          push_comment?: boolean | null
          push_new_follower?: boolean | null
          push_recommendation?: boolean | null
          push_review_like?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          email_weekly_digest?: boolean | null
          push_activity_like?: boolean | null
          push_comment?: boolean | null
          push_new_follower?: boolean | null
          push_recommendation?: boolean | null
          push_review_like?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string | null
          id: string
          read_at: string | null
          recipient_id: string
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id: string
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "reading_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_clubs: {
        Row: {
          created_at: string | null
          created_by: string
          current_book_id: string | null
          description: string | null
          id: string
          members_count: number | null
          name: string
          slug: string | null
          updated_at: string | null
          visibility: Database["public"]["Enums"]["list_visibility"] | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          current_book_id?: string | null
          description?: string | null
          id?: string
          members_count?: number | null
          name: string
          slug?: string | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["list_visibility"] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          current_book_id?: string | null
          description?: string | null
          id?: string
          members_count?: number | null
          name?: string
          slug?: string | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["list_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_clubs_current_book_id_fkey"
            columns: ["current_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_sessions: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          notes: string | null
          pages_read: number
          started_at: string | null
          user_book_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          pages_read?: number
          started_at?: string | null
          user_book_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          pages_read?: number
          started_at?: string | null
          user_book_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_user_book_id_fkey"
            columns: ["user_book_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["report_status"] | null
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target_type"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      review_likes: {
        Row: {
          created_at: string | null
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_likes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string
          book_id: string
          comments_count: number | null
          contains_spoilers: boolean | null
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_published: boolean | null
          likes_count: number | null
          updated_at: string | null
          user_book_id: string | null
          user_id: string
        }
        Insert: {
          body: string
          book_id: string
          comments_count?: number | null
          contains_spoilers?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_published?: boolean | null
          likes_count?: number | null
          updated_at?: string | null
          user_book_id?: string | null
          user_id: string
        }
        Update: {
          body?: string
          book_id?: string
          comments_count?: number | null
          contains_spoilers?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_published?: boolean | null
          likes_count?: number | null
          updated_at?: string | null
          user_book_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_book_id_fkey"
            columns: ["user_book_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_books: {
        Row: {
          book_id: string
          created_at: string | null
          current_page: number | null
          finished_at: string | null
          goodreads_id: string | null
          id: string
          is_reread: boolean | null
          rating: number | null
          reread_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["user_book_status"]
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          current_page?: number | null
          finished_at?: string | null
          goodreads_id?: string | null
          id?: string
          is_reread?: boolean | null
          rating?: number | null
          reread_count?: number | null
          started_at?: string | null
          status: Database["public"]["Enums"]["user_book_status"]
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          current_page?: number | null
          finished_at?: string | null
          goodreads_id?: string | null
          id?: string
          is_reread?: boolean | null
          rating?: number | null
          reread_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["user_book_status"]
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          books_read_count: number | null
          created_at: string | null
          deleted_at: string | null
          display_name: string
          favorite_genres: string[] | null
          followers_count: number | null
          following_count: number | null
          id: string
          is_private: boolean | null
          onboarding_completed: boolean | null
          reading_goal: number | null
          reading_goal_year: number | null
          reviews_count: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          books_read_count?: number | null
          created_at?: string | null
          deleted_at?: string | null
          display_name: string
          favorite_genres?: string[] | null
          followers_count?: number | null
          following_count?: number | null
          id: string
          is_private?: boolean | null
          onboarding_completed?: boolean | null
          reading_goal?: number | null
          reading_goal_year?: number | null
          reviews_count?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          books_read_count?: number | null
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string
          favorite_genres?: string[] | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          is_private?: boolean | null
          onboarding_completed?: boolean | null
          reading_goal?: number | null
          reading_goal_year?: number | null
          reviews_count?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      immutable_array_to_string: {
        Args: { arr: string[]; sep: string }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      activity_type:
        | "finished_book"
        | "started_book"
        | "wrote_review"
        | "added_to_list"
        | "want_to_read"
        | "abandoned_book"
      book_note_type: "note" | "quote"
      buddy_read_status: "pending" | "active" | "completed" | "declined"
      comment_target_type: "review" | "activity"
      follow_status: "pending" | "accepted"
      list_visibility: "public" | "private"
      notification_type:
        | "new_follower"
        | "review_like"
        | "activity_like"
        | "reading_challenge_completed"
        | "recommendation_received"
        | "buddy_read_invite"
        | "club_invite"
      report_status: "pending" | "reviewing" | "resolved" | "dismissed"
      report_target_type: "review" | "comment" | "user" | "list" | "activity"
      user_book_status: "reading" | "read" | "want_to_read" | "abandoned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "finished_book",
        "started_book",
        "wrote_review",
        "added_to_list",
        "want_to_read",
        "abandoned_book",
      ],
      book_note_type: ["note", "quote"],
      buddy_read_status: ["pending", "active", "completed", "declined"],
      comment_target_type: ["review", "activity"],
      follow_status: ["pending", "accepted"],
      list_visibility: ["public", "private"],
      notification_type: [
        "new_follower",
        "review_like",
        "activity_like",
        "reading_challenge_completed",
        "recommendation_received",
        "buddy_read_invite",
        "club_invite",
      ],
      report_status: ["pending", "reviewing", "resolved", "dismissed"],
      report_target_type: ["review", "comment", "user", "list", "activity"],
      user_book_status: ["reading", "read", "want_to_read", "abandoned"],
    },
  },
} as const
