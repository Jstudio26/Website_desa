import { asc, eq } from 'drizzle-orm'
import { defineApiHandler } from '../../../utils/response'
import { assertFeature } from '../../../utils/feature'
import { useDb, schema } from '../../../utils/db'

export default defineApiHandler(async () => {
  await assertFeature('enableDigitalServices')
  const db = useDb()
  return db.query.services.findMany({
    where: eq(schema.services.isActive, true),
    orderBy: [asc(schema.services.displayOrder)],
  })
})
