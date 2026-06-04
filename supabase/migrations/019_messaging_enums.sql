-- ============================================================
-- Lexa Reads — Migración 019: enums de mensajería (clubes + DMs)
-- ============================================================
-- Va SEPARADA de 020 a propósito (lección D-3): un valor de enum recién
-- agregado con `ALTER TYPE ... ADD VALUE` NO puede usarse en la misma
-- transacción que lo crea. 020 (triggers que insertan notificaciones de tipo
-- 'dm_message', 'club_message', etc.) los usa, así que deben estar committeados
-- antes. Aplicar 019 y LUEGO 020.
-- ============================================================

-- Tipos de notificación nuevos (los de buddy/club ya existían en 001).
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'dm_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'dm_message';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'club_message';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'club_join_request';

-- Reportar mensajes y clubes (UGC → bloqueante de tiendas).
ALTER TYPE report_target_type ADD VALUE IF NOT EXISTS 'message';
ALTER TYPE report_target_type ADD VALUE IF NOT EXISTS 'club';
