// Function to create a new conversation
import { supabase } from "@/integrations/supabase/client";

export async function createConversation(participantIds: string[]) {
  try {
    // Ensure current user is included
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');
    
    const currentUserId = userData.user.id;
    const uniqueParticipantIds = [...new Set([...participantIds, currentUserId])];

    // Create conversation
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .insert({})
      .select('id')
      .single();

    if (conversationError) throw conversationError;

    // Add participants
    const participantInserts = uniqueParticipantIds.map(userId => ({
      conversation_id: conversationData.id,
      user_id: userId
    }));

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participantInserts);

    if (participantsError) throw participantsError;

    return conversationData.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

// Function to get conversations for the current user
export async function getUserConversations() {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        last_message_at,
        conversation_participants!inner(
          user_id,
          profiles!inner(
            first_name,
            last_name,
            avatar_url,
            course,
            role
          )
        )
      `)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

// Function to send a message
export async function sendMessage(conversationId: string, content: string) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userData.user.id,
        content: content
      })
      .select('id')
      .single();

    if (error) throw error;

    return data.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}