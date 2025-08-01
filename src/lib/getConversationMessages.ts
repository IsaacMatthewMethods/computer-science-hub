import { supabase } from "@/integrations/supabase/client";

export async function getConversationMessages(conversationId: string) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        conversation_id,
        created_at,
        profiles:sender_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    throw error;
  }
}