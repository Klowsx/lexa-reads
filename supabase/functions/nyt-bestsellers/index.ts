// Edge Function: nyt-bestsellers
// Proxy de la NYT Books API (NEW-4 de la auditoría).
//
// Motivo: la API key de NYT NO debe ir en el bundle del cliente (`EXPO_PUBLIC_*`
// se empaqueta y es extraíble → cualquiera quema tu cuota / te banean). Esta
// función guarda la key como secret del servidor (`Deno.env`) y solo devuelve
// la lista de ISBNs del bestseller pedido. El cliente resuelve cada ISBN con su
// flujo cache-first habitual (`google-books.ts`), preservando RLS y CLAUDE.md §4.
//
// Despliegue:
//   supabase functions deploy nyt-bestsellers
//   supabase secrets set NYT_API_KEY=<tu_key>
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NYT_BASE = "https://api.nytimes.com/svc/books/v3/lists/current";

// Lista blanca de listas permitidas (evita usar la función como proxy abierto
// a cualquier endpoint de NYT).
const ALLOWED_LISTS = new Set([
  "combined-print-and-e-book-fiction",
  "combined-print-and-e-book-nonfiction",
  "hardcover-fiction",
  "hardcover-nonfiction",
  "young-adult-hardcover",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NYTBook {
  primary_isbn13?: string;
  primary_isbn10?: string;
}
interface NYTListResponse {
  results?: { books?: NYTBook[] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Requerir un usuario autenticado VÁLIDO: la función no es un proxy público.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate-limit: proxy barato pero acotado (30/min por usuario).
  const { data: allowed } = await supabase.rpc("hit_rate_limit", {
    p_key: `nyt:${user.id}`,
    p_max: 30,
    p_window_seconds: 60,
  });
  if (allowed === false) {
    return new Response(JSON.stringify({ isbns: [] }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("NYT_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "NYT_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let list = "combined-print-and-e-book-fiction";
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.list === "string" && ALLOWED_LISTS.has(body.list)) {
      list = body.list;
    }
  } catch {
    // sin body → lista por defecto
  }

  const res = await fetch(`${NYT_BASE}/${list}.json?api-key=${apiKey}`);
  if (!res.ok) {
    return new Response(JSON.stringify({ isbns: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const json = (await res.json()) as NYTListResponse;
  const isbns = (json.results?.books ?? [])
    .map((b) => b.primary_isbn13 || b.primary_isbn10)
    .filter((x): x is string => !!x);

  return new Response(JSON.stringify({ isbns }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
