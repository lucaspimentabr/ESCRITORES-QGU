import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  '';

const rawKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  import.meta.env.SUPABASE_KEY ||
  import.meta.env.SUPABASE_SECRET_KEY ||
  '';

const clean = (val: string) => (val ? val.trim().replace(/^["']|["']$/g, '') : '');

export const supabaseUrl = clean(rawUrl).replace(/\/+$/, '');
export const supabaseAnonKey = clean(rawKey);

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('seu-projeto') &&
    !supabaseUrl.includes('your-project')
  );
};

// Instancia o cliente do Supabase com fallback seguro para nunca quebrar a aplicação caso as variáveis não estejam preenchidas
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
