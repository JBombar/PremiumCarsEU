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
      activity_logs: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["activity_event_type"]
          id: string
          metadata: Json | null
          target_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["activity_event_type"]
          id?: string
          metadata?: Json | null
          target_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["activity_event_type"]
          id?: string
          metadata?: Json | null
          target_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          dealer_id: string | null
          id: string
          is_read: boolean | null
          message: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          dealer_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          dealer_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_query_log: {
        Row: {
          created_at: string
          id: string
          prompt: string
          response_summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt: string
          response_summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt?: string
          response_summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_query_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_search_intents: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          parsed_filters: Json | null
          raw_input: string
          responded: boolean | null
          session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          parsed_filters?: Json | null
          raw_input: string
          responded?: boolean | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          parsed_filters?: Json | null
          raw_input?: string
          responded?: boolean | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_search_intents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      car_listings: {
        Row: {
          body_type: string | null
          condition: Database["public"]["Enums"]["car_condition"]
          created_at: string
          dealer_id: string
          description: string | null
          engine: string | null
          exterior_color: string | null
          features: string[] | null
          fuel_type: string | null
          id: string
          images: string[] | null
          interior_color: string | null
          is_public: boolean
          is_shared_with_network: boolean
          is_special_offer: boolean | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          location_city: string | null
          location_country: string | null
          make: string
          max_rental_days: number | null
          mileage: number | null
          min_rental_days: number | null
          model: string
          price: number | null
          purchasing_price: number | null
          rental_daily_price: number | null
          rental_deposit_required: number | null
          rental_status: Database["public"]["Enums"]["rental_status"] | null
          seller_name: string | null
          seller_since: string | null
          sold_at: string | null
          special_offer_label: string | null
          status: Database["public"]["Enums"]["listing_status"]
          time_in_stock_days: number | null
          transmission: string | null
          updated_at: string
          vin: string | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          condition: Database["public"]["Enums"]["car_condition"]
          created_at?: string
          dealer_id: string
          description?: string | null
          engine?: string | null
          exterior_color?: string | null
          features?: string[] | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          interior_color?: string | null
          is_public?: boolean
          is_shared_with_network?: boolean
          is_special_offer?: boolean | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          location_city?: string | null
          location_country?: string | null
          make: string
          max_rental_days?: number | null
          mileage?: number | null
          min_rental_days?: number | null
          model: string
          price?: number | null
          purchasing_price?: number | null
          rental_daily_price?: number | null
          rental_deposit_required?: number | null
          rental_status?: Database["public"]["Enums"]["rental_status"] | null
          seller_name?: string | null
          seller_since?: string | null
          sold_at?: string | null
          special_offer_label?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          time_in_stock_days?: number | null
          transmission?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          condition?: Database["public"]["Enums"]["car_condition"]
          created_at?: string
          dealer_id?: string
          description?: string | null
          engine?: string | null
          exterior_color?: string | null
          features?: string[] | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          interior_color?: string | null
          is_public?: boolean
          is_shared_with_network?: boolean
          is_special_offer?: boolean | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          location_city?: string | null
          location_country?: string | null
          make?: string
          max_rental_days?: number | null
          mileage?: number | null
          min_rental_days?: number | null
          model?: string
          price?: number | null
          purchasing_price?: number | null
          rental_daily_price?: number | null
          rental_deposit_required?: number | null
          rental_status?: Database["public"]["Enums"]["rental_status"] | null
          seller_name?: string | null
          seller_since?: string | null
          sold_at?: string | null
          special_offer_label?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          time_in_stock_days?: number | null
          transmission?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "car_listings_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      car_makes: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      car_models: {
        Row: {
          body_type: Database["public"]["Enums"]["body_type"] | null
          id: string
          make: string | null
          make_id: string | null
          name: string
          tags: string[] | null
        }
        Insert: {
          body_type?: Database["public"]["Enums"]["body_type"] | null
          id?: string
          make?: string | null
          make_id?: string | null
          name: string
          tags?: string[] | null
        }
        Update: {
          body_type?: Database["public"]["Enums"]["body_type"] | null
          id?: string
          make?: string | null
          make_id?: string | null
          name?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "car_models_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "car_makes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_models_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "car_model_availability"
            referencedColumns: ["make_id"]
          },
        ]
      }
      car_offers: {
        Row: {
          asking_price: number | null
          city: string | null
          condition: string | null
          contacted: boolean | null
          created_at: string | null
          email: string | null
          from_user_id: string | null
          fuel_type: string | null
          full_name: string | null
          id: string
          make: string | null
          mileage: number | null
          model: string | null
          notes: string | null
          phone: string | null
          photo_urls: string[] | null
          status: string | null
          transmission: string | null
          year: string | null
        }
        Insert: {
          asking_price?: number | null
          city?: string | null
          condition?: string | null
          contacted?: boolean | null
          created_at?: string | null
          email?: string | null
          from_user_id?: string | null
          fuel_type?: string | null
          full_name?: string | null
          id?: string
          make?: string | null
          mileage?: number | null
          model?: string | null
          notes?: string | null
          phone?: string | null
          photo_urls?: string[] | null
          status?: string | null
          transmission?: string | null
          year?: string | null
        }
        Update: {
          asking_price?: number | null
          city?: string | null
          condition?: string | null
          contacted?: boolean | null
          created_at?: string | null
          email?: string | null
          from_user_id?: string | null
          fuel_type?: string | null
          full_name?: string | null
          id?: string
          make?: string | null
          mileage?: number | null
          model?: string | null
          notes?: string | null
          phone?: string | null
          photo_urls?: string[] | null
          status?: string | null
          transmission?: string | null
          year?: string | null
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["commission_status"]
          tipper_id: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          tipper_id: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          tipper_id?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_tipper_id_fkey"
            columns: ["tipper_id"]
            isOneToOne: false
            referencedRelation: "tippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_inquiries: {
        Row: {
          car_id: string | null
          car_name: string | null
          contacted: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          message: string | null
          phone: string
        }
        Insert: {
          car_id?: string | null
          car_name?: string | null
          contacted?: boolean
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          message?: string | null
          phone: string
        }
        Update: {
          car_id?: string | null
          car_name?: string | null
          contacted?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          message?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_inquiries_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      dealerships: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_user_id: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_user_id: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealerships_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_accounts: {
        Row: {
          created_at: string | null
          dealership_id: string | null
          email: string | null
          id: string
          name: string | null
          role: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          dealership_id?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          dealership_id?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_accounts_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_stats: {
        Row: {
          available_cars: number
          avg_price: number | null
          dealer_id: string
          id: string
          rented_cars: number
          sold_cars: number
          total_listings: number
          updated_at: string
        }
        Insert: {
          available_cars?: number
          avg_price?: number | null
          dealer_id: string
          id?: string
          rented_cars?: number
          sold_cars?: number
          total_listings?: number
          updated_at?: string
        }
        Update: {
          available_cars?: number
          avg_price?: number | null
          dealer_id?: string
          id?: string
          rented_cars?: number
          sold_cars?: number
          total_listings?: number
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          budget: number | null
          color: string | null
          condition: string | null
          contacted: boolean | null
          created_at: string | null
          email: string | null
          from_user_id: string | null
          fuel_type: string | null
          full_name: string | null
          id: string
          location: string | null
          make: string | null
          max_mileage: number | null
          model: string | null
          notes: string | null
          phone: string | null
          status: string | null
          transmission: string | null
          year_from: string | null
          year_to: string | null
        }
        Insert: {
          budget?: number | null
          color?: string | null
          condition?: string | null
          contacted?: boolean | null
          created_at?: string | null
          email?: string | null
          from_user_id?: string | null
          fuel_type?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          make?: string | null
          max_mileage?: number | null
          model?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          transmission?: string | null
          year_from?: string | null
          year_to?: string | null
        }
        Update: {
          budget?: number | null
          color?: string | null
          condition?: string | null
          contacted?: boolean | null
          created_at?: string | null
          email?: string | null
          from_user_id?: string | null
          fuel_type?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          make?: string | null
          max_mileage?: number | null
          model?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          transmission?: string | null
          year_from?: string | null
          year_to?: string | null
        }
        Relationships: []
      }
      listing_views: {
        Row: {
          car_id: string | null
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          car_id?: string | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          car_id?: string | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_views_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          id: string
          listing_id: string | null
          read_at: string | null
          receiver_id: string
          sender_id: string
          sent_at: string
        }
        Insert: {
          content: string
          id?: string
          listing_id?: string | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
          sent_at?: string
        }
        Update: {
          content?: string
          id?: string
          listing_id?: string | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_commissions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          listing_id: string | null
          partner_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          listing_id?: string | null
          partner_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          listing_id?: string | null
          partner_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_commissions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "partner_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_leads: {
        Row: {
          contacted: boolean | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          listing_id: string | null
          message: string | null
          partner_id: string | null
          phone: string
          status: string | null
        }
        Insert: {
          contacted?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          listing_id?: string | null
          message?: string | null
          partner_id?: string | null
          phone: string
          status?: string | null
        }
        Update: {
          contacted?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          listing_id?: string | null
          message?: string | null
          partner_id?: string | null
          phone?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "partner_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_leads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_listings: {
        Row: {
          availability_status: string | null
          color: string | null
          condition: string | null
          created_at: string | null
          fuel_type: string | null
          id: string
          mileage: number | null
          partner_id: string | null
          price: number | null
          transmission: string | null
          updated_at: string | null
          vehicle_make: string
          vehicle_model: string
          vehicle_year: number
        }
        Insert: {
          availability_status?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          fuel_type?: string | null
          id?: string
          mileage?: number | null
          partner_id?: string | null
          price?: number | null
          transmission?: string | null
          updated_at?: string | null
          vehicle_make: string
          vehicle_model: string
          vehicle_year: number
        }
        Update: {
          availability_status?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          fuel_type?: string | null
          id?: string
          mileage?: number | null
          partner_id?: string | null
          price?: number | null
          transmission?: string | null
          updated_at?: string | null
          vehicle_make?: string
          vehicle_model?: string
          vehicle_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_listings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_transactions: {
        Row: {
          buyer_contact: string | null
          buyer_name: string | null
          created_at: string | null
          id: string
          listing_id: string | null
          notes: string | null
          partner_id: string | null
          sale_date: string | null
          sale_price: number | null
        }
        Insert: {
          buyer_contact?: string | null
          buyer_name?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string | null
          notes?: string | null
          partner_id?: string | null
          sale_date?: string | null
          sale_price?: number | null
        }
        Update: {
          buyer_contact?: string | null
          buyer_name?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string | null
          notes?: string | null
          partner_id?: string | null
          sale_date?: string | null
          sale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "partner_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          company: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["partner_status"] | null
          trust_level: Database["public"]["Enums"]["partner_trust_level"] | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["partner_status"] | null
          trust_level?:
            | Database["public"]["Enums"]["partner_trust_level"]
            | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["partner_status"] | null
          trust_level?:
            | Database["public"]["Enums"]["partner_trust_level"]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_reservations: {
        Row: {
          created_at: string
          end_date: string
          id: string
          listing_id: string
          renter_id: string
          start_date: string
          status: Database["public"]["Enums"]["reservation_status"]
          total_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          listing_id: string
          renter_id: string
          start_date: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          listing_id?: string
          renter_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_reservations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_reservations_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          car_id: string | null
          contacted: boolean | null
          created_at: string | null
          customer_name: string | null
          date: string | null
          email: string | null
          id: string
          phone: string | null
          status: string | null
          time: string | null
          user_id: string | null
          vehicle: string | null
        }
        Insert: {
          car_id?: string | null
          contacted?: boolean | null
          created_at?: string | null
          customer_name?: string | null
          date?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          status?: string | null
          time?: string | null
          user_id?: string | null
          vehicle?: string | null
        }
        Update: {
          car_id?: string | null
          contacted?: boolean | null
          created_at?: string | null
          customer_name?: string | null
          date?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          status?: string | null
          time?: string | null
          user_id?: string | null
          vehicle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
          transaction_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
          transaction_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_metrics: {
        Row: {
          cars_sold: number | null
          created_at: string | null
          dealer_id: string | null
          id: string
          month: number | null
          total_revenue: number | null
          total_sales: number | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          cars_sold?: number | null
          created_at?: string | null
          dealer_id?: string | null
          id?: string
          month?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          cars_sold?: number | null
          created_at?: string | null
          dealer_id?: string | null
          id?: string
          month?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_metrics_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      search_interactions: {
        Row: {
          clicked_listing_id: string | null
          filters: Json | null
          id: string
          make_id: string | null
          model_id: string | null
          session_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          clicked_listing_id?: string | null
          filters?: Json | null
          id?: string
          make_id?: string | null
          model_id?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_listing_id?: string | null
          filters?: Json | null
          id?: string
          make_id?: string | null
          model_id?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_interactions_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "car_makes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_interactions_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "car_model_availability"
            referencedColumns: ["make_id"]
          },
          {
            foreignKeyName: "search_interactions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "car_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      test_drive_reservations: {
        Row: {
          car_id: string | null
          contacted: boolean | null
          created_at: string | null
          customer_name: string
          date: string
          email: string | null
          id: string
          phone: string
          status: Database["public"]["Enums"]["test_drive_status"] | null
          time: string
          user_id: string | null
          vehicle: string | null
        }
        Insert: {
          car_id?: string | null
          contacted?: boolean | null
          created_at?: string | null
          customer_name: string
          date: string
          email?: string | null
          id?: string
          phone: string
          status?: Database["public"]["Enums"]["test_drive_status"] | null
          time: string
          user_id?: string | null
          vehicle?: string | null
        }
        Update: {
          car_id?: string | null
          contacted?: boolean | null
          created_at?: string | null
          customer_name?: string
          date?: string
          email?: string | null
          id?: string
          phone?: string
          status?: Database["public"]["Enums"]["test_drive_status"] | null
          time?: string
          user_id?: string | null
          vehicle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_drive_requests_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_drive_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tippers: {
        Row: {
          commission_rate: number | null
          created_at: string
          dealership_id: string | null
          id: string
          status: Database["public"]["Enums"]["tipper_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string
          dealership_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["tipper_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate?: number | null
          created_at?: string
          dealership_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["tipper_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tippers_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tippers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      traffic_analytics: {
        Row: {
          created_at: string | null
          date: string | null
          dealer_id: string | null
          id: string
          leads_generated: number | null
          page_view_count: number | null
          unique_visitors: number | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          dealer_id?: string | null
          id?: string
          leads_generated?: number | null
          page_view_count?: number | null
          unique_visitors?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          dealer_id?: string | null
          id?: string
          leads_generated?: number | null
          page_view_count?: number | null
          unique_visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "traffic_analytics_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          agreed_price: number
          buyer_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          listing_id: string
          margin: number | null
          profit: number | null
          seller_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          time_in_stock_days: number | null
          updated_at: string
        }
        Insert: {
          agreed_price: number
          buyer_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          listing_id: string
          margin?: number | null
          profit?: number | null
          seller_id: string
          status?: Database["public"]["Enums"]["transaction_status"]
          time_in_stock_days?: number | null
          updated_at?: string
        }
        Update: {
          agreed_price?: number
          buyer_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          margin?: number | null
          profit?: number | null
          seller_id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          time_in_stock_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_listing"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      car_model_availability: {
        Row: {
          available_count: number | null
          make: string | null
          make_id: string | null
          model: string | null
        }
        Relationships: []
      }
      daily_car_view_summary: {
        Row: {
          car_id: string | null
          current_listing_status:
            | Database["public"]["Enums"]["listing_status"]
            | null
          dealer_id: string | null
          listing_type: Database["public"]["Enums"]["listing_type"] | null
          make: string | null
          model: string | null
          view_count: number | null
          view_day: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_listings_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_views_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      recent_user_view_activity: {
        Row: {
          distinct_cars_viewed_last_30_days: number | null
          email: string | null
          total_views_last_30_days: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_profit_margin: {
        Args: { p_agreed_price: number; p_purchase_price: number }
        Returns: Database["public"]["CompositeTypes"]["profit_margin_result"]
      }
      create_transaction_on_sale: {
        Args:
          | {
              listing_record: Database["public"]["Tables"]["car_listings"]["Row"]
            }
          | {
              listing_record: Database["public"]["Tables"]["car_listings"]["Row"]
              p_time_in_stock_days: number
            }
        Returns: undefined
      }
      get_most_viewed_cars: {
        Args: { limit_count: number }
        Returns: {
          id: string
          make: string
          model: string
          year: number
          price: number
          mileage: number
          fuel_type: string
          transmission: string
          condition: Database["public"]["Enums"]["car_condition"]
          body_type: string
          exterior_color: string
          interior_color: string
          status: Database["public"]["Enums"]["listing_status"]
          images: string[]
          created_at: string
          view_count: number
          seller_name: string
          location_city: string
          location_country: string
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_commission_tipper: {
        Args: { commission_id_to_check: string }
        Returns: boolean
      }
      is_listing_dealer: {
        Args: { listing_id_to_check: string }
        Returns: boolean
      }
      is_reservation_renter: {
        Args: { reservation_id_to_check: string }
        Returns: boolean
      }
      is_transaction_participant: {
        Args: { transaction_id_to_check: string }
        Returns: boolean
      }
      update_inventory_stats_for_dealer: {
        Args: { dealer_uuid: string }
        Returns: undefined
      }
      update_sales_metrics_on_sale: {
        Args: {
          listing_record: Database["public"]["Tables"]["car_listings"]["Row"]
        }
        Returns: undefined
      }
    }
    Enums: {
      activity_event_type:
        | "login"
        | "view_listing"
        | "submit_lead"
        | "create_listing"
        | "update_listing"
        | "delete_listing"
        | "create_reservation"
        | "update_reservation"
        | "create_transaction"
        | "update_transaction"
        | "etc..."
      body_type:
        | "Sedan"
        | "SUV"
        | "Station Wagon"
        | "Convertible"
        | "Coupe"
        | "Hatchback"
        | "Truck"
        | "Minivan"
        | "Van"
      car_condition: "new" | "used"
      commission_status: "pending" | "paid"
      lead_source_type: "organic" | "tipper"
      lead_status: "new" | "contacted" | "closed"
      listing_status: "available" | "reserved" | "sold" | "rented"
      listing_type: "sale" | "rent" | "both" | "rental"
      partner_status: "active" | "inactive" | "pending"
      partner_trust_level: "unrated" | "trusted" | "verified" | "flagged"
      rental_status: "available" | "rented" | "maintenance"
      reservation_status: "pending" | "confirmed" | "completed" | "cancelled"
      test_drive_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "accepted"
        | "no_show"
      tipper_status: "pending" | "approved" | "rejected"
      transaction_status: "pending" | "confirmed" | "completed" | "cancelled"
      user_role: "admin" | "dealer" | "buyer" | "tipper"
    }
    CompositeTypes: {
      profit_margin_result: {
        profit: number | null
        margin: number | null
      }
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
      activity_event_type: [
        "login",
        "view_listing",
        "submit_lead",
        "create_listing",
        "update_listing",
        "delete_listing",
        "create_reservation",
        "update_reservation",
        "create_transaction",
        "update_transaction",
        "etc...",
      ],
      body_type: [
        "Sedan",
        "SUV",
        "Station Wagon",
        "Convertible",
        "Coupe",
        "Hatchback",
        "Truck",
        "Minivan",
        "Van",
      ],
      car_condition: ["new", "used"],
      commission_status: ["pending", "paid"],
      lead_source_type: ["organic", "tipper"],
      lead_status: ["new", "contacted", "closed"],
      listing_status: ["available", "reserved", "sold", "rented"],
      listing_type: ["sale", "rent", "both", "rental"],
      partner_status: ["active", "inactive", "pending"],
      partner_trust_level: ["unrated", "trusted", "verified", "flagged"],
      rental_status: ["available", "rented", "maintenance"],
      reservation_status: ["pending", "confirmed", "completed", "cancelled"],
      test_drive_status: [
        "pending",
        "confirmed",
        "cancelled",
        "accepted",
        "no_show",
      ],
      tipper_status: ["pending", "approved", "rejected"],
      transaction_status: ["pending", "confirmed", "completed", "cancelled"],
      user_role: ["admin", "dealer", "buyer", "tipper"],
    },
  },
} as const
