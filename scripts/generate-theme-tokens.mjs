import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const tokensPath = resolve(projectRoot, "src/theme/tokens.json");
const themeModulePath = resolve(projectRoot, "src/theme/colors.ts");
const generatedCssPath = resolve(projectRoot, "src/theme/generated-colors.css");
const checkOnly = process.argv.includes("--check");

// Convierte un color hexadecimal a los canales RGB que consume NativeWind.
function toRgbChannels(hex) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return `${value >> 16} ${(value >> 8) & 255} ${value & 255}`;
}

// Construye las variables CSS para que las clases de NativeWind usen los mismos tokens.
function renderCss(tokens) {
  const variablesFor = (theme) =>
    Object.entries(theme)
      .map(([name, value]) => `    --color-${name}: ${toRgbChannels(value)};`)
      .join("\n");

  const fixed = tokens.fixed;
  const fixedVariables = [
    ["accent", fixed.accent],
    ["star", fixed.star],
    ["error", fixed.error],
    ["warning", fixed.warning],
    ["success", fixed.success],
    ["status-reading", fixed.status.reading],
    ["status-read", fixed.status.read],
    ["status-want", fixed.status.want],
    ["status-abandoned", fixed.status.abandoned]
  ]
    .map(([name, value]) => `    --color-${name}: ${toRgbChannels(value)};`)
    .join("\n");

  return `/* Este archivo se genera desde src/theme/tokens.json. No editar manualmente. */\n@layer base {\n  :root {\n${variablesFor(tokens.themes.light)}\n${fixedVariables}\n  }\n\n  .dark {\n${variablesFor(tokens.themes.dark)}\n  }\n}\n`;
}

// Genera el módulo TypeScript para estilos nativos e inline de React Native.
function renderThemeModule(tokens) {
  return `// Este archivo se genera desde src/theme/tokens.json. No editar manualmente.\nimport { useColorScheme } from 'react-native';\n\n// Valores para StyleSheet.create() o cuando no hay acceso a clases NativeWind.\nexport const rawDark = ${JSON.stringify(tokens.themes.dark, null, 2)} as const;\n\nexport const rawLight = ${JSON.stringify(tokens.themes.light, null, 2)} as const;\n\n// Colores semánticos que no cambian entre tema claro y oscuro.\nexport const fixed = ${JSON.stringify(tokens.fixed, null, 2)} as const;\n\nexport type AppColors = typeof rawDark & typeof fixed;\n\n// Devuelve la paleta del tema activo junto con los colores semánticos fijos.\nexport function useColors(): AppColors {\n  const scheme = useColorScheme() ?? 'light';\n  const raw = scheme === 'dark' ? rawDark : rawLight;\n  return { ...raw, ...fixed } as AppColors;\n}\n\n// Convierte un hexadecimal en rgba para usar transparencias sin duplicar colores.\nexport function alpha(hex: string, opacity: number): string {\n  const numericColor = Number.parseInt(hex.replace('#', ''), 16);\n  return 'rgba(' + (numericColor >> 16) + ',' + ((numericColor >> 8) & 255) + ',' + (numericColor & 255) + ',' + opacity + ')';\n}\n`;
}

// Escribe una salida solo cuando cambió y permite verificarla en integración continua.
function syncGeneratedFile(path, content) {
  let currentContent = "";
  try {
    currentContent = readFileSync(path, "utf8");
  } catch {
    // La primera ejecución crea el artefacto generado.
  }

  if (currentContent === content) return true;
  if (checkOnly) return false;

  writeFileSync(path, content, "utf8");
  return true;
}

const tokens = JSON.parse(readFileSync(tokensPath, "utf8"));
const isThemeModuleCurrent = syncGeneratedFile(themeModulePath, renderThemeModule(tokens));
const isCssCurrent = syncGeneratedFile(generatedCssPath, renderCss(tokens));

if (!isThemeModuleCurrent || !isCssCurrent) {
  console.error("Los archivos de tema están desactualizados. Ejecuta: pnpm gen:theme");
  process.exit(1);
}

console.log(checkOnly ? "Tokens de tema verificados." : "Tokens de tema generados.");
