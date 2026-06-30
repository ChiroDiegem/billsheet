export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      email_whitelist: {
        Row: {
          id: number
          email: string
          added_by: string
          created_at: string | null
        }
        Insert: {
          id?: number
          email: string
          added_by: string
          created_at?: string | null
        }
        Update: {
          id?: number
          email?: string
          added_by?: string
          created_at?: string | null
        }
      }
      bills: {
        Row: {
          activity: string
          amount: number
          booked: boolean
          created_at: string | null
          date: string | null
          desc: string
          iban: string
          id: number
          image: string
          name: string
          paid: boolean
          payment_method: string
          post: string
          uid: string | null
        }
        Insert: {
          activity?: string
          amount?: number
          booked?: boolean
          created_at?: string | null
          date?: string | null
          desc?: string
          iban?: string
          id?: number
          image?: string
          name?: string
          paid?: boolean
          payment_method?: string
          post?: string
          uid?: string | null
        }
        Update: {
          activity?: string
          amount?: number
          booked?: boolean
          created_at?: string | null
          date?: string | null
          desc?: string
          iban?: string
          id?: number
          image?: string
          name?: string
          paid?: boolean
          payment_method?: string
          post?: string
          uid?: string | null
        }
      }
      contracts: {
        Row: {
          booked: boolean
          category: string
          created_at: string | null
          date: string
          deposit_returned: boolean
          desc: string
          file: string
          id: number
          name: string
          rent: number
          rent_received: boolean
          security_deposit: number
          security_deposit_received: boolean
          uid: string
        }
        Insert: {
          booked?: boolean
          category?: string
          created_at?: string | null
          date?: string
          deposit_returned?: boolean
          desc?: string
          file?: string
          id?: number
          name?: string
          rent?: number
          rent_received?: boolean
          security_deposit?: number
          security_deposit_received?: boolean
          uid: string
        }
        Update: {
          booked?: boolean
          category?: string
          created_at?: string | null
          date?: string
          deposit_returned?: boolean
          desc?: string
          file?: string
          id?: number
          name?: string
          rent?: number
          rent_received?: boolean
          security_deposit?: number
          security_deposit_received?: boolean
          uid?: string
        }
      }
      kassa: {
        Row: {
          id: number
          uid: string
          opened_by: string
          closed_by: string | null
          category: string
          sub_category: string
          opening_amount: Json
          opening_total: number
          closing_amount: Json | null
          closing_total: number | null
          is_open: boolean
          booked: boolean
          created_at: string | null
          closed_at: string | null
        }
        Insert: {
          id?: number
          uid: string
          opened_by: string
          closed_by?: string | null
          category: string
          sub_category: string
          opening_amount: Json
          opening_total: number
          closing_amount?: Json | null
          closing_total?: number | null
          is_open?: boolean
          booked?: boolean
          created_at?: string | null
          closed_at?: string | null
        }
        Update: {
          id?: number
          uid?: string
          opened_by?: string
          closed_by?: string | null
          category?: string
          sub_category?: string
          opening_amount?: Json
          opening_total?: number
          closing_amount?: Json | null
          closing_total?: number | null
          is_open?: boolean
          booked?: boolean
          created_at?: string | null
          closed_at?: string | null
        }
      }
      profiles: {
        Row: {
          allowed_posts: string | null;
          admin: boolean | null
          iban: string | null
          id: string
          name: string | null
          post: string | null
          updated_at: string | null
        }
        Insert: {
          admin?: boolean | null
          iban?: string | null
          id: string
          name?: string | null
          post?: string | null
          updated_at?: string | null
        }
        Update: {
          admin?: boolean | null
          iban?: string | null
          id?: string
          name?: string | null
          post?: string | null
          updated_at?: string | null
        }
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
