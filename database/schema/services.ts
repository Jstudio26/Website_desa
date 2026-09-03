import { boolean, index, integer, jsonb, pgEnum, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { pk, timestamps } from './_shared'
import { users } from './auth'

/**
 * Digital services module. A `service` is a definition (requirements + a
 * dynamic form schema); a `service_request` is a citizen submission tracked
 * through a status workflow. Adding a new service = one DB row, no code.
 */
export const services = pgTable(
  'services',
  {
    id: pk(),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 220 }).notNull().unique(),
    description: text('description').notNull().default(''),
    icon: varchar('icon', { length: 60 }),
    requirements: jsonb('requirements').$type<string[]>().notNull().default([]),
    templateUrl: text('template_url'),
    /** Dynamic form: [{ name, label, type, required, options? }] */
    formSchema: jsonb('form_schema')
      .$type<Array<{ name: string, label: string, type: string, required: boolean, options?: string[] }>>()
      .notNull()
      .default([]),
    estimatedDays: integer('estimated_days'),
    isOnline: boolean('is_online').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    ...timestamps,
  },
  (t) => ({ slugIdx: index('services_slug_idx').on(t.slug) }),
)

export const serviceRequestStatusEnum = pgEnum('service_request_status', [
  'submitted',
  'in_review',
  'need_revision',
  'approved',
  'rejected',
  'completed',
])

export const serviceRequests = pgTable(
  'service_requests',
  {
    id: pk(),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    /** Public tracking code shown to the citizen. */
    ticket: varchar('ticket', { length: 24 }).notNull().unique(),
    applicantName: varchar('applicant_name', { length: 200 }).notNull(),
    applicantNik: varchar('applicant_nik', { length: 32 }),
    applicantPhone: varchar('applicant_phone', { length: 40 }).notNull(),
    applicantEmail: varchar('applicant_email', { length: 160 }),
    formData: jsonb('form_data').$type<Record<string, unknown>>().notNull().default({}),
    attachments: jsonb('attachments').$type<string[]>().notNull().default([]),
    status: serviceRequestStatusEnum('status').notNull().default('submitted'),
    note: text('note'),
    resultFileUrl: text('result_file_url'),
    handledById: uuid('handled_by_id').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => ({
    serviceIdx: index('service_requests_service_idx').on(t.serviceId),
    statusIdx: index('service_requests_status_idx').on(t.status),
    ticketIdx: index('service_requests_ticket_idx').on(t.ticket),
  }),
)

export const servicesRelations = relations(services, ({ many }) => ({
  requests: many(serviceRequests),
}))
export const serviceRequestsRelations = relations(serviceRequests, ({ one }) => ({
  service: one(services, { fields: [serviceRequests.serviceId], references: [services.id] }),
  handledBy: one(users, { fields: [serviceRequests.handledById], references: [users.id] }),
}))
