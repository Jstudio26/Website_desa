import type { Post, PostType } from '~/types/database'
import type { Database } from '~/types/supabase'

const PAGE_SIZE = 9

interface ListParams {
  type: PostType
  page?: number
  search?: string
  pageSize?: number
}

/** Published posts of one type, paginated + optional title search. */
export function usePostList(params: () => ListParams) {
  const supabase = useSupabaseClient<Database>()

  return useAsyncData(
    () => {
      const p = params()
      return `posts:${p.type}:${p.page ?? 1}:${p.search ?? ''}`
    },
    async () => {
      const p = params()
      const page = p.page ?? 1
      const size = p.pageSize ?? PAGE_SIZE
      const from = (page - 1) * size

      let query = supabase
        .from('posts')
        .select('id,type,title,slug,excerpt,cover_url,published_at,created_at', { count: 'exact' })
        .eq('type', p.type)
        .eq('published', true)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, from + size - 1)

      if (p.search?.trim()) query = query.ilike('title', `%${p.search.trim()}%`)

      const { data, count, error } = await query
      if (error) throw error

      return {
        items: (data ?? []) as Post[],
        total: count ?? 0,
        page,
        pageSize: size,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / size)),
      }
    },
    { watch: [params] },
  )
}

/** One published post by slug, plus up to 3 other recent posts of the same type. */
export function usePostDetail(type: PostType, slug: () => string) {
  const supabase = useSupabaseClient<Database>()

  return useAsyncData(
    () => `post:${type}:${slug()}`,
    async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('type', type)
        .eq('slug', slug())
        .eq('published', true)
        .maybeSingle()
      if (error) throw error
      if (!data) return { post: null as Post | null, related: [] as Post[] }

      const { data: related } = await supabase
        .from('posts')
        .select('id,type,title,slug,excerpt,cover_url,published_at')
        .eq('type', type)
        .eq('published', true)
        .neq('id', (data as Post).id)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(3)

      return { post: data as Post, related: (related ?? []) as Post[] }
    },
    { watch: [slug] },
  )
}
