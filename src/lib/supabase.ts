import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until the two Supabase environment variables are set. */
export const configured = Boolean(url && key);

let client: SupabaseClient | null = null;

/** The shared Supabase client. Only call when `configured` is true. */
export function db(): SupabaseClient {
  if (!client) {
    if (!url || !key) throw new Error("Supabase is not configured.");
    client = createClient(url, key);
  }
  return client;
}
