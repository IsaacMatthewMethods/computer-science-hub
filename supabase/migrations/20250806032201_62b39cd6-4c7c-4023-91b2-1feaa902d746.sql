-- Create posts table for the collaborative feeds
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  content TEXT,
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'link', 'file')),
  link_url TEXT,
  link_title TEXT,
  link_description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  course_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_media table for file attachments
CREATE TABLE public.post_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  filename TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_likes table for social interactions
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create post_comments table for discussions
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for posts
CREATE POLICY "Users can view public posts and enrolled course posts"
ON public.posts FOR SELECT
USING (
  is_public = true OR
  author_id = auth.uid() OR
  (course_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM enrollments 
    WHERE course_id = posts.course_id AND student_id = auth.uid()
  )) OR
  (course_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM courses 
    WHERE id = posts.course_id AND lecturer_id = auth.uid()
  ))
);

CREATE POLICY "Users can create posts"
ON public.posts FOR INSERT
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own posts"
ON public.posts FOR UPDATE
USING (author_id = auth.uid());

CREATE POLICY "Users can delete own posts"
ON public.posts FOR DELETE
USING (author_id = auth.uid());

-- RLS policies for post_media
CREATE POLICY "Users can view media for visible posts"
ON public.post_media FOR SELECT
USING (EXISTS (
  SELECT 1 FROM posts 
  WHERE id = post_media.post_id AND (
    is_public = true OR
    author_id = auth.uid() OR
    (course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM enrollments 
      WHERE course_id = posts.course_id AND student_id = auth.uid()
    )) OR
    (course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM courses 
      WHERE id = posts.course_id AND lecturer_id = auth.uid()
    ))
  )
));

CREATE POLICY "Users can upload media for own posts"
ON public.post_media FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM posts 
  WHERE id = post_media.post_id AND author_id = auth.uid()
));

CREATE POLICY "Users can delete media from own posts"
ON public.post_media FOR DELETE
USING (EXISTS (
  SELECT 1 FROM posts 
  WHERE id = post_media.post_id AND author_id = auth.uid()
));

-- RLS policies for post_likes
CREATE POLICY "Users can view likes on visible posts"
ON public.post_likes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM posts 
  WHERE id = post_likes.post_id AND (
    is_public = true OR
    author_id = auth.uid() OR
    (course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM enrollments 
      WHERE course_id = posts.course_id AND student_id = auth.uid()
    )) OR
    (course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM courses 
      WHERE id = posts.course_id AND lecturer_id = auth.uid()
    ))
  )
));

CREATE POLICY "Users can like posts"
ON public.post_likes FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike posts"
ON public.post_likes FOR DELETE
USING (user_id = auth.uid());

-- RLS policies for post_comments
CREATE POLICY "Users can view comments on visible posts"
ON public.post_comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM posts 
  WHERE id = post_comments.post_id AND (
    is_public = true OR
    author_id = auth.uid() OR
    (course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM enrollments 
      WHERE course_id = posts.course_id AND student_id = auth.uid()
    )) OR
    (course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM courses 
      WHERE id = posts.course_id AND lecturer_id = auth.uid()
    ))
  )
));

CREATE POLICY "Users can create comments"
ON public.post_comments FOR INSERT
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own comments"
ON public.post_comments FOR UPDATE
USING (author_id = auth.uid());

CREATE POLICY "Users can delete own comments"
ON public.post_comments FOR DELETE
USING (author_id = auth.uid());

-- Create triggers for updated_at columns
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_course_id ON public.posts(course_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_post_media_post_id ON public.post_media(post_id);
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_author_id ON public.post_comments(author_id);