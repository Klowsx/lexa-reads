-- ============================================================
-- Lexa Reads — Migración 004: notification_preferences
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

CREATE TABLE notification_preferences (
  user_id             uuid        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  push_new_follower   boolean     DEFAULT true,
  push_activity_like  boolean     DEFAULT true,
  push_review_like    boolean     DEFAULT true,
  push_comment        boolean     DEFAULT true,
  push_recommendation boolean     DEFAULT true,
  email_weekly_digest boolean     DEFAULT false,
  updated_at          timestamptz DEFAULT now()
);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario gestiona sus preferencias"
  ON notification_preferences FOR ALL USING (auth.uid() = user_id);


-- Actualizar handle_new_user para insertar preferencias al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    'user_' || SUBSTRING(NEW.id::text, 1, 8),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Lector'),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
