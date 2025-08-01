export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string | null
          content: string
          course_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          priority: Database["public"]["Enums"]["priority_enum"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          course_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: Database["public"]["Enums"]["priority_enum"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          course_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: Database["public"]["Enums"]["priority_enum"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string | null
          content: string | null
          feedback: string | null
          file_attachments: string[] | null
          graded_at: string | null
          graded_by: string | null
          id: string
          is_late: boolean | null
          score: number | null
          status: Database["public"]["Enums"]["assignment_status_enum"] | null
          student_id: string | null
          submitted_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          content?: string | null
          feedback?: string | null
          file_attachments?: string[] | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_late?: boolean | null
          score?: number | null
          status?: Database["public"]["Enums"]["assignment_status_enum"] | null
          student_id?: string | null
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          content?: string | null
          feedback?: string | null
          file_attachments?: string[] | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_late?: boolean | null
          score?: number | null
          status?: Database["public"]["Enums"]["assignment_status_enum"] | null
          student_id?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          course_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          max_score: number | null
          status: Database["public"]["Enums"]["assignment_status_enum"] | null
          title: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          max_score?: number | null
          status?: Database["public"]["Enums"]["assignment_status_enum"] | null
          title: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          max_score?: number | null
          status?: Database["public"]["Enums"]["assignment_status_enum"] | null
          title?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string | null
          id: string
          joined_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_group: boolean | null
          last_message_at: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          last_message_at?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          last_message_at?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          course_code: string
          created_at: string | null
          credits: number | null
          description: string | null
          id: string
          is_active: boolean | null
          lecturer_id: string | null
          max_students: number | null
          name: string
          semester: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          course_code: string
          created_at?: string | null
          credits?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lecturer_id?: string | null
          max_students?: number | null
          name: string
          semester?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          course_code?: string
          created_at?: string | null
          credits?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lecturer_id?: string | null
          max_students?: number | null
          name?: string
          semester?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_lecturer_id_fkey"
            columns: ["lecturer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string | null
          enrolled_at: string | null
          final_score: number | null
          grade: string | null
          id: string
          status: string | null
          student_id: string | null
        }
        Insert: {
          course_id?: string | null
          enrolled_at?: string | null
          final_score?: number | null
          grade?: string | null
          id?: string
          status?: string | null
          student_id?: string | null
        }
        Update: {
          course_id?: string | null
          enrolled_at?: string | null
          final_score?: number | null
          grade?: string | null
          id?: string
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          category: string | null
          course_id: string | null
          created_at: string | null
          description: string | null
          download_count: number | null
          file_path: string
          file_size: number | null
          file_type: string | null
          filename: string
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          tags: string[] | null
          title: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          filename: string
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          tags?: string[] | null
          title?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          filename?: string
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          tags?: string[] | null
          title?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          assignment_id: string | null
          comments: string | null
          course_id: string | null
          grade_item_name: string
          graded_at: string | null
          graded_by: string | null
          id: string
          max_score: number | null
          score: number
          student_id: string | null
          weight: number | null
        }
        Insert: {
          assignment_id?: string | null
          comments?: string | null
          course_id?: string | null
          grade_item_name: string
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          max_score?: number | null
          score: number
          student_id?: string | null
          weight?: number | null
        }
        Update: {
          assignment_id?: string | null
          comments?: string | null
          course_id?: string | null
          grade_item_name?: string
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          max_score?: number | null
          score?: number
          student_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type_enum"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type_enum"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type_enum"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          course: string | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          email: string
          enrollment_date: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          last_name: string | null
          phone: string | null
          role: string | null
          student_id: string | null
          year_of_study: number | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          course?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email: string
          enrollment_date?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          student_id?: string | null
          year_of_study?: number | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          course?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string
          enrollment_date?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          student_id?: string | null
          year_of_study?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_conversation: {
        Args: { participant_id: string }
        Returns: number
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role_enum"]
      }
      send_message: {
        Args: { p_conversation_uuid: string; p_content: string }
        Returns: string
      }
      user_is_conversation_participant: {
        Args: { conversation_uuid: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      assignment_status_enum:
        | "draft"
        | "published"
        | "submitted"
        | "graded"
        | "late"
      file_type_enum:
        | "document"
        | "video"
        | "image"
        | "audio"
        | "archive"
        | "other"
      notification_type:
        | "message"
        | "friend_request"
        | "project_invite"
        | "system"
        | "reminder"
      notification_type_enum:
        | "assignment"
        | "message"
        | "announcement"
        | "deadline"
        | "grade"
        | "system"
      priority_enum: "low" | "medium" | "high" | "urgent"
      user_role: "student" | "counselor" | "admin"
      user_role_enum: "student" | "lecturer" | "admin" | "counselor"
      user_status: "online" | "offline" | "away" | "do_not_disturb"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      assignment_status_enum: [
        "draft",
        "published",
        "submitted",
        "graded",
        "late",
      ],
      file_type_enum: [
        "document",
        "video",
        "image",
        "audio",
        "archive",
        "other",
      ],
      notification_type: [
        "message",
        "friend_request",
        "project_invite",
        "system",
        "reminder",
      ],
      notification_type_enum: [
        "assignment",
        "message",
        "announcement",
        "deadline",
        "grade",
        "system",
      ],
      priority_enum: ["low", "medium", "high", "urgent"],
      user_role: ["student", "counselor", "admin"],
      user_role_enum: ["student", "lecturer", "admin", "counselor"],
      user_status: ["online", "offline", "away", "do_not_disturb"],
    },
  },
} as const
