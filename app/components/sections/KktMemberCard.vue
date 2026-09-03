<script setup lang="ts">
interface Member {
  name: string
  photo: string | null
  studentId: string | null
  studyProgram: string | null
  faculty: string | null
  university: string | null
  position: string | null
  instagram: string | null
  linkedin: string | null
  email: string | null
}
const props = defineProps<{ member: Member, roleLabel?: string, prominent?: boolean }>()

const initials = computed(() =>
  props.member.name.split(' ').slice(0, 2).map((s) => s[0]).join('').toUpperCase(),
)
</script>

<template>
  <figure
    class="reveal group overflow-hidden rounded-theme border border-line bg-surface text-center transition hover:-translate-y-1 hover:shadow-xl"
    :class="prominent && 'ring-2 ring-primary/30 sm:col-span-2 lg:col-span-1'"
  >
    <div class="relative aspect-[4/5] overflow-hidden bg-surface-muted">
      <img
        v-if="member.photo"
        :src="member.photo"
        :alt="member.name"
        class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
      >
      <div v-else class="grid h-full w-full place-items-center">
        <span class="font-heading text-4xl font-bold text-ink-muted/40">{{ initials }}</span>
      </div>
      <div
        v-if="roleLabel"
        class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3"
      >
        <span class="text-xs font-semibold uppercase tracking-wide text-white">{{ roleLabel }}</span>
      </div>
    </div>
    <figcaption class="p-4">
      <p class="font-heading font-semibold text-ink" :class="prominent ? 'text-lg' : 'text-base'">
        {{ member.name }}
      </p>
      <p v-if="member.position && !roleLabel" class="text-xs font-medium text-primary">{{ member.position }}</p>
      <p v-if="member.studentId" class="mt-1 text-xs text-ink-muted">NIM. {{ member.studentId }}</p>
      <p v-if="member.studyProgram" class="text-xs text-ink-muted">{{ member.studyProgram }}</p>
      <p v-if="member.faculty" class="text-xs text-ink-muted">{{ member.faculty }}</p>

      <div v-if="member.instagram || member.linkedin || member.email" class="mt-3 flex justify-center gap-2">
        <a v-if="member.instagram" :href="member.instagram" target="_blank" rel="noopener" class="text-ink-muted hover:text-primary" aria-label="Instagram">
          <AppIcon name="instagram" :size="16" />
        </a>
        <a v-if="member.linkedin" :href="member.linkedin" target="_blank" rel="noopener" class="text-ink-muted hover:text-primary" aria-label="LinkedIn">
          <AppIcon name="external" :size="16" />
        </a>
        <a v-if="member.email" :href="`mailto:${member.email}`" class="text-ink-muted hover:text-primary" aria-label="Email">
          <AppIcon name="mail" :size="16" />
        </a>
      </div>
    </figcaption>
  </figure>
</template>
