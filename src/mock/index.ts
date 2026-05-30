// Datos mock para desarrollo de UI — reemplazar con hooks de Supabase

export type MockBook = {
  id: number;
  title: string;
  author: string;
  pages: number;
  year: number;
  genres: string[];
  desc: string;
  c1: string;
  c2: string;
  avg: number;
};

export type MockUser = {
  id: string;
  username: string;
  name: string;
  av: string;
  avC: string;
};

export type BookStatus = 'reading' | 'read' | 'want_to_read' | 'abandoned';

export type MockUserBook = {
  book: MockBook;
  status: BookStatus;
  rating: number | null;
};

export type FeedItemType =
  | 'finished_book'
  | 'started_book'
  | 'wrote_review'
  | 'added_to_list'
  | 'abandoned_book'
  | 'want_to_read';

export type MockFeedItem = {
  id: string;
  user: MockUser;
  type: FeedItemType;
  book: MockBook;
  rating: number | null;
  time: string;
  preview: string | null;
  listName?: string;
  likes: number;
  comments: number;
  liked: boolean;
};

export type MockMe = MockUser & {
  books: number;
  reviews: number;
  followers: number;
  following: number;
  goal: number;
  goalYear: number;
  bio: string;
};

export const STATUS_META: Record<BookStatus, { label: string; color: string }> = {
  reading:      { label: 'Leyendo',    color: '#4A96B8' },
  read:         { label: 'Leído',      color: '#5CAF7E' },
  want_to_read: { label: 'Por leer',   color: '#8A6CD8' },
  abandoned:    { label: 'Abandonado', color: '#787068' },
};

export const ACT_LABEL: Record<FeedItemType, string> = {
  finished_book:  'terminó de leer',
  started_book:   'empezó a leer',
  wrote_review:   'reseñó',
  added_to_list:  'agregó',
  abandoned_book: 'abandonó',
  want_to_read:   'quiere leer',
};

export const BOOKS: MockBook[] = [
  { id: 1,  title: 'El nombre del viento', author: 'Patrick Rothfuss',       pages: 662, year: 2007, genres: ['Fantasía', 'Épica'],             desc: 'La historia de Kvothe, el mago más temido de su era, narrada en sus propias palabras desde una posada en el fin del mundo.',         c1: '#1C1635', c2: '#7B5EA7', avg: 4.5 },
  { id: 2,  title: 'Cien años de soledad', author: 'Gabriel García Márquez', pages: 417, year: 1967, genres: ['Realismo mágico', 'Clásico'],    desc: 'La saga épica de la familia Buendía a lo largo de siete generaciones en el mítico pueblo de Macondo.',                             c1: '#2A1A08', c2: '#C49A20', avg: 4.8 },
  { id: 3,  title: 'Normal People',         author: 'Sally Rooney',           pages: 273, year: 2018, genres: ['Contemporáneo', 'Romance'],      desc: 'La compleja e íntima relación entre Connell y Marianne, desde la secundaria en Irlanda hasta la universidad en Dublín.',            c1: '#181818', c2: '#AAAAAA', avg: 4.1 },
  { id: 4,  title: 'La sombra del viento', author: 'Carlos Ruiz Zafón',      pages: 540, year: 2001, genres: ['Misterio', 'Historia'],          desc: 'En el Barcelona de la posguerra, un niño descubre en el Cementerio de los Libros Olvidados una novela que alguien intenta destruir.', c1: '#180F0F', c2: '#8B3A3A', avg: 4.4 },
  { id: 5,  title: 'The Midnight Library', author: 'Matt Haig',              pages: 288, year: 2020, genres: ['Especulativo'],                  desc: 'Entre la vida y la muerte existe una biblioteca infinita con todos los libros de las vidas que podrías haber vivido.',               c1: '#0A1E2A', c2: '#2A8A8A', avg: 4.0 },
  { id: 6,  title: 'Babel',               author: 'R.F. Kuang',             pages: 545, year: 2022, genres: ['Fantasía histórica', 'Academia'], desc: 'Una historia sobre traducción, traición y la magia oculta en las palabras. Oxford victoriano, colonialismo y plata.',               c1: '#1E0808', c2: '#C43A3A', avg: 4.6 },
  { id: 7,  title: 'Piranesi',            author: 'Susanna Clarke',          pages: 272, year: 2020, genres: ['Fantasía', 'Misterio'],           desc: 'Piranesi vive en una casa con salas infinitas llenas de estatuas y mareas. Alguien más también habita ahí.',                       c1: '#0C1628', c2: '#4A8AB8', avg: 4.5 },
  { id: 8,  title: 'Educated',            author: 'Tara Westover',           pages: 334, year: 2018, genres: ['Memorias'],                      desc: 'Las memorias de una mujer criada sin acceso a la educación formal que terminó con un doctorado en Cambridge.',                       c1: '#1A1208', c2: '#8B6A3A', avg: 4.7 },
  { id: 9,  title: 'Hamnet',              author: "Maggie O'Farrell",        pages: 320, year: 2020, genres: ['Ficción histórica'],              desc: 'La historia del único hijo de Shakespeare y la mujer detrás del dramaturgo más grande de la historia.',                            c1: '#0F180F', c2: '#5A8A5A', avg: 4.3 },
  { id: 10, title: 'Klara y el sol',      author: 'Kazuo Ishiguro',          pages: 307, year: 2021, genres: ['Ciencia ficción', 'Literaria'],   desc: 'Klara, un robot amigo artificial, observa el mundo desde la vitrina de una tienda, esperando ser elegida.',                         c1: '#1E1408', c2: '#D4902A', avg: 4.2 },
];

export const ME: MockMe = {
  id: 'me',
  username: 'javierml',
  name: 'Javier M.',
  av: 'JM',
  avC: '#C4783A',
  books: 47,
  reviews: 23,
  followers: 128,
  following: 89,
  goal: 50,
  goalYear: 2026,
  bio: 'Lector de fantasía y clásicos latinoamericanos',
};

export const USERS: MockUser[] = [
  { id: 'u1', username: 'marisol_br', name: 'Marisol B.', av: 'MB', avC: '#7B5EA7' },
  { id: 'u2', username: 'carlos_lee', name: 'Carlos L.',  av: 'CL', avC: '#4A96B8' },
  { id: 'u3', username: 'anasantos',  name: 'Ana S.',     av: 'AS', avC: '#5CAF7E' },
  { id: 'u4', username: 'luis_mr',    name: 'Luis MR',    av: 'LM', avC: '#8B3A3A' },
];

export const MY_BOOKS: MockUserBook[] = [
  { book: BOOKS[0], status: 'reading',      rating: null },
  { book: BOOKS[5], status: 'reading',      rating: null },
  { book: BOOKS[1], status: 'read',         rating: 5   },
  { book: BOOKS[7], status: 'read',         rating: 4.5 },
  { book: BOOKS[6], status: 'read',         rating: 5   },
  { book: BOOKS[8], status: 'read',         rating: 4.5 },
  { book: BOOKS[2], status: 'want_to_read', rating: null },
  { book: BOOKS[4], status: 'want_to_read', rating: null },
  { book: BOOKS[9], status: 'want_to_read', rating: null },
  { book: BOOKS[3], status: 'abandoned',    rating: 2.5 },
];

export const FEED_INIT: MockFeedItem[] = [
  { id: 'f1', user: USERS[0], type: 'finished_book',  book: BOOKS[0], rating: 5,    time: '2h',   preview: null, likes: 12, comments: 3, liked: false },
  { id: 'f2', user: USERS[1], type: 'started_book',   book: BOOKS[1], rating: null, time: '5h',   preview: null, likes: 4,  comments: 0, liked: true  },
  { id: 'f3', user: USERS[2], type: 'wrote_review',   book: BOOKS[2], rating: 4,    time: '8h',   preview: 'Rooney captura perfectamente la torpeza de la juventud. Una historia simple en su superficie pero demoledora en lo que explora sobre clase y conexión.', likes: 31, comments: 7, liked: false },
  { id: 'f4', user: USERS[0], type: 'added_to_list',  book: BOOKS[4], rating: null, time: 'ayer', preview: null, listName: 'Lista de verano', likes: 8, comments: 1, liked: false },
  { id: 'f5', user: USERS[3], type: 'abandoned_book', book: BOOKS[3], rating: 2.5,  time: 'ayer', preview: null, likes: 2,  comments: 4, liked: false },
  { id: 'f6', user: USERS[1], type: 'finished_book',  book: BOOKS[6], rating: 4.5,  time: '2d',   preview: 'Absolutamente fascinante. Clarke construye un mundo que parece imposible pero se siente inevitable. Un logro extraordinario.', likes: 19, comments: 5, liked: false },
];

export type MockList = {
  name: string;
  count: number;
  visibility: string;
  col: string;
};

export const MOCK_LISTS: MockList[] = [
  { name: 'Lista de verano',    count: 4,  visibility: 'Pública', col: '#4A96B8' },
  { name: 'Dark Academia 2026', count: 7,  visibility: 'Pública', col: '#8A6CD8' },
  { name: 'Pendientes',         count: 12, visibility: 'Privada', col: '#6A635C' },
];

export const READING_PROGRESS: Record<number, { current: number; total: number }> = {
  1: { current: 287, total: 662 },
  6: { current: 102, total: 545 },
};
