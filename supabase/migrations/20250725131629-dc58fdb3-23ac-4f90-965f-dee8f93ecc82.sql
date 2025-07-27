-- Fix security warnings by adding proper search paths to functions

-- Fix user_is_conversation_participant function
CREATE OR REPLACE FUNCTION public.user_is_conversation_participant(conversation_uuid uuid, user_uuid uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = conversation_uuid 
    AND user_id = user_uuid
  );
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    'student'::user_role
  );
  RETURN new;
END;
$$;

-- Fix create_conversation function
CREATE OR REPLACE FUNCTION public.create_conversation(participant_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth AS $$
DECLARE
    new_conversation_id BIGINT;
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
$$;

-- Fix send_message functions
CREATE OR REPLACE FUNCTION public.send_message(p_conversation_id bigint, p_content text)
RETURNS messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth AS $$
DECLARE
    new_message public.messages;
BEGIN
    -- Validate that the user is part of the conversation
    IF NOT EXISTS (
        SELECT 1 
        FROM public.conversation_participants 
        WHERE conversation_id = p_conversation_id 
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Not authorized to send message in this conversation';
    END IF;

    -- Insert the message
    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (p_conversation_id, auth.uid(), p_content)
    RETURNING * INTO new_message;

    -- Update conversation's last message timestamp
    UPDATE public.conversations
    SET last_message_at = NOW()
    WHERE id = p_conversation_id;

    RETURN new_message;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_message(p_conversation_uuid uuid, p_content text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth AS $$
DECLARE
    v_message_uuid UUID;
    v_sender_id UUID;
    v_conversation_exists BOOLEAN;
    v_user_in_conversation BOOLEAN;
BEGIN
    -- Get current user
    v_sender_id := auth.uid();

    -- Validate sender exists
    IF v_sender_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Check conversation exists
    SELECT EXISTS (
        SELECT 1 
        FROM public.conversations 
        WHERE id = p_conversation_uuid
    ) INTO v_conversation_exists;

    IF NOT v_conversation_exists THEN
        RAISE EXCEPTION 'Conversation does not exist';
    END IF;

    -- Check user is in conversation
    SELECT EXISTS (
        SELECT 1 
        FROM public.conversation_participants
        WHERE conversation_id = p_conversation_uuid
        AND user_id = v_sender_id
    ) INTO v_user_in_conversation;

    IF NOT v_user_in_conversation THEN
        RAISE EXCEPTION 'User not a participant in this conversation';
    END IF;

    -- Insert message
    INSERT INTO public.messages (
        conversation_id, 
        sender_id, 
        content
    ) VALUES (
        p_conversation_uuid,
        v_sender_id, 
        p_content
    ) RETURNING id INTO v_message_uuid;

    -- Update conversation last message timestamp
    UPDATE public.conversations
    SET last_message_at = NOW()
    WHERE id = p_conversation_uuid;

    RETURN v_message_uuid;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in send_message: %', SQLERRM;
        RAISE;
END;
$$;