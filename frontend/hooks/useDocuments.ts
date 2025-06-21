import { useState, useEffect } from 'react';
import { supabase, Document, saveDocument as saveDocumentToSupabase, fetchMyDocuments, deleteDocument as deleteDocumentFromSupabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

export function useDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    if (!user) {
      setDocuments([]);
      return;
    }

    setLoading(true);
    try {
      const docs = await fetchMyDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
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
    if (!user) {
      toast.error('You must be logged in to save documents');
      return null;
    }

    try {
      const document = await saveDocumentToSupabase(
        title,
        rawInput,
        simplifiedSections,
        confusingClauses,
        suggestedQuestions
      );
      
      toast.success('Document saved successfully!');
      
      // Refresh documents list
      await fetchDocuments();
      return document;
    } catch (error) {
      console.error('Error saving document:', error);
      const message = error instanceof Error ? error.message : 'Failed to save document';
      toast.error(message);
      return null;
    }
  };

  const deleteDocument = async (id: string, title: string) => {
    try {
      await deleteDocumentFromSupabase(id);
      toast.success(`"${title}" deleted successfully`);
      
      // Refresh documents list
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete document';
      toast.error(message);
    }
  };

  // Real-time subscription to documents changes
  useEffect(() => {
    if (!user) {
      setDocuments([]);
      return;
    }

    // Initial fetch
    fetchDocuments();

    // Set up real-time subscription
    const subscription = supabase
      .channel('documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Document change detected:', payload);
          // Refresh documents when changes occur
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    documents,
    loading,
    fetchDocuments,
    saveDocument,
    deleteDocument,
  };
}
