-- Add friend requests table for student connections
CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, requested_id)
);

-- Add friendships table for accepted friend connections
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensures one row per friendship
);

-- Add groups table for group chats
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  max_members INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add group members table
CREATE TABLE public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Add user presence table for online status
CREATE TABLE public.user_presence (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update files table to be properly structured for database storage
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS course_id TEXT;

-- Enable RLS for all new tables
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- RLS policies for friend_requests
CREATE POLICY "Users can view their own friend requests" 
ON public.friend_requests 
FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = requested_id);

CREATE POLICY "Users can create friend requests" 
ON public.friend_requests 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their friend requests" 
ON public.friend_requests 
FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = requested_id);

-- RLS policies for friendships
CREATE POLICY "Users can view their friendships" 
ON public.friendships 
FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create friendships" 
ON public.friendships 
FOR INSERT 
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS policies for groups
CREATE POLICY "Users can view public groups and groups they're members of" 
ON public.groups 
FOR SELECT 
USING (
  is_public = true OR 
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = groups.id AND user_id = auth.uid())
);

CREATE POLICY "Users can create groups" 
ON public.groups 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators and admins can update groups" 
ON public.groups 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin')
);

-- RLS policies for group_members
CREATE POLICY "Users can view group members for groups they're in" 
ON public.group_members 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
);

CREATE POLICY "Group admins can add members" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- RLS policies for user_presence
CREATE POLICY "Users can view all user presence" 
ON public.user_presence 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own presence" 
ON public.user_presence 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence" 
ON public.user_presence 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create functions for managing friendships
CREATE OR REPLACE FUNCTION public.send_friend_request(target_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_id UUID;
BEGIN
    -- Check if users are already friends
    IF EXISTS (
        SELECT 1 FROM public.friendships 
        WHERE (user1_id = auth.uid() AND user2_id = target_user_id) 
           OR (user1_id = target_user_id AND user2_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Users are already friends';
    END IF;

    -- Check if request already exists
    IF EXISTS (
        SELECT 1 FROM public.friend_requests 
        WHERE (requester_id = auth.uid() AND requested_id = target_user_id)
           OR (requester_id = target_user_id AND requested_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Friend request already exists';
    END IF;

    -- Create friend request
    INSERT INTO public.friend_requests (requester_id, requested_id)
    VALUES (auth.uid(), target_user_id)
    RETURNING id INTO request_id;

    RETURN request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    friendship_id UUID;
    req_record RECORD;
BEGIN
    -- Get the request details
    SELECT * INTO req_record 
    FROM public.friend_requests 
    WHERE id = request_id AND requested_id = auth.uid() AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Friend request not found or not authorized';
    END IF;

    -- Update request status
    UPDATE public.friend_requests 
    SET status = 'accepted', updated_at = now()
    WHERE id = request_id;

    -- Create friendship (ensure user1_id < user2_id)
    INSERT INTO public.friendships (user1_id, user2_id)
    VALUES (
        LEAST(req_record.requester_id, req_record.requested_id),
        GREATEST(req_record.requester_id, req_record.requested_id)
    )
    RETURNING id INTO friendship_id;

    RETURN friendship_id;
END;
$$;

-- Create function to update user presence
CREATE OR REPLACE FUNCTION public.update_user_presence(new_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_presence (user_id, status, last_seen, updated_at)
    VALUES (auth.uid(), new_status, now(), now())
    ON CONFLICT (user_id)
    DO UPDATE SET
        status = new_status,
        last_seen = now(),
        updated_at = now();
END;
$$;

-- Update conversations table to support groups
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now();