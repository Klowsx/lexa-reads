import { Pressable, View } from 'react-native'
import { useColors } from '~/theme/colors'

interface Props {
  label: string
  on: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

// Ofrece un interruptor legible para lectores de pantalla con un área táctil de 48 puntos.
export function SettingsToggle({ label, on, onChange, disabled }: Props) {
  const c = useColors()

  return (
    <Pressable
      onPress={() => onChange(!on)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: on, disabled }}
      aria-checked={on}
      aria-disabled={disabled}
      className="h-12 w-12 shrink-0 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <View
        className="h-[26px] w-11 justify-center rounded-full border"
        style={{
          backgroundColor: on ? c.accent : c.sh,
          borderColor: on ? c.accent : c.border
        }}
      >
        <View
          className="h-5 w-5 rounded-full bg-white"
          style={{ marginLeft: on ? 20 : 2 }}
        />
      </View>
    </Pressable>
  )
}
