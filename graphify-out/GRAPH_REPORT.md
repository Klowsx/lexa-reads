# Graph Report - supabase/migrations  (2026-05-15)

## Corpus Check
- Corpus is ~2,448 words - fits in a single context window. You may not need a graph.

## Summary
- 35 nodes · 53 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 89% EXTRACTED · 0% INFERRED · 11% AMBIGUOUS
- Token cost: 34,616 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Lists & Visibility|Lists & Visibility]]
- [[_COMMUNITY_User Library & Reading Progress|User Library & Reading Progress]]
- [[_COMMUNITY_Compliance & Auth|Compliance & Auth]]
- [[_COMMUNITY_Books & Social Reading|Books & Social Reading]]
- [[_COMMUNITY_Activity Feed & Likes|Activity Feed & Likes]]
- [[_COMMUNITY_Reviews & Missing Likes|Reviews & Missing Likes]]
- [[_COMMUNITY_Follows & Social Graph|Follows & Social Graph]]
- [[_COMMUNITY_Notifications|Notifications]]

## God Nodes (most connected - your core abstractions)
1. `users table` - 20 edges
2. `books table` - 7 edges
3. `user_books table` - 7 edges
4. `activity_feed table` - 7 edges
5. `reviews table` - 6 edges
6. `lists table` - 6 edges
7. `reading_clubs table (Phase 3)` - 4 edges
8. `follows table` - 3 edges
9. `list_books table` - 3 edges
10. `activity_likes table` - 3 edges

## Surprising Connections (you probably didn't know these)
- `follows table` --references--> `users table`  [EXTRACTED]
  supabase/migrations/001_initial_schema.sql → supabase/migrations/001_initial_schema.sql  _Bridges community 2 → community 6_
- `user_books table` --references--> `users table`  [EXTRACTED]
  supabase/migrations/001_initial_schema.sql → supabase/migrations/001_initial_schema.sql  _Bridges community 2 → community 1_
- `reviews table` --references--> `users table`  [EXTRACTED]
  supabase/migrations/001_initial_schema.sql → supabase/migrations/001_initial_schema.sql  _Bridges community 2 → community 5_
- `lists table` --references--> `users table`  [EXTRACTED]
  supabase/migrations/001_initial_schema.sql → supabase/migrations/001_initial_schema.sql  _Bridges community 2 → community 0_
- `activity_feed table` --references--> `users table`  [EXTRACTED]
  supabase/migrations/001_initial_schema.sql → supabase/migrations/001_initial_schema.sql  _Bridges community 2 → community 4_

## Hyperedges (group relationships)
- **Tables using moddatetime trigger for updated_at** — 001_users, 001_books, 001_user_books, 001_reviews, 001_lists, 001_book_notes, 001_reading_clubs, 001_buddy_reads [EXTRACTED 1.00]
- **Social Activity Feed Cluster** — 001_activity_feed, 001_activity_likes, 001_follows, 001_notifications, 001_book_recommendations [INFERRED 0.90]
- **Compliance-Critical Missing Tables** — 001_ambiguous_user_blocks, 001_ambiguous_content_reports, 001_ambiguous_account_deletion [INFERRED 0.95]
- **User Library Reading Tracking Cluster** — 001_user_books, 001_reading_sessions, 001_book_notes, 001_reviews [INFERRED 0.90]
- **Denormalized Counter Trigger Functions** — 001_fn_update_follow_counts, 001_fn_update_books_read_count, 001_fn_update_reviews_count, 001_fn_update_activity_likes_count, 001_fn_update_list_books_count [EXTRACTED 1.00]

## Communities (8 total, 1 thin omitted)

### Community 0 - "Lists & Visibility"
Cohesion: 0.33
Nodes (7): MISSING: list_likes table (lists.likes_count has no maintaining trigger), MISSING: reading_club_members join table (implied by members_count in reading_clubs), list_visibility ENUM, update_list_books_count() trigger function, list_books table, lists table, reading_clubs table (Phase 3)

### Community 1 - "User Library & Reading Progress"
Cohesion: 0.33
Nodes (6): book_notes table (Phase 2), book_note_type ENUM, user_book_status ENUM, update_books_read_count() trigger function, reading_sessions table (Phase 2), user_books table

### Community 2 - "Compliance & Auth"
Cohesion: 0.4
Nodes (6): MISSING: account_deletion_requests table (compliance-critical, 30-day deferred hard-delete), MISSING: content_reports table (compliance-critical), MISSING: user_blocks table (compliance-critical), auth.users (Supabase Auth built-in), handle_new_user() trigger function, users table

### Community 3 - "Books & Social Reading"
Cohesion: 0.5
Nodes (4): book_recommendations table (Phase 2), books table, buddy_reads table (Phase 3), buddy_read_status ENUM

### Community 4 - "Activity Feed & Likes"
Cohesion: 0.67
Nodes (4): activity_feed table, activity_likes table, activity_type ENUM, update_activity_likes_count() trigger function

### Community 5 - "Reviews & Missing Likes"
Cohesion: 0.67
Nodes (3): MISSING: review_likes table (reviews.likes_count has no maintaining trigger), update_reviews_count() trigger function, reviews table

### Community 6 - "Follows & Social Graph"
Cohesion: 0.67
Nodes (3): follow_status ENUM, update_follow_counts() trigger function, follows table

## Ambiguous Edges - Review These
- `users table` → `MISSING: user_blocks table (compliance-critical)`  [AMBIGUOUS]
  supabase/migrations/001_initial_schema.sql · relation: conceptually_related_to
- `users table` → `MISSING: content_reports table (compliance-critical)`  [AMBIGUOUS]
  supabase/migrations/001_initial_schema.sql · relation: conceptually_related_to
- `users table` → `MISSING: account_deletion_requests table (compliance-critical, 30-day deferred hard-delete)`  [AMBIGUOUS]
  supabase/migrations/001_initial_schema.sql · relation: conceptually_related_to
- `reviews table` → `MISSING: review_likes table (reviews.likes_count has no maintaining trigger)`  [AMBIGUOUS]
  supabase/migrations/001_initial_schema.sql · relation: conceptually_related_to
- `lists table` → `MISSING: list_likes table (lists.likes_count has no maintaining trigger)`  [AMBIGUOUS]
  supabase/migrations/001_initial_schema.sql · relation: conceptually_related_to
- `reading_clubs table (Phase 3)` → `MISSING: reading_club_members join table (implied by members_count in reading_clubs)`  [AMBIGUOUS]
  supabase/migrations/001_initial_schema.sql · relation: conceptually_related_to

## Knowledge Gaps
- **12 isolated node(s):** `follow_status ENUM`, `user_book_status ENUM`, `activity_type ENUM`, `notification_type ENUM`, `book_note_type ENUM` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `users table` and `MISSING: user_blocks table (compliance-critical)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `users table` and `MISSING: content_reports table (compliance-critical)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `users table` and `MISSING: account_deletion_requests table (compliance-critical, 30-day deferred hard-delete)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `reviews table` and `MISSING: review_likes table (reviews.likes_count has no maintaining trigger)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `lists table` and `MISSING: list_likes table (lists.likes_count has no maintaining trigger)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `reading_clubs table (Phase 3)` and `MISSING: reading_club_members join table (implied by members_count in reading_clubs)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `users table` connect `Compliance & Auth` to `Lists & Visibility`, `User Library & Reading Progress`, `Books & Social Reading`, `Activity Feed & Likes`, `Reviews & Missing Likes`, `Follows & Social Graph`, `Notifications`?**
  _High betweenness centrality (0.740) - this node is a cross-community bridge._