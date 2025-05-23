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
          currency: string | null
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
          is_rentable: boolean | null
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
          price_chf: number | null
          price_czk: number | null
          price_eur: number | null
          price_huf: number | null
          price_pln: number | null
          purchasing_price: number | null
          rental_available_durations: number[] | null
          rental_daily_price: number | null
          rental_deposit: number | null
          rental_deposit_required: number | null
          rental_policy: string | null
          rental_price_12h: number | null
          rental_price_24h: number | null
          rental_price_3h: number | null
          rental_price_48h: number | null
          rental_price_6h: number | null
          rental_status: Database["public"]["Enums"]["rental_status"] | null
          seller_name: string | null
          seller_since: string | null
          shared_with_trust_levels: string[] | null
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
          currency?: string | null
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
          is_rentable?: boolean | null
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
          price_chf?: number | null
          price_czk?: number | null
          price_eur?: number | null
          price_huf?: number | null
          price_pln?: number | null
          purchasing_price?: number | null
          rental_available_durations?: number[] | null
          rental_daily_price?: number | null
          rental_deposit?: number | null
          rental_deposit_required?: number | null
          rental_policy?: string | null
          rental_price_12h?: number | null
          rental_price_24h?: number | null
          rental_price_3h?: number | null
          rental_price_48h?: number | null
          rental_price_6h?: number | null
          rental_status?: Database["public"]["Enums"]["rental_status"] | null
          seller_name?: string | null
          seller_since?: string | null
          shared_with_trust_levels?: string[] | null
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
          currency?: string | null
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
          is_rentable?: boolean | null
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
          price_chf?: number | null
          price_czk?: number | null
          price_eur?: number | null
          price_huf?: number | null
          price_pln?: number | null
          purchasing_price?: number | null
          rental_available_durations?: number[] | null
          rental_daily_price?: number | null
          rental_deposit?: number | null
          rental_deposit_required?: number | null
          rental_policy?: string | null
          rental_price_12h?: number | null
          rental_price_24h?: number | null
          rental_price_3h?: number | null
          rental_price_48h?: number | null
          rental_price_6h?: number | null
          rental_status?: Database["public"]["Enums"]["rental_status"] | null
          seller_name?: string | null
          seller_since?: string | null
          shared_with_trust_levels?: string[] | null
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
      car_offer_shares: {
        Row: {
          asking_price: number | null
          channels: string[]
          city: string | null
          contacted: boolean | null
          created_at: string | null
          dealer_id: string
          email: string | null
          from_user_id: string | null
          full_name: string | null
          id: string
          make: string | null
          message: string | null
          mileage: number | null
          model: string | null
          notes: string | null
          offer_id: string
          phone: string | null
          photo_urls: string[] | null
          shared_with_contacts: string[]
          shared_with_trust_levels: string[] | null
          status: string | null
          year: string | null
        }
        Insert: {
          asking_price?: number | null
          channels: string[]
          city?: string | null
          contacted?: boolean | null
          created_at?: string | null
          dealer_id: string
          email?: string | null
          from_user_id?: string | null
          full_name?: string | null
          id?: string
          make?: string | null
          message?: string | null
          mileage?: number | null
          model?: string | null
          notes?: string | null
          offer_id: string
          phone?: string | null
          photo_urls?: string[] | null
          shared_with_contacts: string[]
          shared_with_trust_levels?: string[] | null
          status?: string | null
          year?: string | null
        }
        Update: {
          asking_price?: number | null
          channels?: string[]
          city?: string | null
          contacted?: boolean | null
          created_at?: string | null
          dealer_id?: string
          email?: string | null
          from_user_id?: string | null
          full_name?: string | null
          id?: string
          make?: string | null
          message?: string | null
          mileage?: number | null
          model?: string | null
          notes?: string | null
          offer_id?: string
          phone?: string | null
          photo_urls?: string[] | null
          shared_with_contacts?: string[]
          shared_with_trust_levels?: string[] | null
          status?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_offer_shares_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_offer_shares_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "car_offers"
            referencedColumns: ["id"]
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
      client_activity_logs: {
        Row: {
          activity_type: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          related_entity_id: string | null
          related_entity_type: string | null
        }
        Insert: {
          activity_type?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
        }
        Update: {
          activity_type?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_activity_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rental_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_interactions: {
        Row: {
          client_id: string | null
          contact_person: string | null
          direction: string | null
          id: string
          outcome: string | null
          summary: string | null
          timestamp: string | null
          type: string
        }
        Insert: {
          client_id?: string | null
          contact_person?: string | null
          direction?: string | null
          id?: string
          outcome?: string | null
          summary?: string | null
          timestamp?: string | null
          type: string
        }
        Update: {
          client_id?: string | null
          contact_person?: string | null
          direction?: string | null
          id?: string
          outcome?: string | null
          summary?: string | null
          timestamp?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rental_clients"
            referencedColumns: ["id"]
          },
        ]
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
      currency_rates: {
        Row: {
          base_currency: string
          CZK: number
          EUR: number
          fetched_at: string | null
          HUF: number
          id: string
          PLN: number
        }
        Insert: {
          base_currency?: string
          CZK: number
          EUR: number
          fetched_at?: string | null
          HUF: number
          id?: string
          PLN: number
        }
        Update: {
          base_currency?: string
          CZK?: number
          EUR?: number
          fetched_at?: string | null
          HUF?: number
          id?: string
          PLN?: number
        }
        Relationships: []
      }
      dealer_partners: {
        Row: {
          business_name: string | null
          contact_name: string | null
          created_at: string
          dealer_user_id: string
          dealership_id: string | null
          email: string | null
          id: string
          is_approved: boolean
          phone_number: string | null
        }
        Insert: {
          business_name?: string | null
          contact_name?: string | null
          created_at?: string
          dealer_user_id: string
          dealership_id?: string | null
          email?: string | null
          id?: string
          is_approved?: boolean
          phone_number?: string | null
        }
        Update: {
          business_name?: string | null
          contact_name?: string | null
          created_at?: string
          dealer_user_id?: string
          dealership_id?: string | null
          email?: string | null
          id?: string
          is_approved?: boolean
          phone_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_partners_dealer_user_id_fkey"
            columns: ["dealer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_partners_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
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
      lead_shares: {
        Row: {
          channels: string[]
          condition: string | null
          created_at: string | null
          dealer_id: string
          fuel_type: string | null
          id: string
          lead_id: string
          location: string | null
          make: string | null
          message: string | null
          model: string | null
          shared_with_contacts: string[] | null
          shared_with_partner_ids: string[] | null
          shared_with_trust_levels: string[]
          status: string | null
          transmission: string | null
          year_from: string | null
          year_to: string | null
        }
        Insert: {
          channels: string[]
          condition?: string | null
          created_at?: string | null
          dealer_id: string
          fuel_type?: string | null
          id?: string
          lead_id: string
          location?: string | null
          make?: string | null
          message?: string | null
          model?: string | null
          shared_with_contacts?: string[] | null
          shared_with_partner_ids?: string[] | null
          shared_with_trust_levels: string[]
          status?: string | null
          transmission?: string | null
          year_from?: string | null
          year_to?: string | null
        }
        Update: {
          channels?: string[]
          condition?: string | null
          created_at?: string | null
          dealer_id?: string
          fuel_type?: string | null
          id?: string
          lead_id?: string
          location?: string | null
          make?: string | null
          message?: string | null
          model?: string | null
          shared_with_contacts?: string[] | null
          shared_with_partner_ids?: string[] | null
          shared_with_trust_levels?: string[]
          status?: string | null
          transmission?: string | null
          year_from?: string | null
          year_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_shares_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_shares_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
      listing_shares: {
        Row: {
          channels: string[]
          created_at: string | null
          dealer_id: string
          id: string
          listing_id: string
          listing_url: string | null
          make: string | null
          message: string | null
          model: string | null
          shared_with_contacts: string[] | null
          shared_with_trust_levels: string[] | null
          status: string | null
          year: number | null
        }
        Insert: {
          channels: string[]
          created_at?: string | null
          dealer_id: string
          id?: string
          listing_id: string
          listing_url?: string | null
          make?: string | null
          message?: string | null
          model?: string | null
          shared_with_contacts?: string[] | null
          shared_with_trust_levels?: string[] | null
          status?: string | null
          year?: number | null
        }
        Update: {
          channels?: string[]
          created_at?: string | null
          dealer_id?: string
          id?: string
          listing_id?: string
          listing_url?: string | null
          make?: string | null
          message?: string | null
          model?: string | null
          shared_with_contacts?: string[] | null
          shared_with_trust_levels?: string[] | null
          status?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_shares_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_shares_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
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
          admin_notes: string | null
          approval_status: Database["public"]["Enums"]["approval_status_type"]
          approved_by: string | null
          availability_status: string | null
          body_type: string | null
          color: string | null
          condition: string | null
          created_at: string | null
          description: string | null
          engine: string | null
          exterior_color: string | null
          features: string[] | null
          fuel_type: string | null
          id: string
          images: string[] | null
          interior_color: string | null
          is_added_to_main_listings: boolean | null
          is_public: boolean | null
          is_shared_with_network: boolean
          is_special_offer: boolean | null
          is_visible_to_dealer: boolean
          listing_type: string | null
          location_city: string | null
          location_country: string | null
          mileage: number | null
          partner_id: string | null
          price: number | null
          special_offer_label: string | null
          status: string
          transmission: string | null
          updated_at: string | null
          vehicle_make: string
          vehicle_model: string
          vehicle_year: number
          vin: string | null
        }
        Insert: {
          admin_notes?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status_type"]
          approved_by?: string | null
          availability_status?: string | null
          body_type?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          engine?: string | null
          exterior_color?: string | null
          features?: string[] | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          interior_color?: string | null
          is_added_to_main_listings?: boolean | null
          is_public?: boolean | null
          is_shared_with_network?: boolean
          is_special_offer?: boolean | null
          is_visible_to_dealer?: boolean
          listing_type?: string | null
          location_city?: string | null
          location_country?: string | null
          mileage?: number | null
          partner_id?: string | null
          price?: number | null
          special_offer_label?: string | null
          status?: string
          transmission?: string | null
          updated_at?: string | null
          vehicle_make: string
          vehicle_model: string
          vehicle_year: number
          vin?: string | null
        }
        Update: {
          admin_notes?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status_type"]
          approved_by?: string | null
          availability_status?: string | null
          body_type?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          engine?: string | null
          exterior_color?: string | null
          features?: string[] | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          interior_color?: string | null
          is_added_to_main_listings?: boolean | null
          is_public?: boolean | null
          is_shared_with_network?: boolean
          is_special_offer?: boolean | null
          is_visible_to_dealer?: boolean
          listing_type?: string | null
          location_city?: string | null
          location_country?: string | null
          mileage?: number | null
          partner_id?: string | null
          price?: number | null
          special_offer_label?: string | null
          status?: string
          transmission?: string | null
          updated_at?: string | null
          vehicle_make?: string
          vehicle_model?: string
          vehicle_year?: number
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_listings_dealer_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "dealer_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_shares: {
        Row: {
          channels: string[] | null
          company: string | null
          created_at: string | null
          dealer_id: string
          id: string
          location: string | null
          message: string | null
          name: string | null
          partner_id: string
          shared_with_contacts: string[] | null
          shared_with_trust_levels: string[] | null
          status: string | null
        }
        Insert: {
          channels?: string[] | null
          company?: string | null
          created_at?: string | null
          dealer_id: string
          id?: string
          location?: string | null
          message?: string | null
          name?: string | null
          partner_id: string
          shared_with_contacts?: string[] | null
          shared_with_trust_levels?: string[] | null
          status?: string | null
        }
        Update: {
          channels?: string[] | null
          company?: string | null
          created_at?: string | null
          dealer_id?: string
          id?: string
          location?: string | null
          message?: string | null
          name?: string | null
          partner_id?: string
          shared_with_contacts?: string[] | null
          shared_with_trust_levels?: string[] | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_shares_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_shares_partner_id_fkey"
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
      pending_listings: {
        Row: {
          body_type: string | null
          condition: string
          created_at: string | null
          created_by: string
          dealership_id: string | null
          description: string | null
          engine: string | null
          exterior_color: string | null
          features: string[] | null
          fuel_type: string | null
          id: string
          images: string[] | null
          interior_color: string | null
          is_approved: boolean | null
          is_special_offer: boolean | null
          location_city: string | null
          location_country: string | null
          make: string
          mileage: number | null
          model: string
          price: number | null
          seller_name: string | null
          seller_since: string | null
          special_offer_label: string | null
          transmission: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          condition: string
          created_at?: string | null
          created_by?: string
          dealership_id?: string | null
          description?: string | null
          engine?: string | null
          exterior_color?: string | null
          features?: string[] | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          interior_color?: string | null
          is_approved?: boolean | null
          is_special_offer?: boolean | null
          location_city?: string | null
          location_country?: string | null
          make: string
          mileage?: number | null
          model: string
          price?: number | null
          seller_name?: string | null
          seller_since?: string | null
          special_offer_label?: string | null
          transmission?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          condition?: string
          created_at?: string | null
          created_by?: string
          dealership_id?: string | null
          description?: string | null
          engine?: string | null
          exterior_color?: string | null
          features?: string[] | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          interior_color?: string | null
          is_approved?: boolean | null
          is_special_offer?: boolean | null
          location_city?: string | null
          location_country?: string | null
          make?: string
          mileage?: number | null
          model?: string
          price?: number | null
          seller_name?: string | null
          seller_since?: string | null
          special_offer_label?: string | null
          transmission?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_listings_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
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
      rental_clients: {
        Row: {
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          job_title: string | null
          lead_source: string | null
          notes: string | null
          phone: string | null
          preferred_contact_method: string | null
          preferred_language: string | null
          renter_id: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          job_title?: string | null
          lead_source?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          renter_id?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          lead_source?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          renter_id?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_clients_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_investors: {
        Row: {
          agreement_date: string | null
          city: string | null
          commission_rate: number | null
          company_name: string | null
          contract_url: string | null
          country: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          investor_type: string | null
          investor_user_id: string | null
          notes: string | null
          payout_frequency: string | null
          payout_method: string | null
          phone: string | null
          preferred_contact_method: string | null
          preferred_language: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          agreement_date?: string | null
          city?: string | null
          commission_rate?: number | null
          company_name?: string | null
          contract_url?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          investor_type?: string | null
          investor_user_id?: string | null
          notes?: string | null
          payout_frequency?: string | null
          payout_method?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          agreement_date?: string | null
          city?: string | null
          commission_rate?: number | null
          company_name?: string | null
          contract_url?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          investor_type?: string | null
          investor_user_id?: string | null
          notes?: string | null
          payout_frequency?: string | null
          payout_method?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rental_reservations: {
        Row: {
          admin_comments: string | null
          approved_at: string | null
          approved_by: string | null
          canceled_at: string | null
          canceled_by: string | null
          created_at: string
          currency: string | null
          duration: number | null
          end_date: string
          end_time: string | null
          id: string
          id_document_url: string | null
          is_verified: boolean | null
          license_document_url: string | null
          listing_id: string
          notes: string | null
          preferred_contact_method: string | null
          referrer: string | null
          renter_email: string
          renter_id: string
          renter_name: string
          renter_phone: string
          source: string | null
          start_date: string
          start_time: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          total_price: number | null
          updated_at: string
          utm_campaign: string | null
          utm_source: string | null
          verification_method: string | null
        }
        Insert: {
          admin_comments?: string | null
          approved_at?: string | null
          approved_by?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          created_at?: string
          currency?: string | null
          duration?: number | null
          end_date: string
          end_time?: string | null
          id?: string
          id_document_url?: string | null
          is_verified?: boolean | null
          license_document_url?: string | null
          listing_id: string
          notes?: string | null
          preferred_contact_method?: string | null
          referrer?: string | null
          renter_email: string
          renter_id: string
          renter_name: string
          renter_phone: string
          source?: string | null
          start_date: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          total_price?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_source?: string | null
          verification_method?: string | null
        }
        Update: {
          admin_comments?: string | null
          approved_at?: string | null
          approved_by?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          created_at?: string
          currency?: string | null
          duration?: number | null
          end_date?: string
          end_time?: string | null
          id?: string
          id_document_url?: string | null
          is_verified?: boolean | null
          license_document_url?: string | null
          listing_id?: string
          notes?: string | null
          preferred_contact_method?: string | null
          referrer?: string | null
          renter_email?: string
          renter_id?: string
          renter_name?: string
          renter_phone?: string
          source?: string | null
          start_date?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          total_price?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_source?: string | null
          verification_method?: string | null
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
      whatsapp_message_store: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          listing_reference: string | null
          processed_at: string | null
          processed_partner_listing_id: string | null
          text_content: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          listing_reference?: string | null
          processed_at?: string | null
          processed_partner_listing_id?: string | null
          text_content?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          listing_reference?: string | null
          processed_at?: string | null
          processed_partner_listing_id?: string | null
          text_content?: string | null
          type?: string
          user_id?: string
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
      rental_kpis_v: {
        Row: {
          avg_duration: number | null
          avg_length_hours: number | null
          avg_price_chf: number | null
          date: string | null
          gross_revenue_chf: number | null
          total_completed: number | null
          total_confirmed: number | null
          total_reservations: number | null
        }
        Relationships: []
      }
      rental_transactions_v: {
        Row: {
          admin_comments: string | null
          approved_at: string | null
          approved_by: string | null
          canceled_at: string | null
          canceled_by: string | null
          car_make: string | null
          car_model: string | null
          car_year: number | null
          condition: Database["public"]["Enums"]["car_condition"] | null
          created_at: string | null
          currency: string | null
          duration: number | null
          end_date: string | null
          end_time: string | null
          fuel_type: string | null
          id: string | null
          id_document_url: string | null
          is_verified: boolean | null
          license_document_url: string | null
          listing_id: string | null
          mileage: number | null
          notes: string | null
          preferred_contact_method: string | null
          referrer: string | null
          renter_email: string | null
          renter_id: string | null
          renter_name: string | null
          renter_phone: string | null
          source: string | null
          start_date: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["reservation_status"] | null
          total_price: number | null
          transmission: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_source: string | null
          verification_method: string | null
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
          is_public: boolean
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
      approval_status_type: "pending" | "approved" | "rejected"
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
      user_role: "admin" | "dealer" | "buyer" | "tipper" | "bot"
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
      approval_status_type: ["pending", "approved", "rejected"],
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
      user_role: ["admin", "dealer", "buyer", "tipper", "bot"],
    },
  },
} as const
