export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assignment_skills: {
        Row: {
          assignment_id: string
          skill_id: string
        }
        Insert: {
          assignment_id: string
          skill_id: string
        }
        Update: {
          assignment_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_skills_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_templates: {
        Row: {
          created_at: string
          description: string | null
          grade: number
          id: string
          metadata: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          grade: number
          id?: string
          metadata?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          grade?: number
          id?: string
          metadata?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          artifact_type: string
          artifact_url: string | null
          created_at: string
          display_layout: Json | null
          grade: number | null
          id: string
          is_original_work: boolean
          is_team_project: boolean
          month: string
          pdf_url: string | null
          status: string
          student_id: string
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          artifact_type: string
          artifact_url?: string | null
          created_at?: string
          display_layout?: Json | null
          grade?: number | null
          id?: string
          is_original_work?: boolean
          is_team_project?: boolean
          month: string
          pdf_url?: string | null
          status?: string
          student_id: string
          subject: string
          title: string
          updated_at?: string
        }
        Update: {
          artifact_type?: string
          artifact_url?: string | null
          created_at?: string
          display_layout?: Json | null
          grade?: number | null
          id?: string
          is_original_work?: boolean
          is_team_project?: boolean
          month?: string
          pdf_url?: string | null
          status?: string
          student_id?: string
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_student_id_fkey"
            columns: ["student_id"]
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
          message: string
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
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
      portfolio_themes: {
        Row: {
          colors: Json | null
          created_at: string
          id: string
          layout: Json | null
          typography: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          colors?: Json | null
          created_at?: string
          id?: string
          layout?: Json | null
          typography?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          colors?: Json | null
          created_at?: string
          id?: string
          layout?: Json | null
          typography?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_themes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      question_imports: {
        Row: {
          created_at: string
          file_name: string
          id: string
          imported_count: number | null
          status: string | null
          teacher_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          imported_count?: number | null
          status?: string | null
          teacher_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          imported_count?: number | null
          status?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_imports_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          question_key: string
          response_text: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          question_key: string
          response_text?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          question_key?: string
          response_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string
          grade_level: number[] | null
          id: string
          name: string
          subject: string[] | null
        }
        Insert: {
          created_at?: string
          grade_level?: number[] | null
          id?: string
          name: string
          subject?: string[] | null
        }
        Update: {
          created_at?: string
          grade_level?: number[] | null
          id?: string
          name?: string
          subject?: string[] | null
        }
        Relationships: []
      }
      teacher_assessments: {
        Row: {
          created_at: string
          id: string
          remarks: string | null
          selected_skills: string[]
          skills_justification: string | null
          updated_at: string
          verification_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          remarks?: string | null
          selected_skills?: string[]
          skills_justification?: string | null
          updated_at?: string
          verification_id: string
        }
        Update: {
          created_at?: string
          id?: string
          remarks?: string | null
          selected_skills?: string[]
          skills_justification?: string | null
          updated_at?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assessments_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      template_questions: {
        Row: {
          category: string | null
          created_at: string
          hint: string | null
          id: string
          label: string
          options: string[] | null
          order_index: number
          required: boolean | null
          tags: string[] | null
          template_id: string | null
          type: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          hint?: string | null
          id?: string
          label: string
          options?: string[] | null
          order_index: number
          required?: boolean | null
          tags?: string[] | null
          template_id?: string | null
          type: string
        }
        Update: {
          category?: string | null
          created_at?: string
          hint?: string | null
          id?: string
          label?: string
          options?: string[] | null
          order_index?: number
          required?: boolean | null
          tags?: string[] | null
          template_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "assignment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          assignment_id: string
          created_at: string
          feedback: string | null
          id: string
          status: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          status?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          status?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verifications_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
