# Archivos de asociación de deep links (A-3)

`app.json` declara universal links / app links a `lexareads.app`:
- iOS: `associatedDomains: ["applinks:lexareads.app"]`
- Android: intent filters `https://lexareads.app/{book,user,list}`

Para que los links abran la app (en vez de fallar en silencio), estos dos
archivos **deben estar publicados en el dominio** `lexareads.app`, servidos por
HTTPS, con `Content-Type: application/json` y **sin redirecciones**:

- `https://lexareads.app/.well-known/apple-app-site-association`  (sin extensión)
- `https://lexareads.app/.well-known/assetlinks.json`

## Pendiente antes del submit

1. **iOS** — reemplazar `TEAMID` en `apple-app-site-association` por el Apple
   Team ID real (Apple Developer → Membership) → queda `ABCDE12345.com.lexareads.app`.
2. **Android** — reemplazar `REPLACE_WITH_SHA256_FINGERPRINT` por la huella
   SHA-256 del certificado de firma. Con EAS:
   `eas credentials` (Android → ver el SHA-256), o desde Play Console →
   App integrity → Firma de apps.
3. Publicar ambos archivos en el dominio y verificar:
   - iOS: la app de Apple `swcd` / `https://app-site-association.cdn-apple.com/a/v1/lexareads.app`
   - Android: `https://developers.google.com/digital-asset-links/tools/generator`
