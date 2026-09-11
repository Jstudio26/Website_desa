<script setup lang="ts">
// Supabase auth callback target. The @nuxtjs/supabase module completes the
// session here, then we forward into the admin panel.
definePageMeta({ layout: false })

const user = useSupabaseUser()

watchEffect(() => {
  if (user.value) navigateTo('/admin', { replace: true })
})

onMounted(() => {
  setTimeout(() => {
    if (!user.value) navigateTo('/admin/login', { replace: true })
  }, 3000)
})
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-surface text-center">
    <div>
      <UiSpinner class="mx-auto h-8 w-8 text-primary" />
      <p class="mt-4 text-sm text-ink-muted">Menyelesaikan proses masuk…</p>
    </div>
  </div>
</template>
