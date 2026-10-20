import { useRouter } from 'expo-router'
import { ChevronLeft, Plus } from 'lucide-react-native'
import { useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ClubCard } from '~/features/clubs/components/ClubCard'
import { useDiscoverClubs, useMyClubs } from '~/features/clubs/hooks/useClubs'
import { useColors } from '~/theme/colors'

type Tab = 'mine' | 'discover'

export default function ClubsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const [tab, setTab] = useState<Tab>('mine')

  const mine = useMyClubs()
  const discover = useDiscoverClubs()
  const active = tab === 'mine' ? mine : discover
  const list = active.data ?? []

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">
          Clubes
        </Text>
        <Pressable
          hitSlop={8}
          onPress={() => router.push('/club/new')}
          accessibilityRole="button"
          accessibilityLabel="Crear club"
        >
          <Plus size={22} color={c.accent} strokeWidth={2} />
        </Pressable>
      </View>

      <View className="flex-row border-b border-border">
        {(['mine', 'discover'] as Tab[]).map((tk) => {
          const isActive = tab === tk
          return (
            <Pressable
              key={tk}
              onPress={() => setTab(tk)}
              className="flex-1 py-3 items-center"
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={{
                borderBottomWidth: 2,
                borderBottomColor: isActive ? c.accent : 'transparent'
              }}
            >
              <Text
                className={`text-xs font-body-sb ${isActive ? 'text-text' : 'text-t3'}`}
              >
                {tk === 'mine' ? 'Mis clubes' : 'Descubrir'}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {active.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accent} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(c2) => c2.id}
          onRefresh={active.refetch}
          refreshing={active.isRefetching}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-16 gap-2 px-8">
              <Text className="text-sm font-body-sb text-text">
                {tab === 'mine'
                  ? 'Aún no estás en clubes'
                  : 'No hay clubes todavía'}
              </Text>
              <Text className="text-xs font-body text-t3 text-center">
                {tab === 'mine'
                  ? 'Explora en Descubrir o crea el tuyo.'
                  : 'Sé el primero en crear uno.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ClubCard
              club={item}
              onPress={() => router.push(`/club/${item.slug}`)}
            />
          )}
        />
      )}
    </View>
  )
}
