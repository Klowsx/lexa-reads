import { useEffect, useState } from 'react'
import { AppState, Platform } from 'react-native'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '~/lib/supabase'
import { queryClient } from '~/lib/query-client'
import { useAuthStore } from '~/stores/auth.store'
import { restoreAuthSession } from '../session'
import { readRecoveryContext, saveRecoveryContext } from '../recovery-context'

// Coordina arranque, renovación y cierre de sesión desde una única suscripción.
export function useAuthSession() {
  const [attempt, setAttempt] = useState(0)
  const [restoreError, setRestoreError] = useState(false)
  const isLoading = useAuthStore((state) => state.isLoading)

  useEffect(() => {
    let active = true
    let restoring = true
    let revision = 0
    useAuthStore.getState().setLoading(true)
    setRestoreError(false)

    // Vacía datos privados al cambiar de cuenta o cerrar una sesión desde otro cliente.
    function projectSession(session: Session | null) {
      const store = useAuthStore.getState()
      if (store.user?.id !== session?.user.id) {
        queryClient.clear()
        store.setRecoveryMode(false)
      }
      store.setSession(session)
      store.setLoading(false)
      setRestoreError(false)
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event === 'INITIAL_SESSION') return
      revision++
      // El arranque debe leer el contexto de recuperación antes de abrir la aplicación.
      if (restoring && event !== 'SIGNED_OUT') return
      restoring = false
      projectSession(session)
      if (event === 'PASSWORD_RECOVERY' && session) {
        useAuthStore.getState().setRecoveryMode(true)
        useAuthStore.getState().setRecoveryPasswordUpdated(false)
        void saveRecoveryContext(session.user.id).catch(() => {
          if (active) setRestoreError(true)
        })
      } else if (event === 'SIGNED_OUT') {
        void saveRecoveryContext(null).catch(() => {
          if (active) setRestoreError(true)
        })
      }
    })

    // Evita que una lectura inicial atrasada sobrescriba un ingreso o cierre de sesión reciente.
    async function restore() {
      const initialRevision = revision
      try {
        const session = await restoreAuthSession()
        const recovery = session
          ? await readRecoveryContext(session.user.id)
          : { isRecoveryMode: false, passwordUpdated: false }
        if (!active) return
        if (revision !== initialRevision) {
          setAttempt((value) => value + 1)
          return
        }
        if (!session) await saveRecoveryContext(null)
        if (!active) return
        if (revision !== initialRevision) {
          setAttempt((value) => value + 1)
          return
        }
        restoring = false
        projectSession(session)
        useAuthStore.getState().setRecoveryMode(recovery.isRecoveryMode)
        useAuthStore
          .getState()
          .setRecoveryPasswordUpdated(recovery.passwordUpdated)
      } catch {
        if (!active) return
        if (revision !== initialRevision) setAttempt((value) => value + 1)
        else setRestoreError(true)
      }
    }
    void restore()
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [attempt])

  useEffect(() => {
    if (Platform.OS === 'web') return
    // Renueva tokens mientras la app está activa y evita temporizadores en segundo plano.
    function updateRefresh(state: string) {
      if (state === 'active') void supabase.auth.startAutoRefresh()
      else void supabase.auth.stopAutoRefresh()
    }
    updateRefresh(AppState.currentState)
    const subscription = AppState.addEventListener('change', updateRefresh)
    return () => {
      subscription.remove()
      void supabase.auth.stopAutoRefresh()
    }
  }, [])

  // Reintenta la comprobación sin borrar las credenciales cifradas después de un fallo temporal.
  function retryRestore() {
    setAttempt((value) => value + 1)
  }

  return { isLoading, restoreError, retryRestore }
}
