import { fixed } from '~/theme/colors';

export type BookStatus = 'want_to_read' | 'reading' | 'read' | 'abandoned';

export const STATUS_META: Record<BookStatus, { label: string; color: string }> = {
  want_to_read: { label: 'Quiero leer',  color: fixed.status.want      },
  reading:      { label: 'Leyendo',      color: fixed.status.reading   },
  read:         { label: 'Leído',        color: fixed.status.read      },
  abandoned:    { label: 'Abandonado',   color: fixed.status.abandoned },
};

export const STATUS_ORDER: BookStatus[] = ['want_to_read', 'reading', 'read', 'abandoned'];
