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
  id: string;
  name: string;
  count: number;
  visibility: string;
  col: string;
  desc?: string;
};

export const MOCK_LISTS: MockList[] = [
  { id: 'lista-verano',    name: 'Lista de verano',    count: 4,  visibility: 'Pública', col: '#4A96B8', desc: 'Lecturas ligeras y emocionantes para el verano.' },
  { id: 'dark-academia',   name: 'Dark Academia 2026', count: 7,  visibility: 'Pública', col: '#8A6CD8', desc: 'Libros con atmósfera académica oscura y literaria.' },
  { id: 'pendientes',      name: 'Pendientes',         count: 12, visibility: 'Privada', col: '#6A635C' },
];

export const LIST_BOOKS: Record<string, MockBook[]> = {
  'lista-verano':  [BOOKS[4], BOOKS[0], BOOKS[7], BOOKS[2]],
  'dark-academia': [BOOKS[5], BOOKS[3], BOOKS[6], BOOKS[1], BOOKS[8], BOOKS[9], BOOKS[0]],
  'pendientes':    [BOOKS[2], BOOKS[4], BOOKS[9], BOOKS[3], BOOKS[8], BOOKS[1], BOOKS[5], BOOKS[0], BOOKS[6], BOOKS[7], BOOKS[1], BOOKS[2]],
};

// ─── Comments ─────────────────────────────────────────────────

export type MockComment = {
  id: string;
  user: MockUser;
  text: string;
  time: string;
  liked: boolean;
  likes: number;
};

export const FEED_COMMENTS: Record<string, MockComment[]> = {
  f1: [
    { id: 'c1', user: USERS[1], text: '¡Qué envidia! Llevo meses queriendo leerlo.',                                             time: '1h',   liked: false, likes: 3  },
    { id: 'c2', user: USERS[2], text: 'Es de mis favoritos. El sistema de magia es increíble.',                                  time: '2h',   liked: true,  likes: 7  },
    { id: 'c3', user: USERS[3], text: 'Lo terminé el mes pasado, me dejó con ganas del segundo libro.',                          time: '2h',   liked: false, likes: 1  },
  ],
  f3: [
    { id: 'c4', user: USERS[0], text: 'Completamente de acuerdo con tu análisis.',                                               time: '30m',  liked: false, likes: 4  },
    { id: 'c5', user: USERS[3], text: 'La escena final me rompió el corazón.',                                                   time: '45m',  liked: false, likes: 2  },
    { id: 'c6', user: USERS[1], text: 'Me costó entrar al principio pero luego no podía parar.',                                 time: '3h',   liked: true,  likes: 5  },
    { id: 'c7', user: USERS[2], text: 'Rooney es demasiado buena describiendo relaciones. 10/10.',                               time: '5h',   liked: false, likes: 11 },
  ],
  f5: [
    { id: 'c8', user: USERS[0], text: 'Entiendo, a mí también me costó pasar de la mitad.',                                     time: '2h',   liked: false, likes: 2  },
    { id: 'c9', user: USERS[2], text: '¿Llegaste al giro del capítulo 20? Vale la pena insistir.',                               time: '3h',   liked: false, likes: 0  },
    { id: 'c10',user: USERS[1], text: 'A mí me pasó lo mismo pero la segunda lectura me cambió la opinión.',                    time: 'ayer', liked: true,  likes: 1  },
    { id: 'c11',user: USERS[3], text: 'Ruiz Zafón tiene eso. O te engancha o no. Prueba "El Juego del Ángel" que es diferente.', time: 'ayer', liked: false, likes: 3  },
  ],
  f6: [
    { id: 'c12',user: USERS[0], text: '¡Piranesi! Una de las mejores lecturas del año.',                                        time: '10m',  liked: false, likes: 6  },
    { id: 'c13',user: USERS[2], text: 'Leí las 272 páginas en un día. Imposible soltar.',                                       time: '1h',   liked: true,  likes: 9  },
    { id: 'c14',user: USERS[3], text: '¿Leíste "Jonathan Strange" de la misma autora? Más larga pero igual de especial.',       time: '2h',   liked: false, likes: 4  },
    { id: 'c15',user: USERS[1], text: 'La forma en que construye el misterio sin darte cuenta es magistral.',                   time: '3h',   liked: false, likes: 2  },
    { id: 'c16',user: USERS[0], text: 'Mi libro favorito de 2020.',                                                             time: '4h',   liked: false, likes: 8  },
  ],
};

export const READING_PROGRESS: Record<number, { current: number; total: number }> = {
  1: { current: 287, total: 662 },
  6: { current: 102, total: 545 },
};

// ─── Notifications ────────────────────────────────────────────

export type NotificationType =
  | 'new_follower'
  | 'liked_review'
  | 'commented_review'
  | 'liked_activity';

export type MockNotification = {
  id: string;
  type: NotificationType;
  user: MockUser;
  book?: MockBook;
  time: string;
  read: boolean;
};

export const NOTIFICATIONS: MockNotification[] = [
  { id: 'n1', type: 'new_follower',      user: USERS[0],                          time: '5m',   read: false },
  { id: 'n2', type: 'liked_review',      user: USERS[1], book: BOOKS[2],          time: '1h',   read: false },
  { id: 'n3', type: 'commented_review',  user: USERS[2], book: BOOKS[0],          time: '3h',   read: false },
  { id: 'n4', type: 'new_follower',      user: USERS[3],                          time: '6h',   read: true  },
  { id: 'n5', type: 'liked_activity',    user: USERS[0], book: BOOKS[7],          time: 'ayer', read: true  },
  { id: 'n6', type: 'liked_review',      user: USERS[3], book: BOOKS[1],          time: 'ayer', read: true  },
  { id: 'n7', type: 'new_follower',      user: USERS[1],                          time: '2d',   read: true  },
  { id: 'n8', type: 'commented_review',  user: USERS[0], book: BOOKS[6],          time: '3d',   read: true  },
];

// ─── Full user profiles (for other-user profile screens) ──────

export type MockFullUser = MockMe;

export const FULL_USERS: MockFullUser[] = [
  { id: 'u1', username: 'marisol_br', name: 'Marisol B.', av: 'MB', avC: '#7B5EA7', books: 34,  reviews: 18, followers: 245, following: 67,  goal: 40, goalYear: 2026, bio: 'Amante de la fantasía épica y la ficción literaria.' },
  { id: 'u2', username: 'carlos_lee', name: 'Carlos L.',  av: 'CL', avC: '#4A96B8', books: 112, reviews: 56, followers: 892, following: 134, goal: 60, goalYear: 2026, bio: 'Lector omnívoro. Ciencia ficción, thriller y clásicos.' },
  { id: 'u3', username: 'anasantos',  name: 'Ana S.',     av: 'AS', avC: '#5CAF7E', books: 28,  reviews: 11, followers: 71,  following: 53,  goal: 30, goalYear: 2026, bio: 'Novelas contemporáneas y memorias.' },
  { id: 'u4', username: 'luis_mr',    name: 'Luis MR',    av: 'LM', avC: '#8B3A3A', books: 65,  reviews: 29, followers: 178, following: 201, goal: 52, goalYear: 2026, bio: 'Historia, ensayo y ficción latinoamericana.' },
];

// ─── Blocked users ─────────────────────────────────────────────

export const BLOCKED_USERS: MockUser[] = [
  { id: 'b1', username: 'spam_acc123', name: 'Spam Account', av: 'SA', avC: '#787068' },
];
