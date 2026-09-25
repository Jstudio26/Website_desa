<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { CommunityGroupWithMembers } from '~/types/database'

const supabase = useSupabaseClient<Database>()
const { settings } = useSettings()

const { data: groups } = await useAsyncData('organisasi', async () => {
  const { data } = await supabase
    .from('community_groups')
    .select('*, community_group_members(*)')
    .order('display_order', { ascending: true })
    .order('display_order', { ascending: true, foreignTable: 'community_group_members' })
  return (data ?? []) as CommunityGroupWithMembers[]
})

const categories = computed(() => {
  const list = groups.value ?? []
  const order: string[] = []
  const byCategory = new Map<string, CommunityGroupWithMembers[]>()
  for (const g of list) {
    if (!byCategory.has(g.category)) {
      byCategory.set(g.category, [])
      order.push(g.category)
    }
    byCategory.get(g.category)!.push(g)
  }
  return order.map((category) => ({ category, groups: byCategory.get(category)! }))
})

function sortedMembers(g: CommunityGroupWithMembers) {
  const priority = ['ketua', 'sekretaris', 'bendahara']
  return [...g.community_group_members].sort((a, b) => {
    const ai = priority.indexOf(a.role.trim().toLowerCase())
    const bi = priority.indexOf(b.role.trim().toLowerCase())
    const ar = ai === -1 ? priority.length : ai
    const br = bi === -1 ? priority.length : bi
    if (ar !== br) return ar - br
    return a.display_order - b.display_order
  })
}

useHead({ title: 'Organisasi Kemasyarakatan' })
</script>

<template>
  <div>
    <PageHero
      title="Organisasi Kemasyarakatan"
      :subtitle="`Kelompok dan lembaga kemasyarakatan di ${settings.villageName}.`"
      :breadcrumb="[{ label: 'Organisasi' }]"
    />

    <section v-if="categories.length" class="section container-app space-y-16">
      <div v-for="c in categories" :key="c.category">
        <span class="eyebrow"><span class="h-px w-6 bg-primary" /> {{ c.category }}</span>
        <h2 class="mt-4 font-heading text-2xl font-extrabold">{{ c.category }}</h2>

        <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="g in c.groups" :key="g.id" class="card p-5">
            <h3 class="font-heading text-lg font-bold text-ink">{{ g.name }}</h3>
            <p v-if="g.description" class="mt-1.5 text-sm text-ink-muted">{{ g.description }}</p>

            <ul v-if="g.community_group_members.length" class="mt-4 divide-y divide-line border-t border-line">
              <li v-for="m in sortedMembers(g)" :key="m.id" class="flex items-start justify-between gap-3 py-2.5">
                <span class="text-sm font-medium text-ink">{{ m.name }}</span>
                <span class="shrink-0 text-right text-xs text-ink-muted">
                  {{ m.role }}
                  <span v-if="m.note" class="block text-[11px] text-ink-muted/70">{{ m.note }}</span>
                </span>
              </li>
            </ul>
            <p v-else class="mt-4 border-t border-line pt-3 text-xs text-ink-muted">Belum ada data pengurus.</p>
          </div>
        </div>
      </div>
    </section>

    <section v-else class="section container-app">
      <UiEmptyState title="Belum ada data" message="Data organisasi kemasyarakatan belum diisi oleh admin." />
    </section>
  </div>
</template>
