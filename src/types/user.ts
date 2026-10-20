import type { Tables } from './database'

export type UserProfile = Pick<
  Tables<'users'>,
  | 'id'
  | 'username'
  | 'display_name'
  | 'avatar_url'
  | 'bio'
  | 'favorite_genres'
  | 'books_read_count'
  | 'reviews_count'
  | 'followers_count'
  | 'following_count'
  | 'is_private'
  | 'reading_goal'
  | 'reading_goal_year'
  | 'onboarding_completed'
  | 'onboarding_step'
  | 'created_at'
>

export type ProfileData = UserProfile & {
  /** null = no sigue, 'pending' = solicitud enviada, 'accepted' = siguiendo */
  follow_status: 'accepted' | 'pending' | null
  is_following: boolean
  is_blocked_by_me: boolean
}

export type UpdateProfileData = {
  display_name?: string
  bio?: string | null
  favorite_genres?: string[] | null
  is_private?: boolean
}

export type OnboardingPreferences = {
  favoriteGenres: string[]
  readingGoal: number
  nextStep: 2 | 3
}
