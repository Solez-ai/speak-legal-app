import { useState, useEffect } from 'react';
import { supabase, saveDocument as saveDocumentToSupabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { Document } from '../lib/supabase';
import { useAuth } from './useAuth';

let subscribed = false; // ✅ Global flag to prevent multiple subscriptions

export function useDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      try {
        console.log('📄 Fetching user documents...');
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('✅ Fetched documents:', data.length);
        setDocuments(data as Document[]);
      } catch (error) {
        toast.error('Failed to fetch documents');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();

    if (!subscribed) {
      subscribed = true;
      supabase
        .channel('documents')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, (payload) => {
          console.log('📦 Realtime change:', payload);

          // Re-fetch on update/delete/insert
          fetchDocuments();
        })
        .subscribe();
    }
  }, [user]);

  const saveDocument = async (
    title: string,
    rawInput: string,
    simplifiedSections: any[],
    confusingClauses: any[],
    suggestedQuestions: any[]
  ) => {
    if (!user) {
      console.log('No user logged in, skipping document save');
      return;
    }

    try {
      const savedDoc = await saveDocumentToSupabase(
        title,
        rawInput,
        simplifiedSections,
        confusingClauses,
        suggestedQuestions
      );
      
      toast.success('Document saved successfully!');
      
      // Add to local state immediately
      setDocuments(prev => [savedDoc, ...prev]);
      
      return savedDoc;
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
      throw error;
    }
  };

  const deleteDocument = async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(`Deleted: ${title}`);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete document');
    }
  };

  return {
    documents,
    loading,
    saveDocument,
    deleteDocument
  };
}
