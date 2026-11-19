export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      discoveries: {
        Row: {
          category_id: string
          created_at: string
          deep_dive: string
          id: string
          image_alt: string
          image_url: string | null
          intro: string
          is_published: boolean
          key_points: string[]
          published_at: string
          reading_minutes: number
          scheduled_on: string | null
          slug: string
          sources: Json
          summary: string
          takeaway: string | null
          takeaway_kind: string | null
          title: string
          updated_at: string
          why_today: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          deep_dive: string
          id?: string
          image_alt?: string
          image_url?: string | null
          intro: string
          is_published?: boolean
          key_points?: string[]
          published_at?: string
          reading_minutes?: number
          scheduled_on?: string | null
          slug: string
          sources?: Json
          summary: string
          takeaway?: string | null
          takeaway_kind?: string | null
          title: string
          updated_at?: string
          why_today?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          deep_dive?: string
          id?: string
          image_alt?: string
          image_url?: string | null
          intro?: string
          is_published?: boolean
          key_points?: string[]
          published_at?: string
          reading_minutes?: number
          scheduled_on?: string | null
          slug?: string
          sources?: Json
          summary?: string
          takeaway?: string | null
          takeaway_kind?: string | null
          title?: string
          updated_at?: string
          why_today?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discoveries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          discovery_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discovery_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          discovery_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_discovery_id_fkey"
            columns: ["discovery_id"]
            isOneToOne: false
            referencedRelation: "discoveries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          answered_at: string
          client_ref: string
          id: string
          is_correct: boolean
          quiz_id: string
          selected_index: number
          user_id: string
        }
        Insert: {
          answered_at?: string
          client_ref?: string
          id?: string
          is_correct?: boolean
          quiz_id: string
          selected_index: number
          user_id: string
        }
        Update: {
          answered_at?: string
          client_ref?: string
          id?: string
          is_correct?: boolean
          quiz_id?: string
          selected_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          correct_index: number
          created_at: string
          discovery_id: string
          explanation: string
          id: string
          options: string[]
          question: string
          sort_order: number
        }
        Insert: {
          correct_index: number
          created_at?: string
          discovery_id: string
          explanation: string
          id?: string
          options: string[]
          question: string
          sort_order?: number
        }
        Update: {
          correct_index?: number
          created_at?: string
          discovery_id?: string
          explanation?: string
          id?: string
          options?: string[]
          question?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_discovery_id_fkey"
            columns: ["discovery_id"]
            isOneToOne: false
            referencedRelation: "discoveries"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_history: {
        Row: {
          discovery_id: string
          id: string
          read_at: string
          read_date: string
          user_id: string
        }
        Insert: {
          discovery_id: string
          id?: string
          read_at?: string
          read_date?: string
          user_id: string
        }
        Update: {
          discovery_id?: string
          id?: string
          read_at?: string
          read_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_history_discovery_id_fkey"
            columns: ["discovery_id"]
            isOneToOne: false
            referencedRelation: "discoveries"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          total_correct: number
          total_quiz_answers: number
          total_read: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          total_correct?: number
          total_quiz_answers?: number
          total_read?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          total_correct?: number
          total_quiz_answers?: number
          total_read?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bump_progress: {
        Args: {
          _answers: number
          _correct: number
          _day: string
          _read: number
          _user: string
        }
        Returns: undefined
      }
      cultura_today: { Args: never; Returns: string }
      daily_discovery_ids: {
        Args: never
        Returns: {
          day_rank: number
          discovery_id: string
        }[]
      }
      delete_my_account: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_premium: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
