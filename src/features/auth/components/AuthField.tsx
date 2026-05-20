import { useState } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { isValidElement } from "react";
import type { ReactNode } from "react";
import { useColors } from "@/src/lib/colors";

type Props = {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words" | "sentences";
  icon?: LucideIcon | ReactNode;
  trailing?: ReactNode;
  error?: string;
  // Estos dos props activan el autofill nativo y la integración con gestores de contraseñas.
  // textContentType es solo para iOS; autoComplete cubre Android y web.
  textContentType?: TextInputProps["textContentType"];
  autoComplete?: TextInputProps["autoComplete"];
};

export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "sentences",
  icon,
  trailing,
  error,
  textContentType,
  autoComplete,
}: Props) {
  const [focused, setFocused] = useState(false);
  const c = useColors();

  const focusedBorder = `rgba(${parseInt(c.accent.slice(1, 3), 16)},${parseInt(c.accent.slice(3, 5), 16)},${parseInt(c.accent.slice(5, 7), 16)},0.55)`;
  const borderColor = error ? c.error : focused ? focusedBorder : undefined;

  // forwardRef components (como LucideIcon) son objetos, no funciones
  const isComponentType =
    typeof icon === "function" ||
    (icon != null && typeof icon === "object" && !isValidElement(icon));
  const IconComponent = isComponentType ? (icon as LucideIcon) : null;
  const iconNode = isComponentType ? null : (icon as ReactNode);

  return (
    <View className="mb-[14px]">
      {label && (
        <Text className="text-xs text-t2 font-body-sb tracking-wide uppercase mb-1.5">
          {label}
        </Text>
      )}
      <View
        className="flex-row items-center gap-2.5 bg-surface rounded-md px-3.5 py-[13px] border border-border"
        style={borderColor ? { borderColor } : undefined}
      >
        {(IconComponent || iconNode) && (
          <View
            className={`shrink-0 ${focused ? "opacity-100" : "opacity-60"}`}
          >
            {IconComponent ? <IconComponent size={16} color={c.t3} /> : iconNode}
          </View>
        )}
        <TextInput
          className="flex-1 text-text text-[14px] font-body min-w-0"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.t3}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          textContentType={textContentType}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {trailing && <View className="shrink-0">{trailing}</View>}
      </View>
      {error && (
        <Text className="text-xs text-error mt-1 ml-0.5 font-body">
          {error}
        </Text>
      )}
    </View>
  );
}
