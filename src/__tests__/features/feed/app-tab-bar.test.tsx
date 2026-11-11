import type { ComponentProps } from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { AppTabBar } from '~/components/AppTabBar'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 })
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('~/features/notifications/hooks/useUnreadCount', () => ({
  useUnreadCount: () => ({ data: 0 })
}))
jest.mock('~/theme/colors', () => ({
  useColors: () => ({ accent: '#000', t2: '#45464d', sr: '#f6ece6' })
}))

// Construye únicamente las dependencias que usa la barra; los eventos quedan observables.
function harness() {
  const navigation = {
    navigate: jest.fn(),
    emit: jest.fn().mockReturnValue({ defaultPrevented: false })
  }
  const props = {
    state: {
      index: 0,
      routes: [
        { key: 'feed-key', name: 'feed' },
        { key: 'search-key', name: 'search' }
      ]
    },
    navigation
  } as unknown as ComponentProps<typeof AppTabBar>
  return { navigation, view: render(<AppTabBar {...props} />) }
}

describe('Eventos de la navegación principal', () => {
  it('emite tabPress y navega solo cuando el destino cambia', () => {
    const { navigation, view } = harness()
    fireEvent.press(view.getByLabelText('stitch.shell.tabs.feed'))
    expect(navigation.emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'feed-key',
      canPreventDefault: true
    })
    expect(navigation.navigate).not.toHaveBeenCalled()
    fireEvent.press(view.getByLabelText('stitch.shell.tabs.search'))
    expect(navigation.navigate).toHaveBeenCalledWith('search')
  })

  it('respeta la cancelación y conserva la pulsación prolongada', () => {
    const { navigation, view } = harness()
    navigation.emit.mockReturnValue({ defaultPrevented: true })
    const destination = view.getByLabelText('stitch.shell.tabs.search')
    fireEvent.press(destination)
    expect(navigation.navigate).not.toHaveBeenCalled()
    fireEvent(destination, 'longPress')
    expect(navigation.emit).toHaveBeenLastCalledWith({
      type: 'tabLongPress',
      target: 'search-key'
    })
  })
})
