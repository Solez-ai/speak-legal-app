import { createClient } from '@supabase/supabase-js';

// Your actual Supabase configuration
const supabaseUrl = 'https://mvcqwliajatpzknmpmww.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Y3F3bGlhamF0cHprbm1wbXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjcwMDcsImV4cCI6MjA2NjEwMzAwN30.xcHLtyAK2LM1X6nCRDROwg-cayal0stTUCOphK6qOAg';

// Enhanced debugging
console.log('🔧 Supabase Configuration Debug:');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey.length);
console.log('Key starts with:', supabaseAnonKey.substring(0, 30));
console.log('Key ends with:', supabaseAnonKey.substring(supabaseAnonKey.length - 20));

// Validate JWT structure
try {
  const parts = supabaseAnonKey.split('.');
  if (parts.length === 3) {
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    console.log('🔍 JWT Header:', header);
    console.log('🔍 JWT Payload:', payload);
    console.log('🔍 JWT Role:', payload.role);
    console.log('🔍 JWT Expires:', new Date(payload.exp * 1000));
  }
} catch (error) {
  console.error('❌ Invalid JWT format:', error);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'speak-legal-app'
    }
  }
});

// Test connection immediately
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection test failed:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusCode: error.statusCode
    });
  } else {
    console.log('✅ Supabase connection test successful');
    console.log('Session data:', data);
  }
}).catch(err => {
  console.error('❌ Supabase connection test threw error:', err);
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
  console.log('💾 Attempting to save document:', title);
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('❌ User authentication error:', userError);
    throw new Error(`Authentication failed: ${userError.message}`);
  }

  if (!user) {
    console.error('❌ No authenticated user found');
    throw new Error('Not authenticated');
  }

  console.log('✅ User authenticated:', user.email);

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
    console.error('❌ Database insert error:', error);
    throw new Error(`Failed to save document: ${error.message}`);
  }

  console.log('✅ Document saved successfully:', data.id);
  return data;
}

// Fetch only current user's documents
export async function fetchMyDocuments(): Promise<Document[]> {
  console.log('📄 Fetching user documents...');
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('❌ User authentication error:', userError);
    return [];
  }

  if (!user) {
    console.log('ℹ️ No authenticated user, returning empty documents');
    return [];
  }

  console.log('✅ Fetching documents for user:', user.email);

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching documents:', error);
    return [];
  }

  console.log('✅ Fetched documents:', data?.length || 0);
  return data || [];
}

// Delete document (only if owned by current user)
export async function deleteDocument(documentId: string) {
  console.log('🗑️ Attempting to delete document:', documentId);
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('❌ Authentication error during delete:', userError);
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', user.id);

  if (error) {
    console.error('❌ Delete error:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }

  console.log('✅ Document deleted successfully');
}

// Send password reset email
export async function sendPasswordReset(email: string) {
  console.log('📧 Sending password reset email to:', email);
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    console.error('❌ Password reset error:', error);
    throw new Error(error.message);
  }

  console.log('✅ Password reset email sent');
}

// Update user profile
export async function updateUserProfile(updates: { full_name?: string; avatar_url?: string }) {
  console.log('👤 Updating user profile:', updates);
  
  const { data, error } = await supabase.auth.updateUser({
    data: updates
  });

  if (error) {
    console.error('❌ Profile update error:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  console.log('✅ Profile updated successfully');
  return data;
}

// Upload avatar to storage
export async function uploadAvatar(file: File, userId: string) {
  console.log('📸 Uploading avatar for user:', userId);
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('❌ Avatar upload error:', uploadError);
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  console.log('✅ Avatar uploaded successfully:', data.publicUrl);
  return data.publicUrl;
}
