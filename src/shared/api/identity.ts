import { supabase } from "./legacyAdapter";

export function observeIdentity(onChange: (recovering: boolean) => void) {
  const result = supabase?.auth.onAuthStateChange((event) => {
    onChange(event === "PASSWORD_RECOVERY");
  });
  return () => result?.data.subscription.unsubscribe();
}

export async function signOut() {
  const result = await supabase?.auth.signOut();
  if (result?.error) throw result.error;
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error("Conecte o servidor para habilitar o painel publicado. A demonstração está disponível somente no ambiente local.");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  if (!supabase) throw new Error("Servidor não configurado.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function requestPasswordReset(email: string, redirectTo: string) {
  if (!supabase) throw new Error("Servidor não configurado.");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}
