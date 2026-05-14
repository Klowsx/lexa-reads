import { supabase } from "~/lib/supabase";
import { useAuthStore } from "~/stores/auth.store";

// Dentro del componente:
const setSession = useAuthStore((s) => s.setSession);

useEffect(() => {
  // Carga la sesión al arrancar la app
  supabase.auth.getSession().then(({ data }) => setSession(data.session));

  // Escucha cambios: login, logout, refresh del token
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  return () => subscription.unsubscribe();
}, []);
