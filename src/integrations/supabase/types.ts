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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          demo_business: string | null
          demo_email: string | null
          demo_name: string | null
          expires_at: string | null
          id: string
          is_demo: boolean
          location_id: string
          phase_1_complete: boolean
          phase_1_data: Json | null
          phase_2_complete: boolean
          phase_2_data: Json | null
          phase_3_complete: boolean
          phase_3_data: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          demo_business?: string | null
          demo_email?: string | null
          demo_name?: string | null
          expires_at?: string | null
          id?: string
          is_demo?: boolean
          location_id: string
          phase_1_complete?: boolean
          phase_1_data?: Json | null
          phase_2_complete?: boolean
          phase_2_data?: Json | null
          phase_3_complete?: boolean
          phase_3_data?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          demo_business?: string | null
          demo_email?: string | null
          demo_name?: string | null
          expires_at?: string | null
          id?: string
          is_demo?: boolean
          location_id?: string
          phase_1_complete?: boolean
          phase_1_data?: Json | null
          phase_2_complete?: boolean
          phase_2_data?: Json | null
          phase_3_complete?: boolean
          phase_3_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          completed: boolean | null
          created_at: string
          current_stage: string | null
          id: string
          messages: Json | null
          output: Json | null
          updated_at: string
          user_email: string
          user_name: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          current_stage?: string | null
          id?: string
          messages?: Json | null
          output?: Json | null
          updated_at?: string
          user_email: string
          user_name?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          current_stage?: string | null
          id?: string
          messages?: Json | null
          output?: Json | null
          updated_at?: string
          user_email?: string
          user_name?: string | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          ai_foundation_complete: boolean | null
          ai_foundation_data: Json | null
          ai_responder_active: boolean | null
          booking_page_created: boolean
          bot_instructions: string | null
          calendar_connected: boolean
          contract_prepared: boolean
          created_at: string
          funnel_blueprint: string | null
          funnel_build_complete: boolean | null
          funnel_craft_complete: boolean | null
          funnels_created: number
          id: string
          knowledge_base_content: string | null
          location_id: string | null
          payments_connected: boolean
          phase1_complete: boolean
          phase1_progress: number
          phase2_complete: boolean
          profile_complete: boolean
          reminders_configured: boolean | null
          social_accounts_connected: boolean | null
          social_capture_active: boolean | null
          social_capture_toolkit: string | null
          social_message_complete: boolean | null
          updated_at: string
          user_email: string
        }
        Insert: {
          ai_foundation_complete?: boolean | null
          ai_foundation_data?: Json | null
          ai_responder_active?: boolean | null
          booking_page_created?: boolean
          bot_instructions?: string | null
          calendar_connected?: boolean
          contract_prepared?: boolean
          created_at?: string
          funnel_blueprint?: string | null
          funnel_build_complete?: boolean | null
          funnel_craft_complete?: boolean | null
          funnels_created?: number
          id?: string
          knowledge_base_content?: string | null
          location_id?: string | null
          payments_connected?: boolean
          phase1_complete?: boolean
          phase1_progress?: number
          phase2_complete?: boolean
          profile_complete?: boolean
          reminders_configured?: boolean | null
          social_accounts_connected?: boolean | null
          social_capture_active?: boolean | null
          social_capture_toolkit?: string | null
          social_message_complete?: boolean | null
          updated_at?: string
          user_email: string
        }
        Update: {
          ai_foundation_complete?: boolean | null
          ai_foundation_data?: Json | null
          ai_responder_active?: boolean | null
          booking_page_created?: boolean
          bot_instructions?: string | null
          calendar_connected?: boolean
          contract_prepared?: boolean
          created_at?: string
          funnel_blueprint?: string | null
          funnel_build_complete?: boolean | null
          funnel_craft_complete?: boolean | null
          funnels_created?: number
          id?: string
          knowledge_base_content?: string | null
          location_id?: string | null
          payments_connected?: boolean
          phase1_complete?: boolean
          phase1_progress?: number
          phase2_complete?: boolean
          profile_complete?: boolean
          reminders_configured?: boolean | null
          social_accounts_connected?: boolean | null
          social_capture_active?: boolean | null
          social_capture_toolkit?: string | null
          social_message_complete?: boolean | null
          updated_at?: string
          user_email?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
