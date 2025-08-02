-- Enable realtime for chat tables
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add missing DELETE policy for files to enable proper file management
CREATE POLICY "Users can delete own files" 
ON public.files 
FOR DELETE 
USING (uploaded_by = auth.uid());

-- Enable realtime for files table for collaboration
ALTER TABLE public.files REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;