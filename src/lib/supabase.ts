import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://dodnjkqtqzxepzmdrdou.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZG5qa3F0cXp4ZXB6bWRyZG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTUzNDgsImV4cCI6MjA4OTg5MTM0OH0.BS8ay79WwocHcHwRNxLUM_4rPw0o2XZdpuauKzlHnqo';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
