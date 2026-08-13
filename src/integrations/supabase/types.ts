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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      colors: {
        Row: {
          created_at: string
          hex_code: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          hex_code: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          hex_code?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          assunto: string
          created_at: string
          email: string
          id: string
          mensagem: string
          nome: string
          status: string
          telefone: string
          updated_at: string
        }
        Insert: {
          assunto: string
          created_at?: string
          email: string
          id?: string
          mensagem: string
          nome: string
          status?: string
          telefone: string
          updated_at?: string
        }
        Update: {
          assunto?: string
          created_at?: string
          email?: string
          id?: string
          mensagem?: string
          nome?: string
          status?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      fabrics: {
        Row: {
          commercial_line: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          commercial_line: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          commercial_line?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_benefits: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon_name: string | null
          id: string
          is_active: boolean
          product_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean
          product_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean
          product_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_benefits_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_fabrics: {
        Row: {
          created_at: string
          display_order: number
          fabric_id: string
          id: string
          is_available: boolean
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          fabric_id: string
          id?: string
          is_available?: boolean
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          fabric_id?: string
          id?: string
          is_available?: boolean
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_fabrics_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_fabrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          color_id: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_available: boolean | null
          product_id: string
          stock_quantity: number | null
        }
        Insert: {
          alt_text?: string | null
          color_id?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_available?: boolean | null
          product_id: string
          stock_quantity?: number | null
        }
        Update: {
          alt_text?: string | null
          color_id?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_available?: boolean | null
          product_id?: string
          stock_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_prices: {
        Row: {
          commercial_line: string | null
          created_at: string
          fabric_id: string | null
          id: string
          pix_price: number | null
          price: number
          product_id: string
          product_size_id: string | null
        }
        Insert: {
          commercial_line?: string | null
          created_at?: string
          fabric_id?: string | null
          id?: string
          pix_price?: number | null
          price: number
          product_id: string
          product_size_id?: string | null
        }
        Update: {
          commercial_line?: string | null
          created_at?: string
          fabric_id?: string | null
          id?: string
          pix_price?: number | null
          price?: number
          product_id?: string
          product_size_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_product_size_id_fkey"
            columns: ["product_size_id"]
            isOneToOne: false
            referencedRelation: "product_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sizes: {
        Row: {
          created_at: string
          depth_cm: number | null
          dimensions: string
          display_order: number
          height_cm: number | null
          id: string
          name: string
          product_id: string
          updated_at: string
          width_cm: number | null
        }
        Insert: {
          created_at?: string
          depth_cm?: number | null
          dimensions: string
          display_order?: number
          height_cm?: number | null
          id?: string
          name: string
          product_id: string
          updated_at?: string
          width_cm?: number | null
        }
        Update: {
          created_at?: string
          depth_cm?: number | null
          dimensions?: string
          display_order?: number
          height_cm?: number | null
          id?: string
          name?: string
          product_id?: string
          updated_at?: string
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_sizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color_id: string | null
          created_at: string
          fabric_id: string | null
          id: string
          is_available: boolean | null
          product_id: string
          product_size_id: string | null
          stock_quantity: number | null
          updated_at: string
          variant_code: string | null
        }
        Insert: {
          color_id?: string | null
          created_at?: string
          fabric_id?: string | null
          id?: string
          is_available?: boolean | null
          product_id: string
          product_size_id?: string | null
          stock_quantity?: number | null
          updated_at?: string
          variant_code?: string | null
        }
        Update: {
          color_id?: string | null
          created_at?: string
          fabric_id?: string | null
          id?: string
          is_available?: boolean | null
          product_id?: string
          product_size_id?: string | null
          stock_quantity?: number | null
          updated_at?: string
          variant_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_size_id_fkey"
            columns: ["product_size_id"]
            isOneToOne: false
            referencedRelation: "product_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_custom_order: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          observations: string | null
          product_code: string | null
          short_description: string | null
          slug: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_custom_order?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          observations?: string | null
          product_code?: string | null
          short_description?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_custom_order?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          observations?: string | null
          product_code?: string | null
          short_description?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sizes: {
        Row: {
          created_at: string
          depth_cm: number | null
          dimensions: string
          display_order: number
          height_cm: number | null
          id: string
          name: string
          updated_at: string
          width_cm: number | null
        }
        Insert: {
          created_at?: string
          depth_cm?: number | null
          dimensions: string
          display_order?: number
          height_cm?: number | null
          id?: string
          name: string
          updated_at?: string
          width_cm?: number | null
        }
        Update: {
          created_at?: string
          depth_cm?: number | null
          dimensions?: string
          display_order?: number
          height_cm?: number | null
          id?: string
          name?: string
          updated_at?: string
          width_cm?: number | null
        }
        Relationships: []
      }
      store_config: {
        Row: {
          address_country: string
          address_locality: string | null
          address_region: string | null
          email: string
          id: number
          instagram_url: string | null
          og_image_url: string | null
          payment_methods: string[]
          pix_discount_percent: number
          production_time: string
          shipping_time: string
          site_url: string
          updated_at: string
          warranty: string
          whatsapp_display: string
          whatsapp_number: string
        }
        Insert: {
          address_country?: string
          address_locality?: string | null
          address_region?: string | null
          email?: string
          id?: number
          instagram_url?: string | null
          og_image_url?: string | null
          payment_methods?: string[]
          pix_discount_percent?: number
          production_time?: string
          shipping_time?: string
          site_url?: string
          updated_at?: string
          warranty?: string
          whatsapp_display?: string
          whatsapp_number?: string
        }
        Update: {
          address_country?: string
          address_locality?: string | null
          address_region?: string | null
          email?: string
          id?: number
          instagram_url?: string | null
          og_image_url?: string | null
          payment_methods?: string[]
          pix_discount_percent?: number
          production_time?: string
          shipping_time?: string
          site_url?: string
          updated_at?: string
          warranty?: string
          whatsapp_display?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_auto_product_code: {
        Args: { p_category_id: string }
        Returns: string
      }
      generate_auto_variant_code: {
        Args: { p_color_id?: string; p_product_id: string }
        Returns: string
      }
      generate_variant_code: {
        Args: { color_name?: string; product_code: string; size_name: string }
        Returns: string
      }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
      is_super_admin: { Args: { user_id?: string }; Returns: boolean }
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
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DefaultSchemaEnumNameOrOptions extends {
      schema: keyof DatabaseWithoutInternals
    }
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : never
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
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["CompositeTypes"][
      PublicCompositeTypeNameOrOptions
    ][CompositeTypeName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][
        PublicCompositeTypeNameOrOptions
      ][CompositeTypeName] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
