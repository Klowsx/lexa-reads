# Graph Report - .  (2026-05-20)

## Corpus Check
- 0 files · ~99,999 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 325 nodes · 430 edges · 51 communities (28 shown, 23 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Product Architecture & Schema|Product Architecture & Schema]]
- [[_COMMUNITY_Security & Production Readiness|Security & Production Readiness]]
- [[_COMMUNITY_Onboarding Flow UI|Onboarding Flow UI]]
- [[_COMMUNITY_Auth Screens (LoginRegister)|Auth Screens (Login/Register)]]
- [[_COMMUNITY_App Layout & Routing|App Layout & Routing]]
- [[_COMMUNITY_Supabase Types & Test Utils|Supabase Types & Test Utils]]
- [[_COMMUNITY_Auth Flow Architecture Patterns|Auth Flow Architecture Patterns]]
- [[_COMMUNITY_Cross-Cutting Patterns (StoresMutations)|Cross-Cutting Patterns (Stores/Mutations)]]
- [[_COMMUNITY_Utility Functions|Utility Functions]]
- [[_COMMUNITY_Error Handling & Toast System|Error Handling & Toast System]]
- [[_COMMUNITY_Typography System|Typography System]]
- [[_COMMUNITY_Theme-Aware Components|Theme-Aware Components]]
- [[_COMMUNITY_Theme Design System|Theme Design System]]
- [[_COMMUNITY_Metro Configuration|Metro Configuration]]
- [[_COMMUNITY_Color Tokens|Color Tokens]]
- [[_COMMUNITY_App Assets & Icons|App Assets & Icons]]
- [[_COMMUNITY_Welcome Screen|Welcome Screen]]
- [[_COMMUNITY_BackBar Component|BackBar Component]]
- [[_COMMUNITY_GhostButton Component|GhostButton Component]]
- [[_COMMUNITY_OnboardHeader Component|OnboardHeader Component]]
- [[_COMMUNITY_PrimaryButton Component|PrimaryButton Component]]
- [[_COMMUNITY_Wordmark Component|Wordmark Component]]
- [[_COMMUNITY_Web Configuration|Web Configuration]]
- [[_COMMUNITY_App Icon|App Icon]]
- [[_COMMUNITY_Splash Screen Config|Splash Screen Config]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]

## God Nodes (most connected - your core abstractions)
1. `STACK.md â€” Canonical Product and DB Spec` - 33 edges
2. `useColors()` - 23 edges
3. `useAuthStore` - 14 edges
4. `Canonical Product and Architecture Spec` - 14 edges
5. `Initial Schema Migration` - 10 edges
6. `Project Guidance Document` - 9 edges
7. `RLS Policies as SQL in Migrations Rule` - 9 edges
8. `supabaseClient` - 8 edges
9. `Gaps and Security Fixes Migration` - 7 edges
10. `User Blocks Database Table` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Schema Sync Migration` --references--> `Canonical Product and Architecture Spec`  [INFERRED]
  supabase/migrations/006_schema_sync.sql → STACK.md
- `RLS Policy Integration Tests` --implements--> `RLS Testing Against Real Database`  [INFERRED]
  src/__tests__/features/auth/rls.test.ts → CLAUDE.md
- `Auth Store Unit Tests` --references--> `RLS Exclusion via User Blocks Pattern`  [INFERRED]
  src/__tests__/stores/auth.store.test.ts → STACK.md
- `Comments Migration` --references--> `Dev Blockers and Inconsistencies Log`  [INFERRED]
  supabase/migrations/003_comments.sql → test.md
- `Notification Preferences Migration` --implements--> `RLS Policies as SQL in Migrations Rule`  [EXTRACTED]
  supabase/migrations/004_notification_preferences.sql → STACK.md

## Hyperedges (group relationships)
- **User Onboarding Flow** — app_auth_index_tsx, app_auth_register_tsx, app_onboarding_genres_tsx, app_onboarding_goal_tsx, app_onboarding_username_tsx [INFERRED 0.95]
- **Auth Screen Group** — app_auth_index_tsx, app_auth_login_tsx, app_auth_register_tsx, app_auth_success_tsx, app_auth_verify_email_tsx [INFERRED 0.95]
- **Canonical Documentation Set** — doc_STACK_md, doc_analisis_md, doc_gaps_produccion_md, doc_inicio_md [INFERRED 0.85]
- **MVP Database Schema (Core Tables)** — table_users, table_books, table_user_books, table_reviews, table_activity_feed, table_follows, table_lists, table_comments, table_user_blocks, table_reports [INFERRED 0.95]
- **Auth Feature Component Library** — component_PrimaryButton, component_AuthField, component_BackBar, component_GhostButton, component_CodeInput, component_BookFan, component_Wordmark, component_StepBar, component_OnboardHeader [INFERRED 0.85]
- **Auth Data Flow (Screen â†’ Hook â†’ Supabase)** — app_auth_login_tsx, app_auth_register_tsx, app_auth_verify_email_tsx, hook_useLogin, hook_useRegister, hook_useVerifyPasswordResetCode, hook_useRequestResetPassword, lib_supabase, store_useAuthStore [INFERRED 0.95]
- **Auth Mutation Hooks** — useLogin, useLogout, useRegister, useRequestResetPassword, useVerifyPasswordResetCode, useUpdatePassword [INFERRED 0.95]
- **Theme-Aware Auth Components** — AuthField, BookFan, CodeInput, StepBar [INFERRED 0.95]
- **Reset Password Sequential Flow** — useRequestResetPassword, useVerifyPasswordResetCode, useUpdatePassword [EXTRACTED 1.00]
- **Auth Components Barrel Export** — AuthComponentsBarrel, AuthField, BackBar, BookFan, CodeInput, GhostButton, OnboardHeader, PrimaryButton, StepBar, Wordmark [EXTRACTED 1.00]

## Communities (51 total, 23 thin omitted)

### Community 0 - "Product Architecture & Schema"
Cohesion: 0.09
Nodes (40): Project Guidance Document, Canonical Product and Architecture Spec, UserProfile Domain Type, Account Deletion Requests Table, Activity Feed Database Table, Schema Gap Analysis (Graph Output), App Routes Only Rule, Auth Store Unit Tests (+32 more)

### Community 1 - "Security & Production Readiness"
Cohesion: 0.06
Nodes (36): Row Level Security Policies, delete-account Edge Function (30-day deferred), STACK.md â€” Canonical Product and DB Spec, docs/analisis.md â€” Schema Gap Analysis, docs/gaps-produccion.md â€” Production Readiness Gaps, Auth Store as Supabase onAuthStateChange Projection, Store Compliance Requirements, Cursor-Based Infinite Scroll Pagination (+28 more)

### Community 2 - "Onboarding Flow UI"
Cohesion: 0.1
Nodes (22): SuccessScreen(), AuthField(), Props, BookFan(), BOOKS, styles, CodeInput(), Props (+14 more)

### Community 3 - "Auth Screens (Login/Register)"
Cohesion: 0.12
Nodes (23): app/(auth)/onboarding/genres.tsx â€” Genre Selection, app/(auth)/onboarding/goal.tsx â€” Reading Goal Selection, app/(auth)/onboarding/username.tsx â€” Username Selection, googleStyles, LoginScreen(), RegisterScreen(), VerifyEmailScreen(), AuthField (auth form input) (+15 more)

### Community 4 - "App Layout & Routing"
Cohesion: 0.13
Nodes (17): AuthGate(), RootLayout(), FlowGuard(), LoginParams, useLogout(), RegisterParams, supportedLocales, queryClient (+9 more)

### Community 5 - "Supabase Types & Test Utils"
Cohesion: 0.15
Nodes (14): adminClient, createTestUser(), createUserClient(), CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema (+6 more)

### Community 6 - "Auth Flow Architecture Patterns"
Cohesion: 0.15
Nodes (18): Auth Flow Pattern, State Management Architecture, AuthGate (app/_layout.tsx), FlowGuard (auth layout guard), RootLayout (app/_layout.tsx), Auth Gate, Root Layout, focusManager (TanStack Query) (+10 more)

### Community 7 - "Cross-Cutting Patterns (Stores/Mutations)"
Cohesion: 0.25
Nodes (16): ExpoSecureStoreAdapter, PrimaryButton, authStore, FeedScreen, Auth Mutation Hook Pattern, Platform-Aware Storage Pattern, Sequential Auth Flow Pattern, supabaseClient (+8 more)

### Community 8 - "Utility Functions"
Cohesion: 0.15
Nodes (3): formatDate(), formatRelativeTime(), StarState

### Community 9 - "Error Handling & Toast System"
Cohesion: 0.24
Nodes (7): Toast, UIState, useUIStore, AppError, AppErrorCode, SUPABASE_AUTH_MESSAGES, toAppError()

### Community 10 - "Typography System"
Cohesion: 0.33
Nodes (5): fontFamily, fonts, fontSize, letterSpacing, lineHeight

### Community 11 - "Theme-Aware Components"
Cohesion: 0.6
Nodes (6): AuthField, BookFan, CodeInput, StepBar, Theme-Aware Component Pattern, useColors

### Community 12 - "Theme Design System"
Cohesion: 0.6
Nodes (5): Theme Design System, Metro Config, Tailwind Config, Theme Colors, Theme Typography

### Community 13 - "Metro Configuration"
Cohesion: 0.5
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

### Community 14 - "Color Tokens"
Cohesion: 0.5
Nodes (3): fixed, rawDark, rawLight

### Community 15 - "App Assets & Icons"
Cohesion: 0.67
Nodes (4): Android Adaptive Icon Format, Android Adaptive App Icon (PNG), Expo Standard Asset, Lexa Reads App

## Knowledge Gaps
- **130 isolated node(s):** `{ getDefaultConfig }`, `{ withNativeWind }`, `config`, `ExpoSecureStoreAdapter`, `StarState` (+125 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `Onboarding Flow UI` to `Auth Screens (Login/Register)`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `useAuthStore` connect `App Layout & Routing` to `Auth Screens (Login/Register)`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `STACK.md â€” Canonical Product and DB Spec` (e.g. with `docs/analisis.md â€” Schema Gap Analysis` and `docs/gaps-produccion.md â€” Production Readiness Gaps`) actually correct?**
  _`STACK.md â€” Canonical Product and DB Spec` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Canonical Product and Architecture Spec` (e.g. with `Schema Sync Migration` and `App Store Compliance Requirements`) actually correct?**
  _`Canonical Product and Architecture Spec` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `{ getDefaultConfig }`, `{ withNativeWind }`, `config` to the rest of the system?**
  _130 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Product Architecture & Schema` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Security & Production Readiness` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._