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
    = 'inline-flex items-center justify-center gap-2 rounded-theme font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:pointer-events-none'
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }
  const variants = {
    primary: 'bg-primary text-white hover:brightness-110 active:brightness-95 shadow-sm',
    secondary: 'bg-secondary text-white hover:brightness-110',
    accent: 'bg-accent text-white hover:brightness-110',
    outline: 'border border-line text-ink hover:bg-surface-muted',
    ghost: 'text-ink hover:bg-surface-muted',
    danger: 'bg-red-600 text-white hover:bg-red-700',
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
