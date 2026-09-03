import type { ApiResponse } from '~~/shared/types/api'

export class ApiClientError extends Error {
  code: string
  fields?: Record<string, string[]>
  status: number
  constructor(status: number, code: string, message: string, fields?: Record<string, string[]>) {
    super(message)
    this.code = code
    this.status = status
    this.fields = fields
  }
}

/**
 * Thin wrapper over $fetch that unwraps the standard { ok, data } envelope and
 * throws a typed ApiClientError (with field errors) on failure.
 */
export async function apiFetch<T>(url: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
  try {
    const res = await $fetch<ApiResponse<T>>(url, opts as never)
    if (res && typeof res === 'object' && 'ok' in res) {
      if (res.ok) return res.data
      throw new ApiClientError(400, res.error.code, res.error.message, res.error.fields)
    }
    return res as T
  }
  catch (err: unknown) {
    if (err instanceof ApiClientError) throw err
    // FetchError from ofetch carries `.data` with our envelope
    const fe = err as { data?: ApiResponse<unknown>, status?: number, statusCode?: number }
    const status = fe.status ?? fe.statusCode ?? 500
    if (fe.data && typeof fe.data === 'object' && 'error' in fe.data && fe.data.error) {
      throw new ApiClientError(status, fe.data.error.code, fe.data.error.message, fe.data.error.fields)
    }
    throw new ApiClientError(status, 'NETWORK', 'Gagal terhubung ke server')
  }
}

/** SSR-friendly GET returning { data, pending, error, refresh }. */
export function useApiData<T>(key: string, url: string | (() => string), opts: Record<string, unknown> = {}) {
  return useAsyncData<T>(key, () => apiFetch<T>(typeof url === 'function' ? url() : url), opts)
}
