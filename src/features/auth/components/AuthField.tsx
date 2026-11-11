import { useState, isValidElement } from 'react'
import { Text, TextInput, TextInputProps, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

import type { ReactNode } from 'react'
import { useColors } from '~/theme/colors'

type Props = {
  label?: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address'
  autoCapitalize?: 'none' | 'words' | 'sentences'
  icon?: LucideIcon | ReactNode
  trailing?: ReactNode
  error?: string
  // Estos dos props activan el autofill nativo y la integración con gestores de contraseñas.
  // textContentType es solo para iOS; autoComplete cubre Android y web.
  textContentType?: TextInputProps['textContentType']
  autoComplete?: TextInputProps['autoComplete']
  accessibilityLabel?: string
}

// Muestra un campo de autenticación consistente, accesible y adaptable a ambos temas.
export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  icon,
  trailing,
  error,
  textContentType,
  autoComplete,
  accessibilityLabel
}: Props) {
  const [focused, setFocused] = useState(false)
  const c = useColors()

  const focusedBorder = c.accent
  const borderColor = error ? c.error : focused ? focusedBorder : undefined

  // forwardRef components (como LucideIcon) son objetos, no funciones
  const isComponentType =
    typeof icon === 'function' ||
    (icon != null && typeof icon === 'object' && !isValidElement(icon))
  const IconComponent = isComponentType ? (icon as LucideIcon) : null
  const iconNode = isComponentType ? null : (icon as ReactNode)

  return (
    <View className="mb-[14px]">
      {label && (
        <Text className="text-sm text-text font-body-md mb-2">{label}</Text>
      )}
      <View
        className="flex-row items-center gap-2.5 bg-surface rounded-md px-4 min-h-[56px] border border-transparent"
        style={borderColor ? { borderColor } : undefined}
      >
        {(IconComponent || iconNode) && (
          <View
            className={`shrink-0 ${focused ? 'opacity-100' : 'opacity-60'}`}
          >
            {IconComponent ? (
              <IconComponent size={16} color={c.t3} />
            ) : (
              iconNode
            )}
          </View>
        )}
        <TextInput
          className="flex-1 text-text text-base font-body min-w-0 web:outline-none py-3"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.t2}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          textContentType={textContentType}
          autoComplete={autoComplete}
          autoCorrect={autoCapitalize !== 'none'}
          spellCheck={autoCapitalize !== 'none'}
          accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
          accessibilityHint={error}
          aria-invalid={Boolean(error)}
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
  )
}
