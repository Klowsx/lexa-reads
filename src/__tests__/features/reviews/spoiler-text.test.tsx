import { fireEvent, render } from '@testing-library/react-native'
import { SpoilerText } from '~/features/reviews/components/SpoilerText'
import { ReviewShareCard } from '~/features/share/components/ReviewShareCard'
import type { ReviewWithUser } from '~/features/book/book.queries'

jest.mock('~/theme/colors', () => ({
  useColors: () => ({ text: '#111111' }),
  fixed: { accent: '#C4783A', star: '#E8C05A' }
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

describe('Protección de spoilers', () => {
  it('no monta el texto hasta que el lector lo revela y permite ocultarlo', () => {
    const view = render(
      <SpoilerText
        contentId="review"
        body="Final que no debe filtrarse"
        containsSpoilers
      />
    )
    expect(view.queryByText('Final que no debe filtrarse')).toBeNull()
    fireEvent.press(view.getByText('reviews.showSpoiler'), {
      stopPropagation: jest.fn()
    })
    expect(view.getByText('Final que no debe filtrarse')).toBeTruthy()
    fireEvent.press(view.getByText('reviews.hideSpoiler'), {
      stopPropagation: jest.fn()
    })
    expect(view.queryByText('Final que no debe filtrarse')).toBeNull()
  })
  it('vuelve a ocultar el texto al editarlo o reciclar una tarjeta', () => {
    const view = render(
      <SpoilerText contentId="first" body="Texto inicial" containsSpoilers />
    )
    fireEvent.press(view.getByText('reviews.showSpoiler'), {
      stopPropagation: jest.fn()
    })
    view.rerender(
      <SpoilerText contentId="first" body="Texto editado" containsSpoilers />
    )
    expect(view.queryByText('Texto editado')).toBeNull()
    view.rerender(
      <SpoilerText contentId="second" body="Texto inicial" containsSpoilers />
    )
    expect(view.queryByText('Texto inicial')).toBeNull()
  })
  it('oculta de nuevo al volver a marcar la misma reseña como spoiler', () => {
    const view = render(
      <SpoilerText contentId="same" body="Mismo texto" containsSpoilers />
    )
    fireEvent.press(view.getByText('reviews.showSpoiler'), {
      stopPropagation: jest.fn()
    })
    view.rerender(
      <SpoilerText
        contentId="same"
        body="Mismo texto"
        containsSpoilers={false}
      />
    )
    expect(view.getByText('Mismo texto')).toBeTruthy()
    view.rerender(
      <SpoilerText contentId="same" body="Mismo texto" containsSpoilers />
    )
    expect(view.queryByText('Mismo texto')).toBeNull()
  })
})

describe('Tarjeta de reseña para compartir', () => {
  const review: ReviewWithUser = {
    id: 'review',
    book_id: 'book',
    user_id: 'reader',
    user_book_id: null,
    body: 'Un final que debe permanecer oculto.',
    contains_spoilers: true,
    is_published: true,
    created_at: null,
    updated_at: null,
    edited_at: null,
    deleted_at: null,
    likes_count: 0,
    comments_count: 0,
    users: null
  }
  it('sustituye el texto sensible incluso en la representación exportable', () => {
    const view = render(<ReviewShareCard review={review} />)
    expect(view.queryByText(review.body)).toBeNull()
    expect(view.getByText('reviews.sharedSpoiler')).toBeTruthy()
  })
  it('conserva el texto de una reseña que no contiene spoilers', () => {
    const view = render(
      <ReviewShareCard review={{ ...review, contains_spoilers: false }} />
    )
    expect(view.getByText(review.body)).toBeTruthy()
  })
})
