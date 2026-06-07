import { supabase } from "~/lib/supabase";
import { toAppError } from "~/types";
import type { Session } from "@supabase/supabase-js";

function extractTokensFromUrl(url: string) {
  let search = "";
  try {
    const parsed = new URL(url);
    search = parsed.search + parsed.hash.replace("#", "?");
  } catch {
    const queryIndex = url.indexOf("?");
    const hashIndex = url.indexOf("#");
    if (queryIndex !== -1) search = url.slice(queryIndex);
    else if (hashIndex !== -1) search = "?" + url.slice(hashIndex + 1);
  }
  if (!search) return { access_token: null, refresh_token: null, errorCode: null };
  const params = new URLSearchParams(search);
  return {
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token"),
    errorCode: params.get("error"),
  };
}

export async function createSessionFromUrl(url: string): Promise<Session | null> {
  const { access_token, refresh_token, errorCode } = extractTokensFromUrl(url);
  if (errorCode) throw new Error(errorCode);
  if (!access_token) return null;
  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token: refresh_token ?? "",
  });
  if (error) throw toAppError(error);
  return data.session;
}

export async function oauthLoginFn(
  provider: "google" | "apple"
): Promise<Session | null> {
  // Lazy require para evitar cargar expo-auth-session / expo-web-browser
  // en el startup bundle — en Expo Go Android falta ExpoCryptoAES.
  const { makeRedirectUri } = require("expo-auth-session");
  const WebBrowser = require("expo-web-browser");

  WebBrowser.maybeCompleteAuthSession();
  const redirectTo = makeRedirectUri({ path: "auth/callback" });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw toAppError(error);
  if (!data.url) throw new Error("No se pudo iniciar sesión con OAuth");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === "success") {
    return createSessionFromUrl(result.url);
  }
  return null;
}
