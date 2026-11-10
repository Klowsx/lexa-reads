import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, Text, View } from 'react-native'
import { ChevronDown, MessageCircle, Users, X } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStitchTheme } from '~/theme/stitch'

// Agrupa los accesos a la comunidad en un menú que escapa al recorte de la cabecera.
export function CommunityMenu() {
  const [open, setOpen] = useState(false)
  const c = useStitchTheme()
  const router = useRouter()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  // Cierra el menú antes de abrir el destino para no dejarlo sobre la pantalla siguiente.
  function navigate(path: '/clubs' | '/messages') {
    setOpen(false)
    router.push(path)
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('communityMenu.title')}
        accessibilityState={{ expanded: open }}
        style={{
          minHeight: 44,
          paddingHorizontal: 12,
          borderRadius: 999,
          backgroundColor: c.muted,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6
        }}
      >
        <Users size={18} color={c.text} />
        <Text style={{ fontFamily: c.label, fontSize: 14, color: c.text }}>
          {t('communityMenu.title')}
        </Text>
        <ChevronDown size={16} color={c.secondary} />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <View style={{ flex: 1 }}>
          <Pressable
            accessible={false}
            onPress={() => setOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.3)'
            }}
          />
          <View
            accessibilityViewIsModal
            style={{
              marginTop: insets.top + 64,
              marginRight: 16,
              marginLeft: 16,
              alignSelf: 'flex-end',
              width: 288,
              maxWidth: '100%',
              padding: 12,
              borderRadius: 12,
              backgroundColor: c.surface,
              gap: 4
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                accessibilityRole="header"
                style={{
                  flex: 1,
                  paddingLeft: 12,
                  fontFamily: c.heading,
                  fontSize: 22,
                  color: c.text
                }}
              >
                {t('communityMenu.title')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                onPress={() => setOpen(false)}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} color={c.text} />
              </Pressable>
            </View>
            {(
              [
                {
                  path: '/clubs',
                  icon: Users,
                  label: 'clubs',
                  hint: 'clubsHint'
                },
                {
                  path: '/messages',
                  icon: MessageCircle,
                  label: 'messages',
                  hint: 'messagesHint'
                }
              ] as const
            ).map(({ path, icon: Icon, label, hint }) => (
              <Pressable
                key={path}
                onPress={() => navigate(path)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  minHeight: 64,
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: pressed ? c.muted : c.surface
                })}
              >
                <Icon size={22} color={c.text} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{ fontFamily: c.label, color: c.text, fontSize: 16 }}
                  >
                    {t(`communityMenu.${label}`)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: c.body,
                      color: c.secondary,
                      fontSize: 14
                    }}
                  >
                    {t(`communityMenu.${hint}`)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </>
  )
}
