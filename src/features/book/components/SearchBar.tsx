import { Search, X } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, TextInput, View } from 'react-native'
import { SearchIconButton } from '~/features/search/components/SearchControls'
import { useColors } from '~/theme/colors'

interface Props {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
}

// Mantiene el foco al limpiar y adapta la ayuda al tipo de búsqueda.
export function SearchBar({ value, onChangeText, placeholder }: Props) {
  const c = useColors()
  const { t } = useTranslation()
  const input = useRef<TextInput>(null)
  const [focused, setFocused] = useState(false)

  // Limpia el texto sin obligar al lector a volver a abrir el teclado.
  function clearSearch() {
    onChangeText('')
    input.current?.focus()
  }

  return (
    <View
      className="min-h-14 flex-row items-center gap-3 rounded-md border-2 bg-surface pl-4 pr-1"
      style={{ borderColor: focused ? c.accent : c.surface }}
    >
      <Search size={20} color={c.t2} strokeWidth={1.75} />
      <TextInput
        ref={input}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? t('book.searchPlaceholder')}
        accessibilityLabel={placeholder ?? t('book.searchPlaceholder')}
        accessibilityRole="search"
        placeholderTextColor={c.t2}
        selectionColor={c.accent}
        className="min-w-0 flex-1 py-3 font-body text-xs text-text web:outline-none"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={Keyboard.dismiss}
      />
      {value.length > 0 && (
        <SearchIconButton label={t('search.clear')} onPress={clearSearch}>
          <X size={20} color={c.t2} />
        </SearchIconButton>
      )}
    </View>
  )
}
