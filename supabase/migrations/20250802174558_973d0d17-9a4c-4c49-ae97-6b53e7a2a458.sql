-- Fix infinite recursion in conversation_participants RLS policy
-- First, create a security definer function to check if user is in conversation
CREATE OR REPLACE FUNCTION public.user_is_in_conversation(conversation_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = conversation_uuid 
    AND user_id = user_uuid
  );
END;
$function$

-- Drop the existing policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can participate in conversations" ON public.conversation_participants;

-- Create a new policy without infinite recursion
CREATE POLICY "Users can view conversation participants" 
ON public.conversation_participants 
FOR SELECT 
USING (auth.uid() = user_id OR public.user_is_in_conversation(conversation_id, auth.uid()));

-- Allow users to insert conversation participants (needed for creating conversations)
CREATE POLICY "Users can join conversations" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update messages policy to use the new function
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (public.user_is_in_conversation(conversation_id, auth.uid()));

-- Update conversations policy to use the new function
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;

CREATE POLICY "Users can view conversations they participate in" 
ON public.conversations 
FOR SELECT 
USING (public.user_is_in_conversation(id, auth.uid()));

-- Allow users to create conversations
CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = created_by OR auth.uid() IS NOT NULL);

-- Allow updating conversation timestamps when messages are sent
CREATE POLICY "Users can update conversations they participate in" 
ON public.conversations 
FOR UPDATE 
USING (public.user_is_in_conversation(id, auth.uid()));

-- Enable realtime for chat tables
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;