import { useState, useEffect } from 'react';
import { supabase, saveDocument as saveDocumentToSupabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { Document } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      console.log('👤 No user logged in, clearing documents');
      setDocuments([]);
      setLoading(false);
      return;
    }

    console.log('📄 User logged in, fetching documents for:', user.email);
    
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching user documents...');
        
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching documents:', error);
          throw error;
        }

        console.log('✅ Fetched documents:', data?.length || 0);
        setDocuments(data as Document[] || []);
      } catch (error) {
        console.error('❌ Failed to fetch documents:', error);
        toast.error('Failed to fetch documents');
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();

    // Set up real-time subscription for document changes
    console.log('🔔 Setting up real-time subscription for user:', user.id);
    
    const subscription = supabase
      .channel(`documents:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📦 Real-time document change:', payload.eventType, payload.new?.title || payload.old?.title);
          
          switch (payload.eventType) {
            case 'INSERT':
              if (payload.new) {
                console.log('➕ Adding new document to state');
                setDocuments(prev => [payload.new as Document, ...prev]);
              }
              break;
            case 'UPDATE':
              if (payload.new) {
                console.log('✏️ Updating document in state');
                setDocuments(prev => 
                  prev.map(doc => 
                    doc.id === payload.new.id ? payload.new as Document : doc
                  )
                );
              }
              break;
            case 'DELETE':
              if (payload.old) {
                console.log('🗑️ Removing document from state');
                setDocuments(prev => 
                  prev.filter(doc => doc.id !== payload.old.id)
                );
              }
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up document subscription');
      subscription.unsubscribe();
    };
  }, [user]);

  const saveDocument = async (
    title: string,
    rawInput: string,
    simplifiedSections: any[],
    confusingClauses: any[],
    suggestedQuestions: any[]
  ) => {
    if (!user) {
      console.log('❌ No user logged in, cannot save document');
      throw new Error('User not logged in');
    }

    try {
      console.log('💾 Saving document:', title);
      
      const savedDoc = await saveDocumentToSupabase(
        title,
        rawInput,
        simplifiedSections,
        confusingClauses,
        suggestedQuestions
      );
      
      console.log('✅ Document saved successfully:', savedDoc.id);
      
      // The real-time subscription will handle adding it to the state
      // But we can also add it immediately for better UX
      setDocuments(prev => {
        // Check if document already exists (in case real-time was faster)
        const exists = prev.some(doc => doc.id === savedDoc.id);
        if (exists) {
          return prev;
        }
        return [savedDoc, ...prev];
      });
      
      return savedDoc;
    } catch (error) {
      console.error('❌ Error saving document:', error);
      throw error;
    }
  };

  const deleteDocument = async (id: string, title: string) => {
    if (!user) {
      console.log('❌ No user logged in, cannot delete document');
      throw new Error('User not logged in');
    }

    try {
      console.log('🗑️ Deleting document:', title);
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own documents

      if (error) {
        console.error('❌ Error deleting document:', error);
        throw error;
      }

      console.log('✅ Document deleted successfully');
      toast.success(`Deleted: ${title}`);
      
      // The real-time subscription will handle removing it from the state
      // But we can also remove it immediately for better UX
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
      toast.error('Failed to delete document');
      throw error;
    }
  };

  return {
    documents,
    loading,
    saveDocument,
    deleteDocument
  };
}
