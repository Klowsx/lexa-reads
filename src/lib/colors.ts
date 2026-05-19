import { useColorScheme } from "react-native";

const light = {
  t3:      "#9E9488",
  accent:  "#C4783A",
  error:   "#C43A3A",
  warning: "#C49A20",
  success: "#5CAF7E",
} as const;

const dark = {
  t3:      "#6A635C",
  accent:  "#B8445A",
  error:   "#C43A3A",
  warning: "#C49A20",
  success: "#5CAF7E",
} as const;

export type ThemeColors = {
  t3: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
};

export function useColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === "dark" ? dark : light;
}
