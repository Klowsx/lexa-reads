// Punto único de captura de errores (O-1).
//
// Decisión: NO se usa Sentry. PostHog ya está en dependencias; cuando se
// inicialice un cliente PostHog, registralo aquí con `setCrashReporter` y
// `logError` lo reenviará. Mientras tanto, los errores se loguean en consola
// (visibles en dev y en logs de crash de la plataforma).

export type CrashReporter = (error: unknown, context?: Record<string, unknown>) => void;

let reporter: CrashReporter | null = null;

/**
 * Conecta un reporter real (p. ej. `posthog.captureException`) en el arranque:
 *   setCrashReporter((e, ctx) => posthog.captureException(e, ctx));
 */
export function setCrashReporter(fn: CrashReporter | null) {
  reporter = fn;
}

export function logError(error: unknown, context?: Record<string, unknown>) {
  // Siempre dejamos rastro en consola.
  // eslint-disable-next-line no-console
  console.error("[lexa] error capturado:", error, context ?? "");
  try {
    reporter?.(error, context);
  } catch {
    // Nunca dejar que el propio reporting tire la app.
  }
}
