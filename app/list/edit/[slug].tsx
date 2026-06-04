import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useList } from '~/features/lists/hooks/useList';
import { useUpdateList } from '~/features/lists/hooks/useUpdateList';
import { useDeleteList } from '~/features/lists/hooks/useDeleteList';
import { useRemoveBookFromList } from '~/features/lists/hooks/useRemoveBookFromList';
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

export default function EditListScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();

  const { data: list, isLoading } = useList(slug ?? '');
  const updateMutation = useUpdateList(slug ?? '');
  const deleteMutation = useDeleteList();
  const removeBookMutation = useRemoveBookFromList(slug ?? '');

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [color, setColor] = useState(LIST_COLORS[0]);

  const visibilityLabel = (v: Visibility) =>
    v === 'public' ? t('lists.public') : t('lists.private');

  useEffect(() => {
    if (list) {
      setName(list.name);
      setDesc(list.description ?? '');
      setVisibility(list.visibility === 'public' ? 'public' : 'private');
      setColor(list.accent_color ?? LIST_COLORS[0]);
    }
  }, [list]);

  const canSave = name.trim().length >= 2;

  function handleSave() {
    if (!list || !canSave || updateMutation.isPending) return;
    updateMutation.mutate(
      {
        listId: list.id,
        name: name.trim(),
        description: desc.trim() || null,
        visibility,
        accentColor: color,
      },
      { onSuccess: () => router.back() },
    );
  }

  function handleDelete() {
    if (!list) return;
    Alert.alert(t('lists.deleteList'), t('lists.deleteConfirm', { name: list.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteMutation.mutate(list.id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  function handleRemoveBook(listBookId: string, title: string) {
    Alert.alert(t('lists.removeBook'), t('lists.removeBookConfirm', { title }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('lists.remove'), style: 'destructive', onPress: () => removeBookMutation.mutate(listBookId) },
    ]);
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  if (!list) return null;

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
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">{t('lists.editTitle')}</Text>
        <Pressable hitSlop={8} onPress={handleSave} disabled={!canSave || updateMutation.isPending}>
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color={c.accent} />
          ) : (
            <Text className={cn("text-sm font-body-sb", canSave ? "text-accent" : "text-t3")}>{t('common.save')}</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
      >
        {/* Preview */}
        <View
          className="rounded-md mb-6 px-4 py-4 flex-row items-center gap-3"
          style={{ backgroundColor: alpha(color, 0.1), borderWidth: 1, borderColor: alpha(color, 0.28) }}
        >
          <View className="rounded-sm shrink-0" style={{ width: 4, height: 40, backgroundColor: color }} />
          <View className="flex-1 min-w-0">
            <Text className="text-sm font-body-sb text-text" numberOfLines={1}>
              {name.trim() || t('lists.namePlaceholder')}
            </Text>
            <Text className="text-xs font-body text-t3 mt-0.5">
              {t('lists.booksCount', { count: list.items.length })} · {visibilityLabel(visibility)}
            </Text>
          </View>
        </View>

        {/* Nombre */}
        <View className="mb-4">
          <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">{t('lists.name')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
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
            style={{ textAlignVertical: 'top' }}
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
                  className="flex-1 items-center py-2 rounded-sm"
                  style={{ backgroundColor: active ? c.accent : 'transparent' }}
                >
                  <Text className={cn("text-xs font-body-sb", active ? "text-white" : "text-t3")}>{visibilityLabel(v)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Color */}
        <View className="mb-6">
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

        {/* Libros */}
        <View className="mb-8">
          <View className="flex-row justify-between items-baseline mb-3">
            <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase">
              {t('lists.booksLabel')} · {list.items.length}
            </Text>
          </View>

          {list.items.length === 0 ? (
            <View className="rounded-md border border-border items-center py-8 bg-surface">
              <Text className="text-xs font-body text-t3">{t('lists.emptyList')}</Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {list.items.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center gap-3 rounded-md border border-border px-3 py-2.5 bg-surface"
                >
                  <View className="w-10 h-[58px] rounded-[4px] overflow-hidden bg-sh">
                    {item.book.cover_url ? (
                      <Image source={{ uri: item.book.cover_url }} className="w-10 h-[58px]" contentFit="cover" />
                    ) : null}
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-xs font-body-sb text-text" numberOfLines={1}>
                      {item.book.title}
                    </Text>
                    <Text className="text-xs font-body text-t3 mt-0.5">
                      {item.book.authors?.[0] ?? ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveBook(item.id, item.book.title)}
                    hitSlop={8}
                    className="p-2"
                    disabled={removeBookMutation.isPending}
                  >
                    <Trash2 size={15} color={c.error} strokeWidth={1.8} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Guardar */}
        <Pressable
          onPress={handleSave}
          disabled={!canSave || updateMutation.isPending}
          className="py-3.5 rounded-md items-center mb-4"
          style={{ backgroundColor: canSave ? c.accent : alpha(c.accent, 0.4) }}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-sm font-body-sb text-white">{t('common.saveChanges')}</Text>
          )}
        </Pressable>

        {/* Eliminar */}
        <Pressable
          onPress={handleDelete}
          disabled={deleteMutation.isPending}
          className="py-3.5 rounded-md items-center border border-border"
        >
          <Text className="text-sm font-body-sb text-error">{t('lists.deleteList')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
