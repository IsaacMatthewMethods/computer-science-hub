-- Create a security definer function to check if user is in conversation
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
$function$;