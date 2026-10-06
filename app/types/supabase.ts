import type {
  SettingsData,
  Official,
  Post,
  GalleryItem,
  Message,
  CommunityGroup,
  CommunityGroupMember,
  Neighborhood,
  NeighborhoodRt,
  Landmark,
  LetterRequest,
  LetterRequestEvent,
  TicketStatus,
  Complaint,
} from './database'

/**
 * Minimal typed schema for supabase-js. Pass to the client:
 *   useSupabaseClient<Database>()
 * Insert/Update are kept permissive on purpose - client-side validation is light
 * and Supabase RLS is the real gate.
 */

type Table<Row> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      settings: Table<{ id: number, data: SettingsData, updated_at: string }>
      officials: Table<Official>
      posts: Table<Post>
      gallery: Table<GalleryItem>
      messages: Table<Message>
      community_groups: Table<CommunityGroup>
      community_group_members: Table<CommunityGroupMember>
      neighborhoods: Table<Neighborhood>
      neighborhood_rts: Table<NeighborhoodRt>
      landmarks: Table<Landmark>
      letter_requests: Table<LetterRequest>
      complaints: Table<Complaint>
      letter_request_events: Table<LetterRequestEvent>
      admins: Table<{ email: string, created_at: string }>
    }
    Views: Record<string, never>
    /** Formulir publik & cek status lewat fungsi (validasi + anti-spam di database). */
    Functions: {
      is_admin: { Args: Record<string, never>, Returns: boolean }
      ajukan_surat: {
        Args: { p_type: string, p_name: string, p_phone: string, p_address?: string | null, p_purpose?: string | null }
        Returns: string
      }
      kirim_pengaduan: {
        Args: {
          p_name: string
          p_category: string
          p_description: string
          p_phone?: string | null
          p_location?: string | null
          p_photo_url?: string | null
        }
        Returns: string
      }
      kirim_pesan: {
        Args: { p_name: string, p_message: string, p_email?: string | null, p_phone?: string | null }
        Returns: undefined
      }
      cek_status: { Args: { p_code: string }, Returns: TicketStatus | null }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
