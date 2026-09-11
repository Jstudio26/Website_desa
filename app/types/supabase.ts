import type { SettingsData, Official, Post, GalleryItem, Message } from './database'

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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
