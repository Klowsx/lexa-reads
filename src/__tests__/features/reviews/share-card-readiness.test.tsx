import { fireEvent, render } from '@testing-library/react-native'
import { Image } from 'expo-image'
import { BookShareCard } from '~/features/share/components/BookShareCard'
import { ReviewShareCard } from '~/features/share/components/ReviewShareCard'
import type { Tables } from '~/types/database'
import type { ReviewWithUser } from '~/features/book/book.queries'

jest.mock('expo-image', () => ({ Image: 'ExpoImage' }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const book = {
  id: 'book',
  title: 'Una lectura',
  authors: ['Una autora'],
  cover_url: 'https://example.com/cover.jpg'
} as Tables<'books'>
const review = {
  body: 'Una impresión del libro.',
  contains_spoilers: false,
  users: null
} as ReviewWithUser

describe('Preparación de las tarjetas exportables', () => {
  it('no confirma la portada hasta recibir el evento de imagen dibujada', () => {
    const ready = jest.fn()
    const view = render(<BookShareCard book={book} onCoverReady={ready} />)
    expect(ready).not.toHaveBeenCalled()
    fireEvent(view.UNSAFE_getByType(Image), 'display')
    expect(ready).toHaveBeenCalledWith(false)
  })

  it('espera al layout de la cubierta alternativa después de fallar la portada del libro', () => {
    const ready = jest.fn()
    const view = render(<BookShareCard book={book} onCoverReady={ready} />)
    fireEvent(view.UNSAFE_getByType(Image), 'error')
    expect(ready).not.toHaveBeenCalled()
    fireEvent(view.getAllByText('Una lectura')[0], 'layout')
    expect(ready).toHaveBeenCalledWith(true)
    expect(view.UNSAFE_queryByType(Image)).toBeNull()
  })

  it('prepara una alternativa de portada para una reseña sin filtrar texto no dibujado', () => {
    const ready = jest.fn()
    const view = render(
      <ReviewShareCard
        review={review}
        bookTitle={book.title}
        bookCoverUrl={book.cover_url}
        onCoverReady={ready}
      />
    )
    fireEvent(view.UNSAFE_getByType(Image), 'error')
    expect(ready).not.toHaveBeenCalled()
    fireEvent(view.getByText('Una lectura'), 'layout')
    expect(ready).toHaveBeenCalledWith(true)
  })
})
