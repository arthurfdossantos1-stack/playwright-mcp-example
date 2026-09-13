import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com service role. Use SOMENTE no servidor (worker de follow-up).
 * Ignora RLS, entao nunca importe isso em codigo de cliente.
 */
export function criarClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o cliente administrativo.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
