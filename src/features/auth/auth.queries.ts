import { supabase } from "~/lib/supabase";
import { toAppError } from "~/types";
import type { LoginParams, RegisterParams } from "~/types";
import type { AuthResponse } from "@supabase/supabase-js";

export async function loginFn({
  email,
  password,
}: LoginParams): Promise<AuthResponse["data"]> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw toAppError(error);
  return data;
}

export async function registerFn({
  email,
  password,
  displayName,
}: RegisterParams): Promise<AuthResponse["data"]> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw toAppError(error);
  return data;
}

export async function requestResetPasswordFn({
  email,
}: {
  email: string;
}): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw toAppError(error);
}

export async function verifyPasswordResetCodeFn({
  email,
  token,
}: {
  email: string;
  token: string;
}): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });
  if (error) throw toAppError(error);
}

export async function updatePasswordFn({
  password,
}: {
  password: string;
}): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw toAppError(error);
  await supabase.auth.signOut();
}

export async function logoutFn(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw toAppError(error);
}
