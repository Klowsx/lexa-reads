# Graph Report - .  (2026-05-18)

## Corpus Check
- Corpus is ~20,632 words - fits in a single context window. You may not need a graph.

## Summary
- 143 nodes · 180 edges · 23 communities (18 shown, 5 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Project Architecture & Compliance|Project Architecture & Compliance]]
- [[_COMMUNITY_Supabase Database Types & Test Utils|Supabase Database Types & Test Utils]]
- [[_COMMUNITY_Utility Functions|Utility Functions]]
- [[_COMMUNITY_Core Database Schema|Core Database Schema]]
- [[_COMMUNITY_App Core Architecture|App Core Architecture]]
- [[_COMMUNITY_Auth Store & Layout|Auth Store & Layout]]
- [[_COMMUNITY_Error Handling & Toast System|Error Handling & Toast System]]
- [[_COMMUNITY_Typography Theme|Typography Theme]]
- [[_COMMUNITY_Design Token System|Design Token System]]
- [[_COMMUNITY_Metro Bundler Config|Metro Bundler Config]]
- [[_COMMUNITY_Color Theme|Color Theme]]
- [[_COMMUNITY_App Icon Assets|App Icon Assets]]
- [[_COMMUNITY_Favicon Config|Favicon Config]]
- [[_COMMUNITY_App Icon Reference|App Icon Reference]]
- [[_COMMUNITY_Splash Screen|Splash Screen]]
- [[_COMMUNITY_Utils Module|Utils Module]]
- [[_COMMUNITY_Jest Config (Isolated)|Jest Config (Isolated)]]

## God Nodes (most connected - your core abstractions)
1. `Canonical Product and Architecture Spec` - 14 edges
2. `Initial Schema Migration` - 10 edges
3. `Project Guidance Document` - 9 edges
4. `RLS Policies as SQL in Migrations Rule` - 9 edges
5. `Gaps and Security Fixes Migration` - 7 edges
6. `User Blocks Database Table` - 7 edges
7. `Schema Gap Analysis (Graph Output)` - 6 edges
8. `useAuthStore` - 5 edges
9. `Root Layout` - 5 edges
10. `Denormalized Counters via Database Triggers` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Notification Preferences Migration` --implements--> `RLS Policies as SQL in Migrations Rule`  [EXTRACTED]
  supabase/migrations/004_notification_preferences.sql → STACK.md
- `Schema Sync Migration` --references--> `Canonical Product and Architecture Spec`  [INFERRED]
  supabase/migrations/006_schema_sync.sql → STACK.md
- `RLS Policy Integration Tests` --implements--> `RLS Testing Against Real Database`  [INFERRED]
  src/__tests__/features/auth/rls.test.ts → CLAUDE.md
- `Auth Store Unit Tests` --references--> `RLS Exclusion via User Blocks Pattern`  [INFERRED]
  src/__tests__/stores/auth.store.test.ts → STACK.md
- `Initial Schema Migration` --implements--> `Denormalized Counters via Database Triggers`  [EXTRACTED]
  supabase/migrations/001_initial_schema.sql → STACK.md

## Hyperedges (group relationships)
- **Auth Flow Pipeline** — layout_RootLayout, layout_AuthGate, lib_supabase, stores_auth, concept_auth_flow [INFERRED 0.85]
- **Error Handling Chain** — lib_query_client, types_errors, stores_ui [INFERRED 0.85]
- **Design Token System** — config_tailwind, theme_colors, theme_typography, concept_theme_system [INFERRED 0.85]
- **Schema Migration Sequence** — migration_001, migration_002, migration_003, migration_004, migration_005, migration_006, migration_007, migration_008 [EXTRACTED 1.00]
- **Store Compliance Block** — compliance_requirements, user_blocks_table, reports_table, account_deletion_requests_table, user_blocks_rls_enforcement [EXTRACTED 1.00]
- **Architecture Rules Set** — app_routes_only_rule, google_books_cache_first, expo_secure_store_rule, queryOptions_factory_pattern, rls_as_sql_rule, denormalized_counters_pattern, user_blocks_rls_enforcement, feed_fan_in_strategy [EXTRACTED 1.00]

## Communities (23 total, 5 thin omitted)

### Community 0 - "Project Architecture & Compliance"
Cohesion: 0.16
Nodes (26): Project Guidance Document, Canonical Product and Architecture Spec, Account Deletion Requests Table, Schema Gap Analysis (Graph Output), App Routes Only Rule, Auth Store Unit Tests, Comments Database Table, App Store Compliance Requirements (+18 more)

### Community 1 - "Supabase Database Types & Test Utils"
Cohesion: 0.13
Nodes (16): ExpoSecureStoreAdapter, supabase, adminClient, createTestUser(), createUserClient(), CompositeTypes, Constants, Database (+8 more)

### Community 2 - "Utility Functions"
Cohesion: 0.15
Nodes (3): formatDate(), formatRelativeTime(), StarState

### Community 3 - "Core Database Schema"
Cohesion: 0.14
Nodes (14): UserProfile Domain Type, Activity Feed Database Table, Books Database Table, Follows Database Table, Handle New User Trigger Function, Lists Database Table, Initial Schema Migration, Notification Preferences Migration (+6 more)

### Community 4 - "App Core Architecture"
Cohesion: 0.29
Nodes (11): Auth Flow Pattern, State Management Architecture, Auth Gate, Root Layout, Query Client, Supabase Client, Auth Store, UI Toast Store (+3 more)

### Community 5 - "Auth Store & Layout"
Cohesion: 0.29
Nodes (7): AuthGate(), RootLayout(), AuthState, mockSession, mockUser, { session, user }, useAuthStore

### Community 6 - "Error Handling & Toast System"
Cohesion: 0.24
Nodes (7): queryClient, Toast, UIState, useUIStore, AppError, AppErrorCode, toAppError()

### Community 7 - "Typography Theme"
Cohesion: 0.33
Nodes (5): fontFamily, fonts, fontSize, letterSpacing, lineHeight

### Community 8 - "Design Token System"
Cohesion: 0.6
Nodes (5): Theme Design System, Metro Config, Tailwind Config, Theme Colors, Theme Typography

### Community 9 - "Metro Bundler Config"
Cohesion: 0.5
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

### Community 10 - "Color Theme"
Cohesion: 0.5
Nodes (3): fixed, rawDark, rawLight

### Community 11 - "App Icon Assets"
Cohesion: 0.67
Nodes (4): Android Adaptive Icon Format, Android Adaptive App Icon (PNG), Expo Standard Asset, Lexa Reads App

## Knowledge Gaps
- **50 isolated node(s):** `{ getDefaultConfig }`, `{ withNativeWind }`, `config`, `ExpoSecureStoreAdapter`, `StarState` (+45 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Initial Schema Migration` connect `Core Database Schema` to `Project Architecture & Compliance`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `RLS Policies as SQL in Migrations Rule` connect `Project Architecture & Compliance` to `Core Database Schema`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Canonical Product and Architecture Spec` (e.g. with `Schema Sync Migration` and `App Store Compliance Requirements`) actually correct?**
  _`Canonical Product and Architecture Spec` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `{ getDefaultConfig }`, `{ withNativeWind }`, `config` to the rest of the system?**
  _50 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Supabase Database Types & Test Utils` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Core Database Schema` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._