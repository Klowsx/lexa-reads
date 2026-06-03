import { type ReactNode } from "react";
import { ErrorState } from "./ErrorState";

interface QueryLike<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch?: () => void;
}

interface QueryBoundaryProps<T> {
  query: QueryLike<T>;
  /** UI mientras carga (skeleton del feature). */
  skeleton?: ReactNode;
  /** Render del contenido cuando hay datos. */
  children: (data: T) => ReactNode;
}

/**
 * Wrapper estándar para pantallas con datos (CLAUDE.md / UX-2).
 * Centraliza loading → error → data para no repetir el patrón ad-hoc en cada
 * pantalla. El manejo de "vacío" queda en el children (depende del dominio).
 */
export function QueryBoundary<T>({ query, skeleton, children }: QueryBoundaryProps<T>) {
  if (query.isLoading) return <>{skeleton ?? null}</>;
  if (query.isError) return <ErrorState onRetry={query.refetch} />;
  if (query.data === undefined) return <>{skeleton ?? null}</>;
  return <>{children(query.data)}</>;
}
