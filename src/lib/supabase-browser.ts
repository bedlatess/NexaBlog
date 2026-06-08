import { createClient } from "@supabase/supabase-js";

export type AdminPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  tags: string[];
  draft: boolean;
  featured: boolean;
  published_at: string | null;
  updated_at: string;
  created_at: string;
  author_id: string | null;
};

export function getSupabaseConfig() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  return {
    url,
    anonKey,
    configured: Boolean(url && anonKey)
  };
}

export function createBrowserSupabase() {
  const config = getSupabaseConfig();
  if (!config.configured) return null;

  return createClient(config.url!, config.anonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

