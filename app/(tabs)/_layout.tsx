import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppTabBar } from '~/components/AppTabBar'

// Configura las rutas de pestañas; la navegación visual compartida pertenece al shell.
export default function TabsLayout() {
  const { t } = useTranslation()
  return (
    <Tabs
      tabBar={({ state, navigation }) => (
        <AppTabBar state={state} navigation={navigation} />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="feed"
        options={{ title: t('stitch.shell.tabs.feed') }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: t('stitch.shell.tabs.search') }}
      />
      <Tabs.Screen
        name="library"
        options={{ title: t('stitch.shell.tabs.library') }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: t('stitch.shell.tabs.notifications') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('stitch.shell.tabs.profile') }}
      />
    </Tabs>
  )
}
