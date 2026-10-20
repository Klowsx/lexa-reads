import { createClient, processLock } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import { authStorage } from './auth-storage'
import type { Database } from '~/types/database'

// Delega la persistencia al almacén seguro y procesa los enlaces una sola vez desde el callback.
export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      ...(Platform.OS !== 'web' ? { lock: processLock } : {})
    }
  }
)
