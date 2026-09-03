/**
 * Role Based Access Control primitives.
 * Shared between the Nitro server (authorization) and the app (UI gating).
 */

export const ROLES = ['SUPER_ADMIN', 'ADMIN_DESA', 'EDITOR'] as const
export type Role = (typeof ROLES)[number]

/** Fine-grained permissions. Screens/endpoints check these, not raw roles. */
export const PERMISSIONS = [
  'settings.manage',
  'theme.manage',
  'menu.manage',
  'page.manage',
  'news.manage',
  'announcement.manage',
  'event.manage',
  'government.manage',
  'statistics.manage',
  'umkm.manage',
  'tourism.manage',
  'gallery.manage',
  'document.manage',
  'media.manage',
  'service.manage',
  'service.process',
  'kkt.manage',
  'user.manage',
  'activity.view',
] as const
export type Permission = (typeof PERMISSIONS)[number]

const EDITOR_PERMISSIONS: Permission[] = [
  'news.manage',
  'announcement.manage',
  'event.manage',
  'gallery.manage',
  'media.manage',
  'page.manage',
]

const ADMIN_DESA_PERMISSIONS: Permission[] = PERMISSIONS.filter(
  (p) => p !== 'user.manage',
)

export const ROLE_PERMISSIONS: Record<Role, Permission[] | '*'> = {
  SUPER_ADMIN: '*',
  ADMIN_DESA: ADMIN_DESA_PERMISSIONS,
  EDITOR: EDITOR_PERMISSIONS,
}

export function hasPermission(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false
  const grant = ROLE_PERMISSIONS[role]
  if (grant === '*') return true
  return grant.includes(permission)
}

export function roleAtLeast(role: Role | undefined | null, min: Role): boolean {
  if (!role) return false
  const order: Role[] = ['EDITOR', 'ADMIN_DESA', 'SUPER_ADMIN']
  return order.indexOf(role) >= order.indexOf(min)
}
