import { parseAuthCallback } from '~/features/auth/auth-links'

describe('Retornos de correo', () => {
  it('acepta la URL normalizada por Expo sin confundir el propósito del enlace', () => {
    expect(
      parseAuthCallback(
        'http://localhost:8082/auth-callback#access_token=a&refresh_token=r&type=recovery?flow=recovery'
      )
    ).toMatchObject({ flow: 'recovery', accessToken: 'a', refreshToken: 'r' })
  })
  it('combina el propósito de la consulta con los tokens del fragmento', () => {
    expect(
      parseAuthCallback(
        'lexa://auth-callback?flow=recovery#access_token=access&refresh_token=refresh&type=recovery'
      )
    ).toMatchObject({
      flow: 'recovery',
      accessToken: 'access',
      refreshToken: 'refresh'
    })
  })
  it('separa la confirmación de la recuperación', () => {
    expect(
      parseAuthCallback(
        'https://lexareads.app/auth-callback?flow=signup#access_token=a&refresh_token=r&type=signup'
      ).flow
    ).toBe('signup')
  })
  it('acepta PKCE y el retorno de desarrollo de Expo', () => {
    expect(
      parseAuthCallback(
        'exp://127.0.0.1:8081/--/auth-callback?flow=signup&code=one-use'
      ).code
    ).toBe('one-use')
  })
  it('acepta una plantilla con token_hash y conserva el tipo de verificación', () => {
    expect(
      parseAuthCallback('lexa://auth-callback?token_hash=hash&type=email')
    ).toMatchObject({ flow: 'signup', tokenHash: 'hash', tokenType: 'email' })
  })
  it('conserva los retornos anteriores de proveedores externos', () => {
    expect(
      parseAuthCallback(
        'lexa://auth/callback?flow=oauth#access_token=a&refresh_token=r'
      ).flow
    ).toBe('oauth')
  })
  it.each([
    'lexa://auth-callback?flow=recovery#access_token=a',
    'lexa://auth-callback?flow=recovery&type=signup&code=c',
    'lexa://auth-callback?type=invite&token_hash=h',
    'lexa://auth-callback#error=access_denied&error_description=expired',
    'lexa://book/123?code=c',
    'javascript:auth-callback?code=c'
  ])('rechaza un enlace inválido sin convertirlo en una sesión: %s', (url) => {
    expect(() => parseAuthCallback(url)).toThrow()
  })
})
