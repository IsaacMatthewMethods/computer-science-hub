-- Fix the infinite recursion by updating RLS policies

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can participate in conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;

-- Create new policies without infinite recursion for conversation_participants
CREATE POLICY "Users can view conversation participants" 
ON public.conversation_participants 
FOR SELECT 
USING (auth.uid() = user_id OR public.user_is_in_conversation(conversation_id, auth.uid()));

CREATE POLICY "Users can join conversations" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update messages policy
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (public.user_is_in_conversation(conversation_id, auth.uid()));

-- Update conversations policy
CREATE POLICY "Users can view conversations they participate in" 
ON public.conversations 
FOR SELECT 
USING (public.user_is_in_conversation(id, auth.uid()));

CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = created_by OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update conversations they participate in" 
ON public.conversations 
FOR UPDATE 
USING (public.user_is_in_conversation(id, auth.uid()));