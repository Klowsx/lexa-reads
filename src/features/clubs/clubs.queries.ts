import { queryOptions } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase'

// supabase-js no infiere correctamente los nested foreign-key selects
// (p. ej. `current_book:books!reading_clubs_current_book_id_fkey(...)`).
// El tipado de database.ts es correcto pero el cliente no lo resuelve en
// runtime → usamos `as any` localmente, devolviendo tipos de dominio
// definidos manualmente.
const sb = supabase as any

export type ClubVisibility = 'public' | 'private'
export type ClubMemberState = 'active' | 'pending' | 'invited' | 'banned'
export type ClubRole = 'owner' | 'moderator' | 'member'

export type ClubListItem = {
  id: string
  name: string
  slug: string
  description: string | null
  visibility: ClubVisibility
  members_count: number
  current_book: { id: string; title: string; cover_url: string | null } | null
}

export type ClubMemberRow = {
  user_id: string
  role: ClubRole
  state: ClubMemberState
  user: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export type ClubDetail = ClubListItem & {
  created_by: string
  conversationId: string | null
  myState: ClubMemberState | null
  myRole: ClubRole | null
}

function one<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

const CLUB_COLS = `
  id, name, slug, description, visibility, members_count, created_by, current_book_id,
  current_book:books!reading_clubs_current_book_id_fkey(id, title, cover_url)
`.trim()

function mapClub(row: any): ClubListItem & { created_by: string } {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    visibility: row.visibility,
    members_count: row.members_count ?? 0,
    created_by: row.created_by,
    current_book: one(row.current_book)
  }
}

// ── Descubrir / mis clubes ──────────────────────────────────────

async function fetchDiscoverClubs(): Promise<ClubListItem[]> {
  const { data, error } = await sb
    .from('reading_clubs')
    .select(CLUB_COLS)
    .eq('visibility', 'public')
    .order('members_count', { ascending: false })
    .limit(40)
  if (error) throw error
  return (data ?? []).map(mapClub)
}

async function fetchMyClubs(userId: string): Promise<ClubListItem[]> {
  const { data, error } = await sb
    .from('reading_club_members')
    .select(`state, club:reading_clubs!inner(${CLUB_COLS})`)
    .eq('user_id', userId)
    .eq('state', 'active')
  if (error) throw error
  return (data ?? []).map((r: any) => mapClub(r.club))
}

export const discoverClubsQueryOptions = () =>
  queryOptions({
    queryKey: ['clubs', 'discover'],
    queryFn: fetchDiscoverClubs,
    staleTime: 1000 * 60
  })

export const myClubsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['clubs', 'mine', userId],
    queryFn: () => fetchMyClubs(userId),
    enabled: !!userId
  })

// ── Detalle de un club ──────────────────────────────────────────

// Consulta la membresía sin convertir errores de red en una falsa ausencia de acceso o de chat.
async function fetchClub(
  slug: string,
  userId: string
): Promise<ClubDetail | null> {
  const { data, error } = await sb
    .from('reading_clubs')
    .select(CLUB_COLS)
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const base = mapClub(data)

  const { data: conv, error: conversationError } = await sb
    .from('conversations')
    .select('id')
    .eq('kind', 'club')
    .eq('club_id', data.id)
    .maybeSingle()
  if (conversationError) throw conversationError

  let myState: ClubMemberState | null = null
  let myRole: ClubRole | null = null
  if (userId) {
    const { data: mem, error: membershipError } = await sb
      .from('reading_club_members')
      .select('state, role')
      .eq('club_id', data.id)
      .eq('user_id', userId)
      .maybeSingle()
    if (membershipError) throw membershipError
    myState = mem?.state ?? null
    myRole = mem?.role ?? null
  }

  return { ...base, conversationId: conv?.id ?? null, myState, myRole }
}

export const clubQueryOptions = (slug: string, userId: string) =>
  queryOptions({
    queryKey: ['clubs', 'detail', slug, userId],
    queryFn: () => fetchClub(slug, userId),
    enabled: !!slug
  })

// ── Miembros ────────────────────────────────────────────────────

async function fetchClubMembers(clubId: string): Promise<ClubMemberRow[]> {
  const { data, error } = await sb
    .from('reading_club_members')
    .select(
      `user_id, role, state,
       user:users!reading_club_members_user_id_fkey(id, username, display_name, avatar_url)`
    )
    .eq('club_id', clubId)
    .order('role', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r: any) => ({ ...r, user: one(r.user) }))
}

export const clubMembersQueryOptions = (clubId: string) =>
  queryOptions({
    queryKey: ['clubs', 'members', clubId],
    queryFn: () => fetchClubMembers(clubId),
    enabled: !!clubId
  })

// ── Acciones ────────────────────────────────────────────────────

function generateClubSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return `${base || 'club'}-${Date.now().toString(36)}`
}

export async function createClubFn(params: {
  userId: string
  name: string
  description?: string
  visibility: ClubVisibility
}): Promise<{ slug: string }> {
  const slug = generateClubSlug(params.name)
  const { error } = await sb.from('reading_clubs').insert({
    name: params.name,
    description: params.description ?? null,
    visibility: params.visibility,
    created_by: params.userId,
    slug
  })
  if (error) throw error
  // El trigger handle_new_club crea la membresía owner + la conversación.
  return { slug }
}

export async function joinClubFn(
  clubId: string,
  userId: string
): Promise<void> {
  const { error } = await sb
    .from('reading_club_members')
    .insert({ club_id: clubId, user_id: userId })
  if (error) throw error
}

export async function leaveClubFn(
  clubId: string,
  userId: string
): Promise<void> {
  const { error } = await sb
    .from('reading_club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function acceptClubInviteFn(clubId: string): Promise<void> {
  const { error } = await sb.rpc('accept_club_invite', { p_club: clubId })
  if (error) throw error
}

export async function approveClubMemberFn(
  clubId: string,
  userId: string
): Promise<void> {
  const { error } = await sb.rpc('approve_club_member', {
    p_club: clubId,
    p_user: userId
  })
  if (error) throw error
}

export async function banClubMemberFn(
  clubId: string,
  userId: string
): Promise<void> {
  const { error } = await sb.rpc('ban_club_member', {
    p_club: clubId,
    p_user: userId
  })
  if (error) throw error
}
