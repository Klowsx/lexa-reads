import { normalizeUsername, USERNAME_PATTERN } from "~/lib/username";

describe("normalizeUsername", () => {
  // Normaliza mayúsculas, espacios y caracteres no permitidos antes de consultar el servidor.
  it("conserva solo caracteres permitidos en minúscula", () => {
    expect(normalizeUsername("  Ana Pérez_01! ")).toBe("anaprez_01");
  });

  // Mantiene el límite que también validan la interfaz y la función de Supabase.
  it("limita el nombre a 30 caracteres", () => {
    const username = normalizeUsername("a".repeat(40));

    expect(username).toHaveLength(30);
    expect(USERNAME_PATTERN.test(username)).toBe(true);
  });
});
