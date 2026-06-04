import { Search, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';
import { useColors } from '~/theme/colors';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}

export function SearchBar({ value, onChangeText, focused, onFocus, onBlur }: Props) {
  const c = useColors();
  const { t } = useTranslation();

  return (
    <View
      className="flex-row items-center gap-2 bg-surface rounded-md px-3.5 py-2.5"
      style={{ borderWidth: 1, borderColor: focused ? c.accent + '66' : 'transparent' }}
    >
      <Search size={15} color={c.t3} strokeWidth={1.6} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={t('book.searchPlaceholder')}
        placeholderTextColor={c.t3}
        className="flex-1 text-text font-body text-base"
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <X size={18} color={c.t3} strokeWidth={1.6} />
        </Pressable>
      )}
    </View>
  );
}
