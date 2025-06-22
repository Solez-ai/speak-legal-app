import { createClient } from '@supabase/supabase-js';

// Updated with your actual Supabase anon key
const supabaseUrl = 'https://mvcqwliajatpzknmpmww.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Y3F3bGlhamF0cHprbm1wbXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjcwMDcsImV4cCI6MjA2NjEwMzAwN30.xcHLtyAK2LM1X6nCRDROwg-cayal0stTUCOphK6qOAg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Debug logging for development
console.log('Supabase client initialized:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey.length,
  keyPrefix: supabaseAnonKey.substring(0, 20) + '...'
});

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

// Save document with user authentication
export async function saveDocument(
  title: string,
  rawInput: string,
  simplifiedSections: any[],
  confusingClauses: any[],
  suggestedQuestions: any[]
) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      title,
      raw_input: rawInput,
      simplified_sections: simplifiedSections,
      confusing_clauses: confusingClauses,
      suggested_questions: suggestedQuestions,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save document: ${error.message}`);
  }

  return data;
}

// Fetch only current user's documents
export async function fetchMyDocuments(): Promise<Document[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }

  return data || [];
}

// Delete document (only if owned by current user)
export async function deleteDocument(documentId: string) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', user.id); // Ensure user can only delete their own documents

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

// Send password reset email
export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

// Update user profile
export async function updateUserProfile(updates: { full_name?: string; avatar_url?: string }) {
  const { data, error } = await supabase.auth.updateUser({
    data: updates
  });

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data;
}

// Upload avatar to storage
export async function uploadAvatar(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
