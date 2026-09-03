import { and, eq } from 'drizzle-orm'
import { asc } from 'drizzle-orm'
import { defineApiHandler, errors } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useParam, zId } from '../../../utils/validation'
import { useDb, schema } from '../../../utils/db'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'page.manage')
  const id = useParam(event, 'id', zId)
  const db = useDb()
  const page = await db.query.pages.findFirst({
    where: eq(schema.pages.id, id),
    with: { sections: { orderBy: [asc(schema.pageSections.order)] } },
  })
  if (!page) throw errors.notFound('Halaman tidak ditemukan')
  return page
})

void and
