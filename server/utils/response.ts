import type { H3Event } from 'h3'
import type { ApiError, ApiSuccess } from '../../shared/types/api'

/** Domain error carrying an HTTP status + stable machine code. */
export class AppError extends Error {
  statusCode: number
  code: string
  fields?: Record<string, string[]>

  constructor(
    statusCode: number,
    code: string,
    message: string,
    fields?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.fields = fields
  }
}

export const errors = {
  badRequest: (m = 'Permintaan tidak valid', f?: Record<string, string[]>) =>
    new AppError(400, 'BAD_REQUEST', m, f),
  unauthorized: (m = 'Anda harus masuk terlebih dahulu') =>
    new AppError(401, 'UNAUTHORIZED', m),
  forbidden: (m = 'Anda tidak memiliki akses untuk tindakan ini') =>
    new AppError(403, 'FORBIDDEN', m),
  notFound: (m = 'Data tidak ditemukan') => new AppError(404, 'NOT_FOUND', m),
  conflict: (m = 'Data sudah ada') => new AppError(409, 'CONFLICT', m),
  tooMany: (m = 'Terlalu banyak percobaan. Coba lagi nanti.') =>
    new AppError(429, 'TOO_MANY_REQUESTS', m),
  internal: (m = 'Terjadi kesalahan pada server') =>
    new AppError(500, 'INTERNAL', m),
}

export function apiOk<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return { ok: true, data, ...(meta ? { meta } : {}) }
}

/** Normalise any thrown value into the standard ApiError envelope + status. */
export function toApiError(err: unknown): { status: number, body: ApiError } {
  if (err instanceof AppError) {
    return {
      status: err.statusCode,
      body: { ok: false, error: { code: err.code, message: err.message, fields: err.fields } },
    }
  }
  // h3 createError-style
  if (err && typeof err === 'object' && 'statusCode' in err) {
    const e = err as { statusCode: number, statusMessage?: string, message?: string }
    return {
      status: e.statusCode || 500,
      body: {
        ok: false,
        error: { code: 'HTTP_ERROR', message: e.statusMessage || e.message || 'Error' },
      },
    }
  }
  const message = err instanceof Error ? err.message : 'Unknown error'
  return { status: 500, body: { ok: false, error: { code: 'INTERNAL', message } } }
}

/** Wrap a handler so every route returns a consistent envelope. */
export function defineApiHandler<T>(fn: (event: H3Event) => Promise<T> | T) {
  return defineEventHandler(async (event): Promise<ApiSuccess<T> | ApiError> => {
    try {
      const data = await fn(event)
      return apiOk(data)
    }
    catch (err) {
      const { status, body } = toApiError(err)
      setResponseStatus(event, status)
      if (status >= 500) console.error('[api]', event.path, err)
      return body
    }
  })
}
