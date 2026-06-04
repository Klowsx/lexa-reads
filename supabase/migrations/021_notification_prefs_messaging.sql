-- ============================================================
-- Lexa Reads — Migración 021: preferencias de push para mensajería
-- ============================================================
-- Granularidad de opt-out para DMs y clubes (respeta el consentimiento ya
-- existente). send-push las lee para decidir si envía.
-- ============================================================

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS push_dm   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_club boolean NOT NULL DEFAULT true;
