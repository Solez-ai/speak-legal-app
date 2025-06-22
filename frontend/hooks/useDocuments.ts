import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { Document } from '../lib/supabase';
import { useAuth } from './useAuth';

let subscribed = false; // ✅ Global flag to prevent multiple subscriptions

export function useDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

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
    deleteDocument
  };
}
