-- Fix create_conversation function to return UUID instead of bigint
DROP FUNCTION IF EXISTS public.create_conversation(uuid);

CREATE OR REPLACE FUNCTION public.create_conversation(participant_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
    new_conversation_id UUID;
BEGIN
    -- Check if conversation already exists
    SELECT c.id INTO new_conversation_id
    FROM public.conversations c
    JOIN public.conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN public.conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE cp1.user_id = auth.uid()
    AND cp2.user_id = participant_id
    LIMIT 1;

    -- If no existing conversation, create a new one
    IF new_conversation_id IS NULL THEN
        INSERT INTO public.conversations (last_message_at)
        VALUES (NOW())
        RETURNING id INTO new_conversation_id;

        -- Add current user to conversation
        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES (new_conversation_id, auth.uid());

        -- Add target participant to conversation
        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES (new_conversation_id, participant_id);
    END IF;

    RETURN new_conversation_id;
END;
$function$;