-- Fix security issues: Add missing RLS policies and fix function security

-- Add missing RLS policies for tables that have RLS enabled but no policies

-- RLS policies for enrollments
CREATE POLICY "Students can view own enrollments" ON enrollments
FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Lecturers can view course enrollments" ON enrollments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = enrollments.course_id 
    AND courses.lecturer_id = auth.uid()
  )
);

CREATE POLICY "Students can enroll in courses" ON enrollments
FOR INSERT WITH CHECK (student_id = auth.uid());

-- RLS policies for assignments
CREATE POLICY "Users can view assignments for enrolled courses" ON assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.course_id = assignments.course_id 
    AND enrollments.student_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = assignments.course_id 
    AND courses.lecturer_id = auth.uid()
  )
);

CREATE POLICY "Lecturers can manage assignments" ON assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = assignments.course_id 
    AND courses.lecturer_id = auth.uid()
  ) OR
  created_by = auth.uid()
);

-- RLS policies for assignment submissions
CREATE POLICY "Students can view own submissions" ON assignment_submissions
FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can submit assignments" ON assignment_submissions
FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own submissions" ON assignment_submissions
FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Lecturers can view and grade submissions" ON assignment_submissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.id = assignment_submissions.assignment_id 
    AND c.lecturer_id = auth.uid()
  )
);

-- RLS policies for grades
CREATE POLICY "Students can view own grades" ON grades
FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Lecturers can view and manage grades for their courses" ON grades
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = grades.course_id 
    AND courses.lecturer_id = auth.uid()
  ) OR
  graded_by = auth.uid()
);

-- Fix function security by setting proper search_path

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role_enum
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role_result user_role_enum;
BEGIN
  SELECT role INTO user_role_result FROM profiles WHERE id = user_uuid;
  RETURN COALESCE(user_role_result, 'student'::user_role_enum);
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix handle_new_user function  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Upsert approach to handle potential conflicts
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
    
    RETURN NEW;
END;
$$;