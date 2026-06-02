import { Tabs } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useAuthStore } from '~/stores/auth.store';
import { useUnreadCount } from '~/features/notifications/hooks/useUnreadCount';
import { cn } from '~/lib/utils';
import { useColors } from '~/theme/colors';

// ─── Tab icons (ported from design prototype) ─────────────────

function FeedIcon({ color, active }: { color: string; active: boolean }) {
  const sw = active ? 2 : 1.5;
  return (
    <Svg width={22} height={20} viewBox="0 0 22 20" fill="none">
      <Rect x={1} y={1} width={8.5} height={11} rx={2} stroke={color} strokeWidth={sw} fill={active ? color : 'none'} />
      <Rect x={1} y={14.5} width={8.5} height={4.5} rx={1.5} stroke={color} strokeWidth={sw} fill={active ? color : 'none'} />
      <Rect x={12.5} y={1} width={8.5} height={4.5} rx={1.5} stroke={color} strokeWidth={sw} fill={active ? color : 'none'} />
      <Rect x={12.5} y={8} width={8.5} height={11} rx={2} stroke={color} strokeWidth={sw} fill={active ? color : 'none'} />
    </Svg>
  );
}

function SearchIcon({ color, active }: { color: string; active: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={8.5} cy={8.5} r={6.5} stroke={color} strokeWidth={active ? 2 : 1.5} />
      <Path d="M13.5 13.5L18.5 18.5" stroke={color} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" />
    </Svg>
  );
}

function LibraryIcon({ color, active }: { color: string; active: boolean }) {
  const sw = active ? 2 : 1.5;
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Rect x={1} y={2} width={5} height={16} rx={1.5} stroke={color} strokeWidth={sw} fill={active ? color : 'none'} />
      <Rect x={7.5} y={2} width={5} height={16} rx={1.5} stroke={color} strokeWidth={sw} fill={active ? color : 'none'} />
      <Path d="M15.5 2.5l3.5 15" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

function BellIcon({ color, active }: { color: string; active: boolean }) {
  const sw = active ? 2 : 1.5;
  return (
    <Svg width={20} height={22} viewBox="0 0 20 22" fill="none">
      <Path
        d="M10 2C6.686 2 4 4.686 4 8v5l-2 2v1h16v-1l-2-2V8c0-3.314-2.686-6-6-6z"
        stroke={color}
        strokeWidth={sw}
        fill={active ? color + '33' : 'none'}
        strokeLinejoin="round"
      />
      <Path
        d="M8 18a2 2 0 004 0"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ProfileIcon({ color, active }: { color: string; active: boolean }) {
  const sw = active ? 2 : 1.5;
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={6.5} r={4} stroke={color} strokeWidth={sw} fill={active ? color + '33' : 'none'} />
      <Path d="M2 18.5C2 14.5 5.5 11.5 10 11.5S18 14.5 18 18.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Tab config ───────────────────────────────────────────────

const TAB_CONFIG = [
  { name: 'feed',          label: 'Inicio',      Icon: FeedIcon,    hasNotif: false },
  { name: 'search',        label: 'Buscar',      Icon: SearchIcon,  hasNotif: false },
  { name: 'library',       label: 'Biblioteca',  Icon: LibraryIcon, hasNotif: false },
  { name: 'notifications', label: 'Notifs',      Icon: BellIcon,    hasNotif: true  },
  { name: 'profile',       label: 'Perfil',      Icon: ProfileIcon, hasNotif: false },
] as const;

// ─── Custom tab bar ───────────────────────────────────────────

interface TabBarProps {
  state: { routes: { key: string; name: string }[]; index: number };
  navigation: { navigate: (name: string) => void };
}

function NotifBadge() {
  const c = useColors();
  const userId = useAuthStore((s) => s.user?.id) ?? '';
  const { data: count = 0 } = useUnreadCount();
  if (!count) return null;
  const label = count > 9 ? '9+' : String(count);
  return (
    <View
      className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full items-center justify-center px-[3px]"
      className="bg-accent"
    >
      <Text className="text-[8px] text-white font-body-bold leading-[14px]">
        {label}
      </Text>
    </View>
  );
}

function CustomTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const c = useColors();

  return (
    <View
      className="bg-surface border-t border-border"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex-row">
        {state.routes.map((route, index) => {
          const active = state.index === index;
          const color = active ? c.accent : c.t3;
          const tab = TAB_CONFIG.find(t => t.name === route.name) ?? TAB_CONFIG[0];

          return (
            <TouchableOpacity
              key={route.key}
              className="flex-1 items-center pt-2.5 pb-1 gap-0.5"
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.7}
            >
              <View className="relative">
                <tab.Icon color={color} active={active} />
                {tab.hasNotif && <NotifBadge />}
              </View>
              <Text
                className={cn("text-[10px]", active ? "font-body-sb" : "font-body")}
                style={{ color }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...(props as any)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="feed"          options={{ title: 'Inicio'      }} />
      <Tabs.Screen name="search"        options={{ title: 'Buscar'      }} />
      <Tabs.Screen name="library"       options={{ title: 'Biblioteca'  }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifs'      }} />
      <Tabs.Screen name="profile"       options={{ title: 'Perfil'      }} />
    </Tabs>
  );
}
