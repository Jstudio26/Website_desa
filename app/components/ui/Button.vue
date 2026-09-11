<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  to?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
  disabled?: boolean
  block?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})

const classes = computed(() => {
  const base
    = 'group/btn relative inline-flex items-center justify-center gap-2 rounded-theme font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'
  const sizes = {
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-[0.95rem]',
  }
  const variants = {
    primary: 'bg-primary text-white shadow-sm hover:bg-primary-deep hover:shadow-red',
    secondary: 'bg-ink text-white hover:bg-ink/90',
    accent: 'bg-accent text-white hover:brightness-105',
    outline: 'border border-line bg-surface text-ink hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary',
    ghost: 'text-ink hover:bg-surface-muted',
    danger: 'bg-primary text-white hover:bg-primary-deep',
  }
  return [base, sizes[props.size], variants[props.variant], props.block && 'w-full']
})
const tag = computed(() => (props.to ? resolveComponent('NuxtLink') : props.href ? 'a' : 'button'))
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :type="to || href ? undefined : type"
    :disabled="disabled || loading"
    :class="classes"
  >
    <UiSpinner v-if="loading" class="h-4 w-4" />
    <slot v-else name="icon" />
    <slot />
  </component>
</template>
