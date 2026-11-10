import { useRouter } from 'expo-router'
import { ChevronLeft, Plus } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useTranslation } from 'react-i18next'
import { StitchFeedback } from '~/components/ui/StitchFeedback'
import { StitchLoading } from '~/components/ui/StitchLoading'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ClubCard } from '~/features/clubs/components/ClubCard'
import { useDiscoverClubs, useMyClubs } from '~/features/clubs/hooks/useClubs'
import { useColors } from '~/theme/colors'

type Tab = 'mine' | 'discover'

// Diferencia las listas vacías de los errores y conserva los clubes ya cargados al actualizar.
export default function ClubsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const { t } = useTranslation()
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

      {active.isPending ? (
        <StitchLoading />
      ) : active.isError && !active.data ? (
        <StitchFeedback
          kind="error"
          title={t('communityStates.clubsError')}
          message={t('communityStates.retryHint')}
          action={{
            label: t('common.retry'),
            onPress: () => {
              void active.refetch()
            }
          }}
          busy={active.isFetching}
        />
      ) : (
        <FlashList
          data={list}
          keyExtractor={(c2) => c2.id}
          onRefresh={active.refetch}
          refreshing={active.isRefetching}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            active.isError ? (
              <StitchFeedback
                kind="error"
                title={t('communityStates.refreshError')}
                message={t('communityStates.cachedHint')}
                action={{
                  label: t('common.retry'),
                  onPress: () => {
                    void active.refetch()
                  }
                }}
                busy={active.isFetching}
              />
            ) : null
          }
          ListEmptyComponent={
            !active.isError ? (
              <StitchFeedback
                title={t(
                  tab === 'mine'
                    ? 'communityStates.noClubs'
                    : 'communityStates.noDiscoverClubs'
                )}
                message={t(
                  tab === 'mine'
                    ? 'communityStates.discoverHint'
                    : 'communityStates.createHint'
                )}
                action={
                  tab === 'mine'
                    ? {
                        label: t('communityStates.discoverClubs'),
                        onPress: () => setTab('discover')
                      }
                    : {
                        label: t('communityStates.createClub'),
                        onPress: () => router.push('/club/new')
                      }
                }
              />
            ) : null
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
