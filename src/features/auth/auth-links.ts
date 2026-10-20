export type AuthFlow = 'signup' | 'recovery' | 'oauth'
export type AuthCallback = {
  flow: AuthFlow
  code: string | null
  tokenHash: string | null
  tokenType: 'signup' | 'email' | 'recovery'
  accessToken: string | null
  refreshToken: string | null
}

// Lee únicamente retornos de autenticación y combina correctamente consulta y fragmento.
export function parseAuthCallback(url: string): AuthCallback {
  const parsed = new URL(url)
  const path = (parsed.hostname + parsed.pathname).replace(/\/+$/, '')
  if (
    !['lexa:', 'exp:', 'exps:', 'https:', 'http:'].includes(parsed.protocol) ||
    !(
      path.endsWith('/auth-callback') ||
      path === 'auth-callback' ||
      path.endsWith('/auth/callback') ||
      path === 'auth/callback'
    )
  ) {
    throw new Error('Este enlace no es un retorno de autenticación de Lexa.')
  }
  const params = new URLSearchParams(parsed.search)
  // Expo Router web puede mover la consulta detrás del fragmento al normalizar el primer enlace.
  const hash = parsed.hash.replace(/^#/, '')
  const queryIndex = hash.indexOf('?')
  if (queryIndex >= 0) {
    new URLSearchParams(hash.slice(queryIndex + 1)).forEach((value, key) =>
      params.set(key, value)
    )
  }
  new URLSearchParams(
    queryIndex >= 0 ? hash.slice(0, queryIndex) : hash
  ).forEach((value, key) => params.set(key, value))
  if (
    params.has('error') ||
    params.has('error_code') ||
    params.has('error_description')
  ) {
    throw new Error('El enlace venció o ya fue utilizado. Solicita uno nuevo.')
  }
  const type = params.get('type')
  const requestedFlow = params.get('flow')
  const typedFlow =
    type === 'recovery'
      ? 'recovery'
      : type === 'signup' || type === 'email'
        ? 'signup'
        : null
  if (
    (requestedFlow &&
      !['signup', 'recovery', 'oauth'].includes(requestedFlow)) ||
    (type && !typedFlow) ||
    (typedFlow && requestedFlow && typedFlow !== requestedFlow)
  ) {
    throw new Error('El enlace no corresponde a este flujo de acceso.')
  }
  const flow = (typedFlow ?? requestedFlow ?? 'signup') as AuthFlow
  const result = {
    flow,
    code: params.get('code'),
    tokenHash: params.get('token_hash'),
    tokenType:
      type === 'email'
        ? ('email' as const)
        : flow === 'recovery'
          ? ('recovery' as const)
          : ('signup' as const),
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token')
  }
  if (
    !result.code &&
    !result.tokenHash &&
    !(result.accessToken && result.refreshToken)
  ) {
    throw new Error('El enlace está incompleto. Solicita uno nuevo.')
  }
  return result
}
