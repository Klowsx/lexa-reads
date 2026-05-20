# OAuth con Google — Setup Guide

## 1. Supabase Dashboard

- **Authentication → Providers → Google** → activar
- Pegar `Client ID` y `Client Secret` de Google Cloud Console
- En **Redirect URLs** agregar:
  - `exp://localhost:8081/--/auth/callback` (Expo Go, dev)
  - `lexa://auth/callback` (standalone / producción)

## 2. Google Cloud Console

1. Crear proyecto en [console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Credentials → **Create OAuth 2.0 Client ID** (tipo: Web)
3. En "Authorized redirect URIs" agregar:
   `https://<tu-project-ref>.supabase.co/auth/v1/callback`

## 3. app.json — URL scheme

```json
{
  "expo": {
    "scheme": "lexa"
  }
}
```

## 4. Paquetes

```bash
pnpm add expo-web-browser expo-auth-session
```

## 5. Hook — `src/features/auth/hooks/useGoogleOAuth.ts`

```ts
import { makeRedirectUri } from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@/lib/supabase'

WebBrowser.maybeCompleteAuthSession()

export function useGoogleOAuth() {
  const redirectTo = makeRedirectUri({ scheme: 'lexa', path: 'auth/callback' })

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    })
    if (error || !data.url) throw error

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

    if (result.type === 'success') {
      const code = new URL(result.url).searchParams.get('code')
      if (code) await supabase.auth.exchangeCodeForSession(code)
    }
  }

  return { signIn }
}
```

## 6. `login.tsx` — conectar el botón

```tsx
import { useGoogleOAuth } from '@/features/auth/hooks/useGoogleOAuth'

const { signIn: signInWithGoogle } = useGoogleOAuth()

<PrimaryButton onPress={signInWithGoogle} label="Continuar con Google" />
```

## Flujo en runtime

```
Usuario toca botón
  → signInWithOAuth devuelve URL de Google
  → WebBrowser abre Google login
  → Google redirige → Supabase callback → lexa://auth/callback?code=...
  → exchangeCodeForSession(code)
  → onAuthStateChange dispara SIGNED_IN
  → AuthGate navega a /(tabs)/feed
```

## Edge cases

- **Usuario cancela:** `WebBrowser` retorna `{ type: 'dismiss' }`, no hacer nada
- **Email ya existe:** Supabase linkea la cuenta automáticamente (configurable en Auth → Settings → "Allow linking multiple auth providers")
- **Expo Go dev:** usar la URL `exp://` en Supabase Redirect URLs, no `lexa://`
