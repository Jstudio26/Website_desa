<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'
import { NAV } from '~/config/site'

const props = withDefaults(defineProps<{ transparent?: boolean }>(), { transparent: false })
const { settings } = useSettings()
const { y } = useWindowScroll()
const route = useRoute()

const navigation = NAV
const scrolled = computed(() => y.value > 20)
const solid = computed(() => !props.transparent || scrolled.value)

const mobileOpen = ref(false)
const openDropdown = ref<string | null>(null)
watch(() => route.fullPath, () => { mobileOpen.value = false; openDropdown.value = null })

const isActive = (url: string) => (url === '/' ? route.path === '/' : route.path.startsWith(url))
const isActiveGroup = (item: (typeof navigation)[number]) =>
  item.children.length ? item.children.some((c) => isActive(c.url)) : isActive(item.url)
</script>

<template>
  <header class="sticky top-0 z-50">
    <!-- flag accent line -->
    <div class="h-1 w-full bg-primary" />

    <div
      class="transition-all duration-300"
      :class="solid ? 'border-b border-line/80 bg-canvas/90 backdrop-blur-md shadow-sm' : 'bg-transparent'"
    >
      <div class="container-app flex items-center justify-between gap-6" :class="scrolled ? 'h-16' : 'h-[4.75rem]'">
        <!-- Brand -->
        <NuxtLink to="/" class="flex min-w-0 items-center gap-3">
          <span
            class="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl shadow-sm"
            :class="solid ? 'bg-primary' : 'bg-white'"
          >
            <img v-if="settings.logoUrl" :src="settings.logoUrl" alt="" class="h-8 w-8 object-contain">
            <span
              v-else
              class="font-heading text-lg font-extrabold"
              :class="solid ? 'text-white' : 'text-primary'"
            >{{ settings.villageName.charAt(0) }}</span>
          </span>
          <span class="min-w-0" :class="solid ? 'text-ink' : 'text-white'">
            <span class="block truncate font-heading text-[0.95rem] font-extrabold leading-tight">
              {{ settings.villageName }}
            </span>
            <span class="block truncate text-[0.7rem] font-medium uppercase tracking-wide opacity-70">
              {{ settings.district || 'Sistem Informasi Kelurahan' }}
            </span>
          </span>
        </NuxtLink>

        <!-- Desktop nav -->
        <nav class="hidden items-center gap-0.5 lg:flex">
          <div
            v-for="item in navigation"
            :key="item.id"
            class="relative"
            @mouseenter="item.children.length && (openDropdown = item.id)"
            @mouseleave="item.children.length && (openDropdown = null)"
          >
            <NuxtLink
              :to="item.url"
              class="group/nav relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition"
              :class="[
                solid ? 'text-ink hover:text-primary' : 'text-white/90 hover:text-white',
                isActiveGroup(item) && (solid ? '!text-primary' : '!text-white'),
              ]"
            >
              {{ item.label }}
              <AppIcon v-if="item.children.length" name="chevronDown" :size="13" />
              <span
                class="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-primary transition-all duration-300"
                :class="isActiveGroup(item) ? 'opacity-100' : 'opacity-0 scale-x-0 group-hover/nav:opacity-40 group-hover/nav:scale-x-100'"
              />
            </NuxtLink>

            <Transition name="fade">
              <div
                v-if="item.children.length && openDropdown === item.id"
                class="absolute left-0 top-full min-w-[13rem] rounded-lg border border-line/80 bg-canvas p-1.5 shadow-lift"
              >
                <NuxtLink
                  v-for="child in item.children"
                  :key="child.id"
                  :to="child.url"
                  class="block rounded-md px-3 py-2 text-sm font-medium transition"
                  :class="isActive(child.url) ? 'bg-primary/10 text-primary' : 'text-ink hover:bg-surface-muted'"
                >
                  {{ child.label }}
                </NuxtLink>
              </div>
            </Transition>
          </div>
        </nav>

        <div class="flex items-center gap-2">
          <UiButton to="/kontak" size="sm" class="hidden sm:inline-flex">Kontak</UiButton>
          <button
            class="grid h-10 w-10 place-items-center rounded-lg lg:hidden"
            :class="solid ? 'text-ink hover:bg-surface-muted' : 'text-white hover:bg-white/10'"
            aria-label="Menu"
            @click="mobileOpen = !mobileOpen"
          >
            <AppIcon :name="mobileOpen ? 'close' : 'menu'" :size="22" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile drawer -->
    <Transition name="slide">
      <div v-if="mobileOpen" class="border-b border-line bg-canvas lg:hidden">
        <nav class="container-app max-h-[70vh] space-y-1 overflow-y-auto py-4">
          <template v-for="item in navigation" :key="item.id">
            <template v-if="item.children.length">
              <p class="px-3 pt-3 text-xs font-bold uppercase tracking-wide text-ink-muted">{{ item.label }}</p>
              <NuxtLink
                v-for="child in item.children"
                :key="child.id"
                :to="child.url"
                class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold"
                :class="isActive(child.url) ? 'bg-primary/10 text-primary' : 'text-ink hover:bg-surface-muted'"
              >
                {{ child.label }}
                <AppIcon v-if="isActive(child.url)" name="chevronRight" :size="15" />
              </NuxtLink>
            </template>
            <NuxtLink
              v-else
              :to="item.url"
              class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold"
              :class="isActive(item.url) ? 'bg-primary/10 text-primary' : 'text-ink hover:bg-surface-muted'"
            >
              {{ item.label }}
              <AppIcon v-if="isActive(item.url)" name="chevronRight" :size="15" />
            </NuxtLink>
          </template>
          <UiButton to="/kontak" block class="mt-3">Kontak</UiButton>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
