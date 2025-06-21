import { useState, useEffect } from 'react';
import { supabase, Document } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = async (
    title: string,
    rawInput: string,
    simplifiedSections: any[],
    confusingClauses: any[],
    suggestedQuestions: any[]
  ) => {
    if (!user) return null;

    try {
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

      if (error) throw error;
      
      // Refresh documents list
      fetchDocuments();
      return data;
    } catch (error) {
      console.error('Error saving document:', error);
      return null;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh documents list
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  return {
    documents,
    loading,
    fetchDocuments,
    saveDocument,
    deleteDocument,
  };
}
