import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import { ProfileSectionHeading } from './ProfileSection'

interface Props {
  booksRead: number
  goal: number
  goalYear: number
  onEditGoal?: () => void
}

export function ReadingGoal({ booksRead, goal, goalYear, onEditGoal }: Props) {
  const { t } = useTranslation()
  const hasGoal = goal > 0
  const pct = hasGoal ? Math.min(Math.max(booksRead / goal, 0), 1) : 0
  const remaining = Math.max(0, goal - booksRead)

  return (
    <View className="mx-container mb-8 rounded-card bg-sr p-5">
      <ProfileSectionHeading
        title={t('goal.metaYear', { year: goalYear })}
        action={t('common.edit')}
        onAction={onEditGoal}
      />
      <Text
        className="font-body-sb text-md text-text mb-3"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {hasGoal
          ? t('goal.booksProgress', { count: booksRead, goal })
          : t('goal.noGoal')}
      </Text>
      {hasGoal ? (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('goal.metaYear', { year: goalYear })}
          accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct * 100)}
          className="h-1.5 rounded-full bg-sh overflow-hidden mb-3"
        >
          <View
            className="h-full rounded-full bg-accent"
            style={{ width: `${pct * 100}%` }}
          />
        </View>
      ) : null}
      <Text className="font-body text-xs text-t2 leading-6">
        {!hasGoal
          ? t('goal.setGoalHint')
          : remaining > 0
            ? t('goal.remaining', { count: remaining })
            : t('goal.done')}
      </Text>
    </View>
  )
}
