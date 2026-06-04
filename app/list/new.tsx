import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreateList } from '~/features/lists/hooks/useCreateList';
import { cn } from '~/lib/utils';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const LIST_COLORS = [
  '#4A96B8', '#8A6CD8', '#5CAF7E', '#C4783A',
  '#8B3A3A', '#2A8A8A', '#C4903A', '#6A635C',
];

type Visibility = 'public' | 'private';

export default function NewListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [color, setColor] = useState(LIST_COLORS[0]);

  const createMutation = useCreateList();
  const canSubmit = name.trim().length >= 2;

  const visibilityLabel = (v: Visibility) =>
    v === 'public' ? t('lists.public') : t('lists.private');

  function handleCreate() {
    if (!canSubmit || createMutation.isPending) return;
    createMutation.mutate(
      {
        name: name.trim(),
        description: desc.trim() || undefined,
        visibility,
        accentColor: color,
      },
      {
        onSuccess: (list) => {
          router.replace({
            pathname: '/list/[slug]',
            params: { slug: list.slug },
          } as any);
        },
      },
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">
          {t('lists.newTitle')}
        </Text>
        <Pressable onPress={handleCreate} disabled={!canSubmit || createMutation.isPending} hitSlop={8}>
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color={c.accent} />
          ) : (
            <Text className={cn("text-sm font-body-sb", canSubmit ? "text-accent" : "text-t3")}>
              {t('lists.create')}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
      >
        {/* Preview stripe */}
        <View
          className="rounded-md mb-6 px-4 py-4 flex-row items-center gap-3"
          style={{ backgroundColor: alpha(color, 0.1), borderWidth: 1, borderColor: alpha(color, 0.28) }}
        >
          <View className="rounded-sm shrink-0 w-1 h-10" style={{ backgroundColor: color }} />
          <View className="flex-1 min-w-0">
            <Text className="text-sm font-body-sb text-text" numberOfLines={1}>
              {name.trim() || t('lists.namePlaceholder')}
            </Text>
            <Text className="text-xs font-body text-t3 mt-0.5">{t('lists.booksCount', { count: 0 })} · {visibilityLabel(visibility)}</Text>
          </View>
        </View>

        {/* Nombre */}
        <View className="mb-4">
          <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">{t('lists.name')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('lists.nameExample')}
            maxLength={60}
            className="rounded-md border border-border font-body text-sm text-text px-[14px] py-[11px] bg-surface"
            placeholderTextColor={c.t3}
          />
          <Text className="text-xs font-body text-t3 text-right mt-1">{name.length}/60</Text>
        </View>

        {/* Descripción */}
        <View className="mb-4">
          <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">
            {t('lists.description')} <Text className="normal-case tracking-normal">{t('lists.optional')}</Text>
          </Text>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder={t('lists.descPlaceholder')}
            multiline
            numberOfLines={3}
            maxLength={200}
            className="rounded-md border border-border font-body text-sm text-text px-[14px] py-[11px] leading-[22px] bg-surface"
            style={{
              textAlignVertical: 'top',
            }}
            placeholderTextColor={c.t3}
          />
          <Text className="text-xs font-body text-t3 text-right mt-1">{desc.length}/200</Text>
        </View>

        {/* Visibilidad */}
        <View className="mb-6">
          <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-2">{t('lists.visibility')}</Text>
          <View className="flex-row rounded-md bg-sh p-1 border border-border">
            {(['public', 'private'] as Visibility[]).map((v) => {
              const active = visibility === v;
              return (
                <Pressable
                  key={v}
                  onPress={() => setVisibility(v)}
                  className={cn("flex-1 items-center py-2 rounded-sm", active ? "bg-accent" : "bg-transparent")}
                >
                  <Text className={cn("text-xs font-body-sb", active ? "text-white" : "text-t3")}>{visibilityLabel(v)}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="text-xs font-body text-t3 mt-1.5">
            {visibility === 'public' ? t('lists.publicHint') : t('lists.privateHint')}
          </Text>
        </View>

        {/* Color */}
        <View className="mb-8">
          <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-2">{t('lists.color')}</Text>
          <View className="flex-row gap-3 flex-wrap">
            {LIST_COLORS.map((col) => {
              const active = color === col;
              return (
                <Pressable
                  key={col}
                  onPress={() => setColor(col)}
                  style={{
                    width: 34, height: 34, borderRadius: 17, backgroundColor: col,
                    borderWidth: active ? 3 : 2, borderColor: active ? c.text : 'transparent',
                    shadowColor: col, shadowOpacity: active ? 0.5 : 0,
                    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: active ? 4 : 0,
                  }}
                />
              );
            })}
          </View>
        </View>

        {/* Submit */}
        <Pressable
          onPress={handleCreate}
          disabled={!canSubmit || createMutation.isPending}
          className={cn("py-3.5 rounded-md items-center", canSubmit ? "bg-accent" : "")}
          style={canSubmit ? undefined : { backgroundColor: alpha(c.accent, 0.4) }}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-sm font-body-sb text-white">{t('lists.createList')}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
