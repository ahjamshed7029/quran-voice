import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'x-client-info': 'quran-voice-pwa'
    }
  }
});

export type LessonProgress = {
  userId: string;
  surah: number;
  verse: number;
  language: string;
  updatedAt: string;
};
