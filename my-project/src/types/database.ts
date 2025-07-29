export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          role: string
          created_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          role?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          role?: string
          created_at?: string | null
        }
      }
      tracked_places: {
        Row: {
          id: string
          user_id: string | null
          place_url: string
          place_name: string | null
          search_keyword: string
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          place_url: string
          place_name?: string | null
          search_keyword: string
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          place_url?: string
          place_name?: string | null
          search_keyword?: string
          is_active?: boolean | null
          created_at?: string | null
        }
      }
      rankings: {
        Row: {
          id: string
          tracked_place_id: string | null
          rank: number | null
          checked_at: string | null
        }
        Insert: {
          id?: string
          tracked_place_id?: string | null
          rank?: number | null
          checked_at?: string | null
        }
        Update: {
          id?: string
          tracked_place_id?: string | null
          rank?: number | null
          checked_at?: string | null
        }
      }
      marketing_memos: {
        Row: {
          id: string
          tracked_place_id: string | null
          content: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tracked_place_id?: string | null
          content?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tracked_place_id?: string | null
          content?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      credits: {
        Row: {
          id: string
          user_id: string | null
          balance: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          balance?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          balance?: number | null
          updated_at?: string | null
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string | null
          amount: number | null
          type: string | null
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          amount?: number | null
          type?: string | null
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          amount?: number | null
          type?: string | null
          description?: string | null
          created_at?: string | null
        }
      }
      memo_views: {
        Row: {
          id: string
          memo_id: string | null
          user_id: string | null
          credits_used: number | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          memo_id?: string | null
          user_id?: string | null
          credits_used?: number | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          memo_id?: string | null
          user_id?: string | null
          credits_used?: number | null
          viewed_at?: string | null
        }
      }
    }
  }
}