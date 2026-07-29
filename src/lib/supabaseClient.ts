import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY не заданы. ' +
    'Загрузка треков, модерация и вход в аккаунт работать не будут, ' +
    'пока не заполните .env — см. SUPABASE_SETUP.md.'
  );
}

// anon key безопасно хранить на клиенте — доступ к данным ограничивается
// политиками Row Level Security на стороне Supabase (см. supabase/schema.sql).
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
