
-- Create enum for file types
CREATE TYPE file_type AS ENUM ('document', 'video', 'image', 'audio', 'other');

-- Create enum for project status
CREATE TYPE project_status AS ENUM ('active', 'completed', 'paused', 'cancelled');

-- Create enum for study group status
CREATE TYPE study_group_status AS ENUM ('active', 'inactive', 'archived');

-- Create enum for notification types
CREATE TYPE notification_type AS ENUM ('message', 'file_upload', 'project_update', 'assignment', 'announcement');

-- Create files table for file management
CREATE TABLE public.files (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    path text NOT NULL,
    size bigint NOT NULL,
    type file_type NOT NULL,
    mime_type text,
    uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id text,
    description text,
    tags text[],
    is_public boolean DEFAULT false,
    download_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create projects table for collaboration
CREATE TABLE public.projects (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status project_status DEFAULT 'active',
    deadline timestamp with time zone,
    course_id text,
    max_members integer DEFAULT 10,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create project members table
CREATE TABLE public.project_members (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text DEFAULT 'member',
    joined_at timestamp with time zone DEFAULT now(),
    UNIQUE(project_id, user_id)
);

-- Create study groups table
CREATE TABLE public.study_groups (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    course_id text NOT NULL,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status study_group_status DEFAULT 'active',
    max_members integer DEFAULT 20,
    meeting_schedule text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create study group members table
CREATE TABLE public.study_group_members (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at timestamp with time zone DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    action_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for files
CREATE POLICY "Users can view public files" ON public.files FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own files" ON public.files FOR SELECT USING (auth.uid() = uploaded_by);
CREATE POLICY "Users can upload files" ON public.files FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users can update their own files" ON public.files FOR UPDATE USING (auth.uid() = uploaded_by);
CREATE POLICY "Users can delete their own files" ON public.files FOR DELETE USING (auth.uid() = uploaded_by);

-- RLS policies for projects
CREATE POLICY "Users can view projects they are members of" ON public.projects FOR SELECT USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
);
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Project creators can update their projects" ON public.projects FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Project creators can delete their projects" ON public.projects FOR DELETE USING (auth.uid() = created_by);

-- RLS policies for project members
CREATE POLICY "Users can view project members for their projects" ON public.project_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND created_by = auth.uid()) OR
    user_id = auth.uid()
);
CREATE POLICY "Project creators can add members" ON public.project_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND created_by = auth.uid())
);
CREATE POLICY "Users can leave projects" ON public.project_members FOR DELETE USING (user_id = auth.uid());

-- RLS policies for study groups
CREATE POLICY "Users can view all study groups" ON public.study_groups FOR SELECT USING (true);
CREATE POLICY "Users can create study groups" ON public.study_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Study group creators can update their groups" ON public.study_groups FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Study group creators can delete their groups" ON public.study_groups FOR DELETE USING (auth.uid() = created_by);

-- RLS policies for study group members
CREATE POLICY "Users can view study group members" ON public.study_group_members FOR SELECT USING (true);
CREATE POLICY "Users can join study groups" ON public.study_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave study groups" ON public.study_group_members FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for messages and notifications
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.messages;
ALTER publication supabase_realtime ADD TABLE public.notifications;

-- Create function to handle automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix auth session expiry (extend from 1 hour to 24 hours)
UPDATE auth.config SET value = '86400' WHERE key = 'JWT_EXPIRY';

-- Add password strength requirements
UPDATE auth.config SET value = '8' WHERE key = 'PASSWORD_MIN_LENGTH';
