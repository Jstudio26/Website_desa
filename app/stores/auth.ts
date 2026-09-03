import { defineStore } from 'pinia'
import type { AuthUser } from '~~/shared/types/api'
import type { Permission } from '~~/shared/types/rbac'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    ready: false,
  }),
  getters: {
    isAuthenticated: (s) => !!s.user,
    can: (s) => (permission: Permission) => !!s.user?.permissions.includes(permission),
    isRole: (s) => (...roles: string[]) => !!s.user && roles.includes(s.user.role),
  },
  actions: {
    async fetchMe() {
      try {
        const res = await $fetch<{ ok: boolean, data: { user: AuthUser | null } }>('/api/auth/me')
        this.user = res.data.user
      }
      catch {
        this.user = null
      }
      finally {
        this.ready = true
      }
    },
    async login(email: string, password: string, remember = true) {
      const res = await $fetch<{ ok: boolean, data: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password, remember },
      })
      this.user = res.data
      this.ready = true
      return res.data
    },
    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      this.user = null
    },
  },
})
