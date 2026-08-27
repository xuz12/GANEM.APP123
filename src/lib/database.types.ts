export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      nfc_identifiers: {
        Row: {
          id: string
          user_id: string
          nfc_uid: string
          wallet_type: 'apple' | 'android'
          pass_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nfc_uid: string
          wallet_type: 'apple' | 'android'
          pass_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nfc_uid?: string
          wallet_type?: 'apple' | 'android'
          pass_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      nfc_scan_logs: {
        Row: {
          id: string
          user_id: string
          match_id: string | null
          nfc_uid: string
          scanned_at: string
          reader_id: string
          scan_type: 'attendance' | 'redemption'
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          match_id?: string | null
          nfc_uid: string
          scanned_at?: string
          reader_id: string
          scan_type: 'attendance' | 'redemption'
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          match_id?: string | null
          nfc_uid?: string
          scanned_at?: string
          reader_id?: string
          scan_type?: 'attendance' | 'redemption'
          metadata?: Json
        }
      }
      nfc_readers: {
        Row: {
          reader_id: string
          location: string
          match_id: string | null
          partner_id: string | null
          status: 'active' | 'inactive'
          last_seen: string
          metadata: Json
          created_at: string
        }
        Insert: {
          reader_id: string
          location: string
          match_id?: string | null
          partner_id?: string | null
          status?: 'active' | 'inactive'
          last_seen?: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          reader_id?: string
          location?: string
          match_id?: string | null
          partner_id?: string | null
          status?: 'active' | 'inactive'
          last_seen?: string
          metadata?: Json
          created_at?: string
        }
      }
      nfc_redemptions: {
        Row: {
          redemption_id: string
          user_id: string
          partner_id: string
          offer_id: string
          points_used: number
          commission_amount: number
          scanned_at: string
          reader_id: string
          status: 'pending' | 'completed' | 'cancelled'
          metadata: Json
        }
        Insert: {
          redemption_id?: string
          user_id: string
          partner_id: string
          offer_id: string
          points_used: number
          commission_amount: number
          scanned_at?: string
          reader_id: string
          status?: 'pending' | 'completed' | 'cancelled'
          metadata?: Json
        }
        Update: {
          redemption_id?: string
          user_id?: string
          partner_id?: string
          offer_id?: string
          points_used?: number
          commission_amount?: number
          scanned_at?: string
          reader_id?: string
          status?: 'pending' | 'completed' | 'cancelled'
          metadata?: Json
        }
      }
      clubs: {
        Row: {
          id: string
          name_ar: string
          name_en: string
          logo_url: string | null
          city: string
          stadium_name: string
          stadium_lat: number
          stadium_lng: number
          geofence_radius: number
          created_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_en: string
          logo_url?: string | null
          city: string
          stadium_name: string
          stadium_lat: number
          stadium_lng: number
          geofence_radius?: number
          created_at?: string
        }
        Update: {
          id?: string
          name_ar?: string
          name_en?: string
          logo_url?: string | null
          city?: string
          stadium_name?: string
          stadium_lat?: number
          stadium_lng?: number
          geofence_radius?: number
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          favorite_club_id: string | null
          points: number
          total_points_earned: number
          level: number
          matches_attended: number
          consecutive_matches: number
          referral_code: string
          referred_by: string | null
          redemptions_count: number // ✅ تم إضافة العمود هنا
          user_qr_code: string | null
          created_at: string
          updated_at: string
          email?: string | null
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          favorite_club_id?: string | null
          points?: number
          total_points_earned?: number
          level?: number
          matches_attended?: number
          consecutive_matches?: number
          referral_code: string
          referred_by?: string | null
          redemptions_count?: number // ✅ تم إضافة العمود هنا
          user_qr_code?: string | null
          created_at?: string
          updated_at?: string
          email?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          favorite_club_id?: string | null
          points?: number
          total_points_earned?: number
          level?: number
          matches_attended?: number
          consecutive_matches?: number
          referral_code?: string
          referred_by?: string | null
          redemptions_count?: number // ✅ تم إضافة العمود هنا
          user_qr_code?: string | null
          created_at?: string
          updated_at?: string
          email?: string | null
        }
      }
      teams: {
        Row: {
          team_id: number
          name_ar: string
          name_en: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          team_id: number
          name_ar: string
          name_en: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          team_id?: number
          name_ar?: string
          name_en?: string
          logo_url?: string | null
          updated_at?: string
        }
      }
      sync_logs: {
        Row: {
          id: string
          sync_type: 'matches' | 'teams' | 'live_scores'
          synced_at: string
          records_updated: number
          status: 'success' | 'error'
          error_message: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          sync_type: 'matches' | 'teams' | 'live_scores'
          synced_at?: string
          records_updated?: number
          status?: 'success' | 'error'
          error_message?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          sync_type?: 'matches' | 'teams' | 'live_scores'
          synced_at?: string
          records_updated?: number
          status?: 'success' | 'error'
          error_message?: string | null
          metadata?: Json
        }
      }
      matches: {
        Row: {
          id: string
          home_club_id: string
          away_club_id: string
          match_date: string
          stadium_lat: number
          stadium_lng: number
          match_type: 'regular' | 'derby' | 'final' | 'afc'
          external_id: number | null
          home_score: number | null
          away_score: number | null
          kickoff_at: string | null
          venue: string | null
          round: string | null
          status: 'upcoming' | 'live' | 'finished' | 'cancelled'
          base_points: number
          points_multiplier: number
          round_number: number | null
          qr_code: string | null
          nfc_tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          home_club_id: string
          away_club_id: string
          match_date: string
          stadium_lat: number
          stadium_lng: number
          match_type?: 'regular' | 'derby' | 'final' | 'afc'
          external_id?: number | null
          home_score?: number | null
          away_score?: number | null
          kickoff_at?: string | null
          venue?: string | null
          round?: string | null
          status?: 'upcoming' | 'live' | 'finished' | 'cancelled'
          base_points?: number
          points_multiplier?: number
          round_number?: number | null
          qr_code?: string | null
          nfc_tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          home_club_id?: string
          away_club_id?: string
          match_date?: string
          stadium_lat?: number
          stadium_lng?: number
          match_type?: 'regular' | 'derby' | 'final' | 'afc'
          external_id?: number | null
          home_score?: number | null
          away_score?: number | null
          kickoff_at?: string | null
          venue?: string | null
          round?: string | null
          status?: 'upcoming' | 'live' | 'finished' | 'cancelled'
          base_points?: number
          points_multiplier?: number
          round_number?: number | null
          qr_code?: string | null
          nfc_tags?: string[] | null
          created_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          user_id: string
          match_id: string
          verification_method: 'geofence' | 'qr' | 'nfc'
          check_in_time: string
          check_out_time: string | null
          points_earned: number
          early_arrival_bonus: boolean
          stayed_until_end: boolean
          lat: number | null
          lng: number | null
          verification_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: string
          verification_method: 'geofence' | 'qr' | 'nfc'
          check_in_time?: string
          check_out_time?: string | null
          points_earned?: number
          early_arrival_bonus?: boolean
          stayed_until_end?: boolean
          lat?: number | null
          lng?: number | null
          verification_data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          match_id?: string
          verification_method?: 'geofence' | 'qr' | 'nfc'
          check_in_time?: string
          check_out_time?: string | null
          points_earned?: number
          early_arrival_bonus?: boolean
          stayed_until_end?: boolean
          lat?: number | null
          lng?: number | null
          verification_data?: Json
          created_at?: string
        }
      }
      points_transactions: {
        Row: {
          id: string
          user_id: string
          points: number
          transaction_type: string
          reference_id: string | null
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          points: number
          transaction_type: string
          reference_id?: string | null
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points?: number
          transaction_type?: string
          reference_id?: string | null
          description?: string
          created_at?: string
        }
      }
      partners: {
        Row: {
          id: string
          name_ar: string
          name_en: string
          logo_url: string | null
          category: 'restaurant' | 'retail' | 'entertainment' | 'services'
          description_ar: string | null
          website: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_en: string
          logo_url?: string | null
          category: 'restaurant' | 'retail' | 'entertainment' | 'services'
          description_ar?: string | null
          website?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name_ar?: string
          name_en?: string
          logo_url?: string | null
          category?: 'restaurant' | 'retail' | 'entertainment' | 'services'
          description_ar?: string | null
          website?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      partner_offers: {
        Row: {
          id: string
          partner_id: string
          title_ar: string
          description_ar: string
          points_required: number
          discount_percentage: number | null
          value_in_sar: number | null
          category: string
          is_active: boolean
          valid_from: string
          valid_until: string | null
          terms_ar: string | null
          max_redemptions: number | null
          current_redemptions: number
          created_at: string
        }
        Insert: {
          id?: string
          partner_id: string
          title_ar: string
          description_ar: string
          points_required: number
          discount_percentage?: number | null
          value_in_sar?: number | null
          category: string
          is_active?: boolean
          valid_from?: string
          valid_until?: string | null
          terms_ar?: string | null
          max_redemptions?: number | null
          current_redemptions?: number
          created_at?: string
        }
        Update: {
          id?: string
          partner_id?: string
          title_ar?: string
          description_ar?: string
          points_required?: number
          discount_percentage?: number | null
          value_in_sar?: number | null
          category?: string
          is_active?: boolean
          valid_from?: string
          valid_until?: string | null
          terms_ar?: string | null
          max_redemptions?: number | null
          current_redemptions?: number
          created_at?: string
        }
      }
      redemptions: {
        Row: {
          id: string
          user_id: string
          offer_id: string
          points_spent: number
          redemption_code: string
          status: 'pending' | 'used' | 'expired' | 'cancelled'
          redeemed_at: string
          used_at: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          offer_id: string
          points_spent: number
          redemption_code: string
          status?: 'pending' | 'used' | 'expired' | 'cancelled'
          redeemed_at?: string
          used_at?: string | null
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          offer_id?: string
          points_spent?: number
          redemption_code?: string
          status?: 'pending' | 'used' | 'expired' | 'cancelled'
          redeemed_at?: string
          used_at?: string | null
          expires_at?: string
          created_at?: string
        }
      }
      user_referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          status: 'registered' | 'first_match' | 'vip'
          points_awarded: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          status?: 'registered' | 'first_match' | 'vip'
          points_awarded?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          status?: 'registered' | 'first_match' | 'vip'
          points_awarded?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      calculate_user_level: {
        Args: { total_points: number }
        Returns: number
      }
      is_within_geofence: {
        Args: {
          user_lat: number
          user_lng: number
          stadium_lat: number
          stadium_lng: number
          radius_meters: number
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
