import { WebSocket } from 'ws'

/**
 * Node.js < 22 has no global `WebSocket`. @supabase/realtime-js (pulled in by
 * @supabase/supabase-js) checks for one at construction time and throws during
 * SSR without it. This app never uses realtime, but the check still runs, so we
 * provide a WebSocket implementation on the server. Harmless on Node 22+ where
 * the global already exists.
 */
export default defineNitroPlugin(() => {
  const g = globalThis as Record<string, unknown>
  if (typeof g.WebSocket === 'undefined') {
    g.WebSocket = WebSocket
  }
})
