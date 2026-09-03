import type { H3Event } from 'h3'
import { z, type ZodTypeAny } from 'zod'
import { AppError } from './response'

function flatten(err: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_'
    ;(out[key] ??= []).push(issue.message)
  }
  return out
}

/** Parse & validate the JSON body, throwing a 400 AppError with field errors. */
export async function useBody<S extends ZodTypeAny>(event: H3Event, schema: S): Promise<z.infer<S>> {
  const raw = await readBody(event).catch(() => ({}))
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION', 'Data yang dikirim tidak valid', flatten(parsed.error))
  }
  return parsed.data
}

/** Parse & validate the query string. */
export function useQueryParams<S extends ZodTypeAny>(event: H3Event, schema: S): z.infer<S> {
  const parsed = schema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION', 'Parameter tidak valid', flatten(parsed.error))
  }
  return parsed.data
}

/** Validate a single route param (e.g. :id / :slug). */
export function useParam<S extends ZodTypeAny>(event: H3Event, name: string, schema: S): z.infer<S> {
  const parsed = schema.safeParse(getRouterParam(event, name))
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION', `Parameter "${name}" tidak valid`, flatten(parsed.error))
  }
  return parsed.data
}

/* ---------- Reusable field schemas ---------- */
export const zId = z.string().uuid('ID tidak valid')
export const zSlug = z
  .string()
  .min(1)
  .max(240)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung')
export const zPagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  q: z.string().trim().max(160).optional(),
})

export { z }
