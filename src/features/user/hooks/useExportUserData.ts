import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { useUIStore } from '~/stores/ui.store'
import { exportUserDataFn } from '../user.queries'

// Solicita la portabilidad y abre el selector nativo sin dejar errores en la pantalla.
export function useExportUserData() {
  const { t } = useTranslation()
  const addToast = useUIStore((state) => state.addToast)
  return useMutation({
    mutationFn: async () => {
      const data = await exportUserDataFn()
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: t('settings.exportTitle')
      })
    },
    onError: () => addToast(t('settings.exportError'), 'error')
  })
}
