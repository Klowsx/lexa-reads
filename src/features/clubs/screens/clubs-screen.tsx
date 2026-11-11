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
      <View className="px-4 py-2 flex-row items-center gap-2">
        <Pressable
          className="h-12 w-12 items-center justify-center rounded-full"
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">
          Lexa
        </Text>
        <Pressable
          className="h-12 w-12 items-center justify-center rounded-full"
          onPress={() => router.push('/club/new')}
          accessibilityRole="button"
          accessibilityLabel={t('communityStates.createClub')}
        >
          <Plus size={22} color={c.accent} strokeWidth={2} />
        </Pressable>
      </View>

      <View className="px-5 pb-5 pt-2 gap-2">
        <Text
          accessibilityRole="header"
          className="font-display text-2xl text-text"
        >
          {t('stitch.social.clubsTitle')}
        </Text>
        <Text className="font-display-i text-md text-t2">
          {t('stitch.social.clubsSubtitle')}
        </Text>
      </View>
      <View className="mx-4 mb-4 flex-row rounded-full bg-sr p-1">
        {(['mine', 'discover'] as Tab[]).map((tk) => {
          const isActive = tab === tk
          return (
            <Pressable
              key={tk}
              onPress={() => setTab(tk)}
              className="min-h-12 flex-1 justify-center rounded-full py-3 items-center"
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={{
                backgroundColor: isActive ? c.surface : 'transparent'
              }}
            >
              <Text
                className={`text-sm font-body-sb ${isActive ? 'text-text' : 'text-t3'}`}
              >
                {t(
                  tk === 'mine'
                    ? 'stitch.social.myClubs'
                    : 'stitch.social.discover'
                )}
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
