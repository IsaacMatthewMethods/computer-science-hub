-- Fix the database migration with corrected function and comprehensive schema

-- Create enums for user roles and content types
CREATE TYPE user_role_enum AS ENUM ('student', 'lecturer', 'admin', 'counselor');
CREATE TYPE file_type_enum AS ENUM ('document', 'video', 'image', 'audio', 'archive', 'other');
CREATE TYPE assignment_status_enum AS ENUM ('draft', 'published', 'submitted', 'graded', 'late');
CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE notification_type_enum AS ENUM ('assignment', 'message', 'announcement', 'deadline', 'grade', 'system');

-- Update profiles table with comprehensive fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role_enum DEFAULT 'student';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year_of_study INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create security definer function to get user role (fixed return type)
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role_enum
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role_result user_role_enum;
BEGIN
  SELECT role INTO user_role_result FROM profiles WHERE id = user_uuid;
  RETURN COALESCE(user_role_result, 'student'::user_role_enum);
END;
$$;

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER DEFAULT 3,
  semester TEXT,
  year INTEGER,
  lecturer_id UUID REFERENCES profiles(id),
  max_students INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table (many-to-many for students and courses)
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES courses(id),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  grade TEXT,
  final_score DECIMAL(5,2),
  UNIQUE(student_id, course_id)
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  max_score DECIMAL(5,2) DEFAULT 100,
  weight DECIMAL(3,2) DEFAULT 1.0,
  status assignment_status_enum DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignment submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id),
  student_id UUID REFERENCES profiles(id),
  content TEXT,
  file_attachments TEXT[], -- Array of file IDs
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score DECIMAL(5,2),
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES profiles(id),
  status assignment_status_enum DEFAULT 'submitted',
  is_late BOOLEAN DEFAULT FALSE,
  UNIQUE(assignment_id, student_id)
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES courses(id), -- NULL for global announcements
  priority priority_enum DEFAULT 'medium',
  is_pinned BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type_enum DEFAULT 'system',
  related_id UUID, -- Generic reference to related object
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES courses(id),
  assignment_id UUID REFERENCES assignments(id),
  grade_item_name TEXT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) DEFAULT 100,
  weight DECIMAL(3,2) DEFAULT 1.0,
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  comments TEXT
);

-- Enhanced files table with new columns
ALTER TABLE files ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
ALTER TABLE files ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE files ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Update conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create comprehensive RLS policies for profiles
CREATE POLICY "Users can view profiles" ON profiles
FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for courses
CREATE POLICY "Anyone can view active courses" ON courses
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Lecturers and admins can manage courses" ON courses
FOR ALL USING (
  get_user_role(auth.uid()) IN ('lecturer', 'admin') OR
  lecturer_id = auth.uid()
);

-- Create RLS policies for files
CREATE POLICY "Users can view public files and enrolled course files" ON files
FOR SELECT USING (
  is_public = TRUE OR
  uploaded_by = auth.uid() OR
  (course_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.course_id = files.course_id 
    AND enrollments.student_id = auth.uid()
  )) OR
  (course_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = files.course_id 
    AND courses.lecturer_id = auth.uid()
  ))
);

CREATE POLICY "Users can upload files" ON files
FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update own files" ON files
FOR UPDATE USING (uploaded_by = auth.uid());

-- Create RLS policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for announcements
CREATE POLICY "Users can view relevant announcements" ON announcements
FOR SELECT USING (
  course_id IS NULL OR -- Global announcements
  EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.course_id = announcements.course_id 
    AND enrollments.student_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = announcements.course_id 
    AND courses.lecturer_id = auth.uid()
  )
);

CREATE POLICY "Lecturers and admins can manage announcements" ON announcements
FOR ALL USING (
  get_user_role(auth.uid()) IN ('lecturer', 'admin') OR
  author_id = auth.uid()
);

-- Create RLS policies for chat
CREATE POLICY "Users can view own conversations" ON conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = conversations.id 
    AND conversation_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can participate in conversations" ON conversation_participants
FOR SELECT USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM conversation_participants cp2 
  WHERE cp2.conversation_id = conversation_participants.conversation_id 
  AND cp2.user_id = auth.uid()
));

CREATE POLICY "Users can view messages in their conversations" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = messages.conversation_id 
    AND conversation_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = messages.conversation_id 
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Create useful indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_course ON profiles(course);
CREATE INDEX IF NOT EXISTS idx_courses_lecturer ON courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_files_course ON files(course_id);
CREATE INDEX IF NOT EXISTS idx_files_uploader ON files(uploaded_by);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

-- Set replica identity for realtime
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE announcements REPLICA IDENTITY FULL;