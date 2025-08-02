-- Add missing DELETE policy for files to enable proper file management
CREATE POLICY "Users can delete own files" 
ON public.files 
FOR DELETE 
USING (uploaded_by = auth.uid());

-- Enable realtime for files table for collaboration
ALTER TABLE public.files REPLICA IDENTITY FULL;