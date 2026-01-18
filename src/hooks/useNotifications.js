import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export function useNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Listen for new messages directed to the current user
    const channel = supabase
      .channel('global_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          // Fetch sender name for better notification
          const { data: senderData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', payload.new.sender_id)
            .single();

          const senderName = senderData?.name || 'Someone';
          
          // Sound removed as per user request

          // Show Toast
          toast.success(`New message from ${senderName}`, {
            duration: 4000,
            position: 'top-right',
            icon: '💬',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {};
}
