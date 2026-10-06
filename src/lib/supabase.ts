import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://safyynezcnccdjnaxjyy.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_jbNqhO6r5HPXg_dHpdGrEQ_K-VT5WvN';

const getEnv = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch {}
  return '';
};

const rawUrl =
  getEnv('VITE_SUPABASE_URL') ||
  getEnv('SUPABASE_URL') ||
  DEFAULT_SUPABASE_URL;

const rawKey =
  getEnv('VITE_SUPABASE_ANON_KEY') ||
  getEnv('SUPABASE_PUBLISHABLE_KEY') ||
  getEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ||
  getEnv('SUPABASE_ANON_KEY') ||
  getEnv('VITE_SUPABASE_KEY') ||
  getEnv('SUPABASE_KEY') ||
  getEnv('SUPABASE_SECRET_KEY') ||
  DEFAULT_SUPABASE_KEY;

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
