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
      company_locations: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          name: string
          street_address: string
          updated_at: string
        }
        Insert: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          name: string
          street_address: string
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          name?: string
          street_address?: string
          updated_at?: string
        }
        Relationships: []
      }
      global_settings: {
        Row: {
          distance_matrix_api_key: string | null
          id: string
          updated_at: string
        }
        Insert: {
          distance_matrix_api_key?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          distance_matrix_api_key?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      technicians: {
        Row: {
          active: boolean
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          location_id: string | null
          phone: string | null
          updated_at: string
          user_role: Database["public"]["Enums"]["user_role"]
          vehicle_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          location_id?: string | null
          phone?: string | null
          updated_at?: string
          user_role?: Database["public"]["Enums"]["user_role"]
          vehicle_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          location_id?: string | null
          phone?: string | null
          updated_at?: string
          user_role?: Database["public"]["Enums"]["user_role"]
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technicians_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "company_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technicians_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_signatures: {
        Row: {
          created_at: string
          id: string
          signature_data: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signature_data: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signature_data?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          id: string
          license_plate: string | null
          model: string | null
          name: string
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          license_plate?: string | null
          model?: string | null
          name: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          license_plate?: string | null
          model?: string | null
          name?: string
          updated_at?: string
          year?: number | null
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
      user_role: "admin" | "technician" | "lead"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "technician", "lead"],
    },
  },
} as const
