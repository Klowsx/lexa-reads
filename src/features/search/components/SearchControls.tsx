import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { cn } from '~/lib/utils'

export type SearchTab = 'books' | 'users'
interface ActionProps {
  label: string
  onPress: () => void
  disabled?: boolean
  selected?: boolean
}

// Comparte tamaño táctil, foco y tipografía entre las acciones de búsqueda.
export function SearchAction({
  label,
  onPress,
  disabled,
  selected
}: ActionProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      aria-disabled={disabled}
      aria-selected={selected}
      className={cn(
        'min-h-12 items-center justify-center rounded-md bg-sr px-4 py-3 hover:bg-sh active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
        disabled && 'opacity-50'
      )}
    >
      <Text className="font-body-sb text-xs text-text">{label}</Text>
    </Pressable>
  )
}

// Da un nombre accesible y un área táctil real a las acciones con icono.
export function SearchIconButton({
  label,
  onPress,
  children
}: ActionProps & { children: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-12 w-12 shrink-0 items-center justify-center rounded-md hover:bg-sr active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      {children}
    </Pressable>
  )
}

// Cambia el alcance sin perder la consulta y comunica la selección sin animación ornamental.
export function SearchTabs({
  active,
  onChange
}: {
  active: SearchTab
  onChange: (tab: SearchTab) => void
}) {
  const { t } = useTranslation()
  const tabs = [
    { id: 'books', label: t('search.tabBooks') },
    { id: 'users', label: t('search.tabUsers') }
  ] as const
  return (
    <View className="flex-row gap-1 rounded-md bg-surface p-1">
      {tabs.map(({ id, label }) => (
        <Pressable
          key={id}
          onPress={() => onChange(id)}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === id }}
          aria-selected={active === id}
          className={cn(
            'min-h-12 flex-1 items-center justify-center rounded-md px-2 py-2 active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
            active === id ? 'bg-bg' : 'hover:bg-sr'
          )}
        >
          <Text
            className={cn(
              'text-xs',
              active === id ? 'font-body-sb text-text' : 'font-body text-t2'
            )}
          >
            {label}
          </Text>
          <View
            className={cn(
              'mt-1 h-0.5 w-4 rounded-full',
              active === id ? 'bg-accent' : 'bg-transparent'
            )}
          />
        </Pressable>
      ))}
    </View>
  )
}
