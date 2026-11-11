import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render } from '@testing-library/react-native'
import { ActivityIndicator } from 'react-native'
import { BookCommunityTab } from '~/features/book/components/BookCommunityTab'

const mockFetchStats = jest.fn()

// Sustituye solo la fuente de estadísticas; QueryClient ejecuta carga, error y reintento reales.
jest.mock('~/features/book/book.queries', () => ({
  bookCommunityStatsQueryOptions: () => ({
    queryKey: ['book-community-state'],
    queryFn: () => mockFetchStats()
  })
}))
jest.mock('~/stores/auth.store', () => ({ useAuthStore: () => 'reader' }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'es' } })
}))

// Regresión del error que antes permanecía mostrando el indicador de carga indefinidamente.
it('permite recuperar las estadísticas tras un error sin mostrar un falso vacío', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } }
  })
  mockFetchStats.mockRejectedValueOnce(new Error('Statistics unavailable'))
  mockFetchStats.mockResolvedValueOnce({
    totalReaders: 0,
    readingCount: 0,
    wantCount: 0,
    avgRating: 0,
    ratingsCount: 0,
    friendActivity: [],
    distribution: []
  })
  const view = render(
    <QueryClientProvider client={client}>
      <BookCommunityTab bookId="book" />
    </QueryClientProvider>
  )
  try {
    expect(await view.findByText('common.error')).toBeTruthy()
    expect(view.UNSAFE_queryByType(ActivityIndicator)).toBeNull()
    expect(view.queryByText('community.beFirstLibrary')).toBeNull()
    fireEvent.press(view.getByLabelText('common.retry'))
    expect(await view.findByText('community.beFirstLibrary')).toBeTruthy()
    expect(view.queryByText('common.error')).toBeNull()
    expect(mockFetchStats).toHaveBeenCalledTimes(2)
  } finally {
    view.unmount()
    client.clear()
  }
})
