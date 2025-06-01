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
      employee_profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          location_id: string | null
          manager_id: string | null
          phone: string | null
          signature_created_at: string | null
          signature_data: string | null
          signature_updated_at: string | null
          updated_at: string
          user_role: string
          vehicle_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          location_id?: string | null
          manager_id?: string | null
          phone?: string | null
          signature_created_at?: string | null
          signature_data?: string | null
          signature_updated_at?: string | null
          updated_at?: string
          user_role?: string
          vehicle_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          location_id?: string | null
          manager_id?: string | null
          phone?: string | null
          signature_created_at?: string | null
          signature_data?: string | null
          signature_updated_at?: string | null
          updated_at?: string
          user_role?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "company_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_profiles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
      vehicles: {
        Row: {
          created_at: string
          id: string
          license_plate: string
          model: string | null
          technical_inspection: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          license_plate: string
          model?: string | null
          technical_inspection?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          license_plate?: string
          model?: string | null
          technical_inspection?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          client_company_address: string
          client_company_name: string
          client_email: string
          client_first_name: string
          client_last_name: string
          client_mobile: string
          client_oib: string
          created_at: string | null
          customer_company_address: string | null
          customer_company_name: string | null
          customer_email: string | null
          customer_first_name: string | null
          customer_last_name: string | null
          customer_mobile: string | null
          customer_oib: string | null
          customer_signature: string | null
          date: string
          description: string | null
          distance: number | null
          employee_profile_id: string | null
          found_condition: string | null
          hours: number | null
          id: string
          materials: Json | null
          order_for_customer: boolean | null
          order_number: string
          performed_work: string | null
          signature_address: string | null
          signature_coordinates: unknown | null
          signature_timestamp: string | null
          technician_comment: string | null
          technician_signature: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_company_address: string
          client_company_name: string
          client_email: string
          client_first_name: string
          client_last_name: string
          client_mobile: string
          client_oib: string
          created_at?: string | null
          customer_company_address?: string | null
          customer_company_name?: string | null
          customer_email?: string | null
          customer_first_name?: string | null
          customer_last_name?: string | null
          customer_mobile?: string | null
          customer_oib?: string | null
          customer_signature?: string | null
          date: string
          description?: string | null
          distance?: number | null
          employee_profile_id?: string | null
          found_condition?: string | null
          hours?: number | null
          id?: string
          materials?: Json | null
          order_for_customer?: boolean | null
          order_number: string
          performed_work?: string | null
          signature_address?: string | null
          signature_coordinates?: unknown | null
          signature_timestamp?: string | null
          technician_comment?: string | null
          technician_signature?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_company_address?: string
          client_company_name?: string
          client_email?: string
          client_first_name?: string
          client_last_name?: string
          client_mobile?: string
          client_oib?: string
          created_at?: string | null
          customer_company_address?: string | null
          customer_company_name?: string | null
          customer_email?: string | null
          customer_first_name?: string | null
          customer_last_name?: string | null
          customer_mobile?: string | null
          customer_oib?: string | null
          customer_signature?: string | null
          date?: string
          description?: string | null
          distance?: number | null
          employee_profile_id?: string | null
          found_condition?: string | null
          hours?: number | null
          id?: string
          materials?: Json | null
          order_for_customer?: boolean | null
          order_number?: string
          performed_work?: string | null
          signature_address?: string | null
          signature_coordinates?: unknown | null
          signature_timestamp?: string | null
          technician_comment?: string | null
          technician_signature?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_work_orders_employee_profile"
            columns: ["employee_profile_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_employee_profile_id_fkey"
            columns: ["employee_profile_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_next_order_number: {
        Args: { user_initials: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
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
