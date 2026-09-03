<script setup lang="ts">
/**
 * Lightweight inline icon set (stroke, 24px grid). Keeps the bundle free of an
 * icon library while honouring the "no emoji as icons" design rule.
 */
const props = withDefaults(defineProps<{ name: string, size?: number | string }>(), { size: 20 })

const P: Record<string, string> = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M18 6 6 18M6 6l12 12',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35',
  chevronDown: 'm6 9 6 6 6-6',
  chevronRight: 'm9 6 6 6-6 6',
  arrowRight: 'M5 12h14M13 5l7 7-7 7',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z',
  mail: 'M4 4h16v16H4zM4 6l8 6 8-6',
  mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Zm-9 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  home: 'M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5Z',
  building: 'M4 22V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v18M15 9h4a1 1 0 0 1 1 1v12M8 7h2M8 11h2M8 15h2',
  news: 'M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V7h4M14 7h4M14 11h4M8 15h10',
  megaphone: 'm3 11 18-5v12L3 14v-3ZM11.6 16.8a3 3 0 1 1-5.8-1.6',
  chart: 'M3 3v18h18M7 16l4-6 4 4 5-8',
  chartPie: 'M12 2a10 10 0 1 0 10 10h-10V2Z',
  store: 'M3 9 4 4h16l1 5M4 9h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9ZM4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0',
  mountain: 'm8 3 4 8 5-5 6 15H1L8 3Z',
  image: 'M3 3h18v18H3zM3 15l5-5 4 4 4-4 5 5M9 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  gallery: 'M3 5h14v14H3zM7 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM3 15l4-4 5 5M21 7v12a2 2 0 0 1-2 2H8',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6',
  fileText: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6M9 13h6M9 17h6',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.13-1.35l2-1.57-2-3.46-2.36 1a7.3 7.3 0 0 0-2.34-1.35L13.9 2h-4l-.37 2.92A7.3 7.3 0 0 0 7.2 6.27l-2.36-1-2 3.46 2 1.57A7.4 7.4 0 0 0 4.7 12c0 .46.05.91.13 1.35l-2 1.57 2 3.46 2.36-1c.7.57 1.5 1.03 2.34 1.35L9.9 22h4l.37-2.92a7.3 7.3 0 0 0 2.34-1.35l2.36 1 2-3.46-2-1.57c.08-.44.13-.89.13-1.35Z',
  palette: 'M12 22a10 10 0 1 1 0-20c5 0 9 3.5 9 8 0 3-2.5 4-4 4h-2a2 2 0 0 0-1.5 3.3A2 2 0 0 1 12 22ZM7.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm4-3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm5 1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  layout: 'M3 5h18v14H3zM3 9h18M9 9v10',
  layers: 'm12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5',
  grid: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
  compass: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm4-14-2 6-6 2 2-6 6-2Z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  graduation: 'm22 10-10-5L2 10l10 5 10-5ZM6 12v5c0 1 3 3 6 3s6-2 6-3v-5',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  plus: 'M12 5v14M5 12h14',
  trash: 'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6',
  edit: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3',
  check: 'M20 6 9 17l-5-5',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01',
  whatsapp: 'M21 11.5a8.5 8.5 0 0 1-12.7 7.4L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5Z',
  instagram: 'M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm8 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm4.5-8.5h.01',
  facebook: 'M14 9h3V5h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V9a1 1 0 0 1 1-1Z',
  youtube: 'M22 8.5a3 3 0 0 0-2.1-2.1C18 6 12 6 12 6s-6 0-7.9.4A3 3 0 0 0 2 8.5 31 31 0 0 0 2 12a31 31 0 0 0 .1 3.5 3 3 0 0 0 2.1 2.1C6 18 12 18 12 18s6 0 7.9-.4a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.1-3.5ZM10 15V9l5 3-5 3Z',
  sparkles: 'M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5L12 3ZM5 15l.9 2.2L8 18l-2.1.8L5 21l-.9-2.2L2 18l2.1-.8L5 15Z',
  leaf: 'M11 20A7 7 0 0 1 4 13c0-6 7-11 16-11 0 9-5 16-11 16ZM4 21c4-9 10-11 10-11',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z',
  quote: 'M7 7h4v6a4 4 0 0 1-4 4M15 7h4v6a4 4 0 0 1-4 4',
  play: 'm7 4 12 8-12 8V4Z',
}

const size = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
const d = computed(() => P[props.name] ?? P.info)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="d" />
  </svg>
</template>
