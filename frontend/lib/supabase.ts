import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mvcqwliajatpzknmpmww.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Y3F3bGlhamF0cHprbm1wbXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3NjE2MDAsImV4cCI6MjA1MTMzNzYwMH0.example';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Document {
  id: string;
  user_id: string;
  title: string;
  raw_input: string;
  simplified_sections: any[];
  confusing_clauses: any[];
  suggested_questions: any[];
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
