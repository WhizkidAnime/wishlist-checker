import { createClient } from '@supabase/supabase-js';

// Получаем URL и ключи из переменных окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://umvghchvnsuqnxrvzhct.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdmdoY2h2bnN1cW54cnZ6aGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NzEwNTgsImV4cCI6MjA2NDA0NzA1OH0.ERrygSnyyzUBdl4d_DuLw1bNL8qI2n-zUi3Yn6qRvxE';

// Проверяем, что переменные окружения установлены
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials are missing. Running in local-only mode.');
}

// Создаем клиент Supabase (если credentials доступны)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? (() => {
      const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          // Разрешаем автоматический refresh токенов только в production
          autoRefreshToken: true,
          persistSession: true
        }
      });
      // console.log('✅ Supabase client initialized successfully');
      return client;
    })()
  : (() => {
      // console.log('📦 Running in local storage mode (Supabase not configured)');
      return null;
    })();

// Вспомогательная функция для проверки доступности Supabase
export const isSupabaseAvailable = (): boolean => {
  return supabase !== null;
};

// Типы для нашей базы данных
export interface Database {
  public: {
    Tables: {
      wishlist_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          item_type: string | null;
          link: string;
          price: number;
          currency: string;
          is_bought: boolean;
          comment: string;
          category: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          item_type?: string | null;
          link?: string;
          price?: number;
          currency?: string;
          is_bought?: boolean;
          comment?: string;
          category?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          item_type?: string | null;
          link?: string;
          price?: number;
          currency?: string;
          is_bought?: boolean;
          comment?: string;
          category?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme: string;
          last_sync: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: string;
          last_sync?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          theme?: string;
          last_sync?: string;
          updated_at?: string;
        };
      };
    };
  };
} 