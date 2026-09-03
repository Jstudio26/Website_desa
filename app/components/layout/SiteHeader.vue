<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

const props = withDefaults(defineProps<{ transparent?: boolean }>(), { transparent: false })
const { village, navigation } = useSiteConfig()
const { y } = useWindowScroll()
const route = useRoute()

const scrolled = computed(() => y.value > 24)
const solid = computed(() => !props.transparent || scrolled.value)

const mobileOpen = ref(false)
const openDropdown = ref<string | null>(null)
watch(() => route.fullPath, () => { mobileOpen.value = false; openDropdown.value = null })

const isActive = (url: string) => url !== '/' && route.path.startsWith(url)
</script>

<template>
  <header
    class="sticky top-0 z-50 transition-all duration-300"
    :class="solid ? 'border-b border-line bg-surface/95 backdrop-blur shadow-sm' : 'bg-transparent'"
  >
    <div class="container-app flex items-center justify-between gap-6" :class="scrolled ? 'h-16' : 'h-20'">
      <!-- Brand -->
      <NuxtLink to="/" class="flex min-w-0 items-center gap-3">
        <img
          v-if="village.logo"
          :src="village.logo"
          alt=""
          class="h-10 w-10 shrink-0 rounded-md object-contain"
        >
        <span
          v-else
          class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary font-heading text-lg font-bold text-white"
        >
          {{ village.villageName.charAt(0) }}
        </span>
        <span class="min-w-0" :class="solid ? 'text-ink' : 'text-white'">
          <span class="block truncate font-heading text-base font-semibold leading-tight">
            {{ village.villageName }}
          </span>
          <span class="block truncate text-[11px] uppercase tracking-wide opacity-70">
            {{ village.district || 'Sistem Informasi Desa' }}
          </span>
        </span>
      </NuxtLink>

      <!-- Desktop nav -->
      <nav class="hidden items-center gap-1 lg:flex">
        <template v-for="item in navigation" :key="item.id">
          <div v-if="item.children.length" class="group relative">
            <button
              class="flex items-center gap-1 rounded-theme px-3 py-2 text-sm font-medium transition"
              :class="[
                solid ? 'text-ink hover:bg-surface-muted' : 'text-white/90 hover:bg-white/10',
                isActive(item.url) && 'text-primary',
              ]"
            >
              {{ item.label }}
              <AppIcon name="chevronDown" :size="14" class="transition group-hover:rotate-180" />
            </button>
            <div
              class="invisible absolute left-0 top-full w-60 translate-y-1 rounded-theme border border-line bg-surface p-1.5 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
            >
              <NuxtLink
                v-for="child in item.children"
                :key="child.id"
                :to="child.url"
                class="block rounded-md px-3 py-2 text-sm text-ink-muted transition hover:bg-surface-muted hover:text-primary"
              >
                {{ child.label }}
              </NuxtLink>
            </div>
          </div>
          <NuxtLink
            v-else
            :to="item.url"
            class="rounded-theme px-3 py-2 text-sm font-medium transition"
            :class="[
              solid ? 'text-ink hover:bg-surface-muted' : 'text-white/90 hover:bg-white/10',
              isActive(item.url) && 'text-primary',
            ]"
          >
            {{ item.label }}
          </NuxtLink>
        </template>
      </nav>

      <div class="flex items-center gap-2">
        <NuxtLink
          to="/layanan"
          class="hidden rounded-theme bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 sm:inline-flex"
        >
          Layanan Desa
        </NuxtLink>
        <button
          class="grid h-10 w-10 place-items-center rounded-theme lg:hidden"
          :class="solid ? 'text-ink hover:bg-surface-muted' : 'text-white hover:bg-white/10'"
          aria-label="Menu"
          @click="mobileOpen = !mobileOpen"
        >
          <AppIcon :name="mobileOpen ? 'close' : 'menu'" :size="22" />
        </button>
      </div>
    </div>

    <!-- Mobile drawer -->
    <Transition name="slide">
      <div v-if="mobileOpen" class="border-t border-line bg-surface lg:hidden">
        <nav class="container-app max-h-[70vh] space-y-1 overflow-y-auto py-4">
          <template v-for="item in navigation" :key="item.id">
            <div v-if="item.children.length">
              <button
                class="flex w-full items-center justify-between rounded-theme px-3 py-2.5 text-left text-sm font-medium text-ink"
                @click="openDropdown = openDropdown === item.id ? null : item.id"
              >
                {{ item.label }}
                <AppIcon name="chevronDown" :size="16" :class="openDropdown === item.id && 'rotate-180'" />
              </button>
              <div v-if="openDropdown === item.id" class="ml-3 border-l border-line pl-3">
                <NuxtLink
                  v-for="child in item.children"
                  :key="child.id"
                  :to="child.url"
                  class="block rounded-md px-3 py-2 text-sm text-ink-muted hover:text-primary"
                >
                  {{ child.label }}
                </NuxtLink>
              </div>
            </div>
            <NuxtLink
              v-else
              :to="item.url"
              class="block rounded-theme px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              {{ item.label }}
            </NuxtLink>
          </template>
          <NuxtLink
            to="/layanan"
            class="mt-2 block rounded-theme bg-primary px-3 py-2.5 text-center text-sm font-semibold text-white"
          >
            Layanan Desa
          </NuxtLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
