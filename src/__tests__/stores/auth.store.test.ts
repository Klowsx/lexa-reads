import { useAuthStore } from '~/stores/auth.store'
import type { Session, User } from '@supabase/supabase-js'

const mockUser = { id: 'user-1', email: 'test@example.com' } as User
const mockSession = { user: mockUser, access_token: 'token' } as Session

beforeEach(() => {
  useAuthStore.setState({
    session: null,
    user: null,
    isRecoveryMode: false,
    isRecoveryPasswordUpdated: false
  })
})

describe('useAuthStore', () => {
  it('elimina el contexto de recuperación al cerrar o reemplazar el acceso normal', () => {
    const store = useAuthStore.getState()
    store.setSession(mockSession)
    store.setRecoveryMode(true)
    store.setRecoveryPasswordUpdated(true)
    store.setSession(null)
    expect(useAuthStore.getState().isRecoveryMode).toBe(false)
    expect(useAuthStore.getState().isRecoveryPasswordUpdated).toBe(false)
    store.setRecoveryMode(true)
    store.setRecoveryPasswordUpdated(true)
    store.setRecoveryMode(false)
    expect(useAuthStore.getState().isRecoveryPasswordUpdated).toBe(false)
  })
  it('inicia con session y user en null', () => {
    const { session, user } = useAuthStore.getState()
    expect(session).toBeNull()
    expect(user).toBeNull()
  })

  it('setSession con una sesión válida proyecta el user', () => {
    useAuthStore.getState().setSession(mockSession)
    const { session, user } = useAuthStore.getState()
    expect(session).toBe(mockSession)
    expect(user).toBe(mockUser)
  })

  it('setSession(null) limpia session y user', () => {
    useAuthStore.getState().setSession(mockSession)
    useAuthStore.getState().setSession(null)
    const { session, user } = useAuthStore.getState()
    expect(session).toBeNull()
    expect(user).toBeNull()
  })
})
