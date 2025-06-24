import { useState, useEffect, useRef } from 'react';
import { supabase, saveDocument as saveDocumentToSupabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { Document } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<any>(null);
  const hasSetupSubscription = useRef(false);

  useEffect(() => {
    // Cleanup any existing subscription first
    if (subscriptionRef.current) {
      console.log('🔌 Cleaning up existing subscription');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
      hasSetupSubscription.current = false;
    }

    if (!user) {
      console.log('👤 No user logged in, clearing documents');
      setDocuments([]);
      setLoading(false);
      hasSetupSubscription.current = false;
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

    // Set up real-time subscription only once per user
    const setupSubscription = () => {
      if (hasSetupSubscription.current) {
        console.log('⚠️ Subscription already setup, skipping');
        return;
      }

      console.log('🔔 Setting up real-time subscription for user:', user.id);
      hasSetupSubscription.current = true;
      
      const subscription = supabase
        .channel(`documents-${user.id}`)
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
                  setDocuments(prev => {
                    // Check if document already exists to prevent duplicates
                    const exists = prev.some(doc => doc.id === payload.new.id);
                    if (exists) {
                      console.log('⚠️ Document already exists, skipping insert');
                      return prev;
                    }
                    return [payload.new as Document, ...prev];
                  });
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

      subscriptionRef.current = subscription;
    };

    // Fetch documents and setup subscription
    fetchDocuments().then(() => {
      setupSubscription();
    });

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        console.log('🔌 Cleaning up document subscription');
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      hasSetupSubscription.current = false;
    };
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-runs

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
      
      // Add document immediately for better UX (real-time will handle duplicates)
      setDocuments(prev => {
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
      
      // Remove document immediately for better UX (real-time will handle consistency)
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
