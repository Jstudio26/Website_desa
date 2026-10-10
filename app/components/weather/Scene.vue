<script setup lang="ts">
import type { WeatherVisual } from '~/utils/weatherVisual'

/**
 * Ilustrasi cuaca inline SVG, disusun dari lapisan sesuai `visual.layers`
 * (lihat utils/weatherVisual.ts). Tanpa aset eksternal, jadi tidak ada yang bisa gagal dimuat.
 * Animasi hanya aktif bila pengunjung tidak memilih prefers-reduced-motion.
 */
const props = defineProps<{ visual: WeatherVisual }>()

const uid = useId()
const L = computed(() => props.visual.layers)
const c = computed(() => props.visual.colors)

const sun = computed(() => (L.value.sun === 'partial' ? { x: 140, y: 58, r: 26 } : { x: 160, y: 66, r: 30 }))
const moon = computed(() => (L.value.moon === 'partial' ? { x: 142, y: 56, r: 22 } : { x: 160, y: 64, r: 26 }))
const rays = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6)

const STARS = [[28, 30, 1.3], [62, 16, 1], [98, 42, 1.4], [204, 22, 1.1], [224, 74, 1], [118, 14, 0.9], [196, 120, 0.9], [36, 94, 1], [72, 70, 0.8]] as const

type CloudDef = { x: number, y: number, s: number, front: boolean }
const CLOUDS: Record<'few' | 'some' | 'many', CloudDef[]> = {
  few: [
    { x: 40, y: 34, s: 0.6, front: false },
    { x: 96, y: 70, s: 1, front: true },
  ],
  some: [
    { x: 40, y: 48, s: 0.9, front: false },
    { x: 104, y: 70, s: 1.1, front: true },
  ],
  many: [
    { x: 12, y: 38, s: 0.95, front: false },
    { x: 118, y: 26, s: 1.05, front: false },
    { x: 46, y: 66, s: 1.15, front: true },
    { x: 132, y: 76, s: 0.95, front: true },
  ],
}
const clouds = computed(() => (L.value.clouds ? CLOUDS[L.value.clouds] : []))

const drops = computed(() => {
  const n = L.value.rain === 'heavy' ? 15 : 8
  const len = L.value.rain === 'heavy' ? 15 : 9
  return Array.from({ length: n }, (_, i) => {
    const x = 74 + i * (132 / n) + ((i * 7) % 5)
    const y = 134 + ((i * 11) % 3) * 9
    return { x, y, len, delay: `${((i * 0.37) % 1.2).toFixed(2)}s` }
  })
})

const FOG = [[18, 96, 168], [52, 114, 176], [10, 132, 160], [64, 150, 150]] as const
</script>

<template>
  <svg
    viewBox="0 0 240 180"
    class="wx-scene block h-full w-full overflow-visible"
    :data-scene="visual.key"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <radialGradient :id="`${uid}-glow`">
        <stop offset="0%" stop-color="#FFE08A" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#FFE08A" stop-opacity="0" />
      </radialGradient>
      <radialGradient :id="`${uid}-sun`" cx="40%" cy="38%">
        <stop offset="0%" stop-color="#FFE27A" />
        <stop offset="100%" stop-color="#FFB524" />
      </radialGradient>
      <radialGradient :id="`${uid}-moonglow`">
        <stop offset="0%" stop-color="#F4EBC8" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#F4EBC8" stop-opacity="0" />
      </radialGradient>
      <mask :id="`${uid}-crescent`">
        <rect width="240" height="180" fill="white" />
        <circle :cx="moon.x + moon.r * 0.45" :cy="moon.y - moon.r * 0.35" :r="moon.r * 0.85" fill="black" />
      </mask>
    </defs>

    <!-- Netral: kondisi tidak dikenali, tanpa makna cuaca -->
    <g v-if="L.neutral" :fill="c.cloudFront">
      <circle cx="150" cy="84" r="54" opacity="0.45" />
      <circle cx="150" cy="84" r="32" opacity="0.6" />
    </g>

    <!-- Bintang -->
    <g v-if="L.stars" fill="#FFFFFF">
      <circle
        v-for="(s, i) in STARS"
        :key="i"
        class="wx-star"
        :cx="s[0]"
        :cy="s[1]"
        :r="s[2]"
        :style="{ animationDelay: `${(i * 0.7) % 4}s` }"
      />
    </g>

    <!-- Matahari -->
    <g v-if="L.sun">
      <circle :cx="sun.x" :cy="sun.y" :r="sun.r * 2.4" :fill="`url(#${uid}-glow)`" />
      <g class="wx-rays" :style="{ transformOrigin: `${sun.x}px ${sun.y}px` }" stroke="#FFC23D" stroke-width="3" stroke-linecap="round" opacity="0.85">
        <line
          v-for="(a, i) in rays"
          :key="i"
          :x1="sun.x + Math.cos(a) * (sun.r + 8)"
          :y1="sun.y + Math.sin(a) * (sun.r + 8)"
          :x2="sun.x + Math.cos(a) * (sun.r + 15)"
          :y2="sun.y + Math.sin(a) * (sun.r + 15)"
        />
      </g>
      <circle :cx="sun.x" :cy="sun.y" :r="sun.r" :fill="`url(#${uid}-sun)`" />
    </g>

    <!-- Bulan sabit -->
    <g v-if="L.moon">
      <circle :cx="moon.x" :cy="moon.y" :r="moon.r * 2.2" :fill="`url(#${uid}-moonglow)`" />
      <circle :cx="moon.x" :cy="moon.y" :r="moon.r" fill="#F4EBC8" :mask="`url(#${uid}-crescent)`" />
    </g>

    <!-- Awan: lingkaran + persegi dengan warna sama, opasitas di level grup supaya tumpukan tidak menggelap -->
    <g
      v-for="(cl, i) in clouds"
      :key="i"
      :class="cl.front ? 'wx-cloud-front' : 'wx-cloud-back'"
    >
      <g :transform="`translate(${cl.x} ${cl.y}) scale(${cl.s})`" :fill="cl.front ? c.cloudFront : c.cloudBack">
        <circle cx="36" cy="40" r="20" />
        <circle cx="62" cy="28" r="28" />
        <circle cx="92" cy="40" r="20" />
        <rect x="36" y="40" width="56" height="20" />
      </g>
    </g>

    <!-- Kilat (di belakang hujan, di bawah awan depan) -->
    <polygon
      v-if="L.lightning"
      class="wx-bolt"
      points="146,128 134,152 145,152 137,176 162,142 150,142 158,128"
      fill="#FFD84D"
    />

    <!-- Hujan -->
    <g v-if="L.rain" :stroke="c.rain" :stroke-width="L.rain === 'heavy' ? 2.4 : 2" stroke-linecap="round">
      <line
        v-for="(d, i) in drops"
        :key="i"
        class="wx-drop"
        :class="L.rain === 'heavy' ? 'wx-drop-heavy' : ''"
        :x1="d.x"
        :y1="d.y"
        :x2="d.x - 3"
        :y2="d.y + d.len"
        :style="{ animationDelay: d.delay }"
      />
    </g>

    <!-- Kabut -->
    <g v-if="L.fog" :fill="c.fog">
      <rect
        v-for="(f, i) in FOG"
        :key="i"
        class="wx-fog"
        :x="f[0]"
        :y="f[1]"
        :width="f[2]"
        height="10"
        rx="5"
        :style="{ animationDelay: `${i * -3}s` }"
      />
    </g>
  </svg>
</template>

<style scoped>
.wx-bolt { opacity: 0.9; }

@media (prefers-reduced-motion: no-preference) {
  .wx-rays { animation: wx-spin 80s linear infinite; }
  .wx-cloud-front { animation: wx-drift 14s ease-in-out infinite alternate; }
  .wx-cloud-back { animation: wx-drift 20s ease-in-out infinite alternate-reverse; }
  .wx-drop { animation: wx-fall 1.4s linear infinite; }
  .wx-drop-heavy { animation-duration: 0.9s; }
  .wx-star { animation: wx-twinkle 4s ease-in-out infinite; }
  .wx-fog { animation: wx-fog 12s ease-in-out infinite alternate; }
  .wx-bolt { opacity: 0; animation: wx-flash 7s ease-out infinite 1.5s; }
}

@keyframes wx-spin { to { transform: rotate(360deg); } }
@keyframes wx-drift { from { transform: translateX(-4px); } to { transform: translateX(6px); } }
@keyframes wx-fall {
  0% { transform: translate(0, -10px); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translate(-5px, 22px); opacity: 0; }
}
@keyframes wx-twinkle { 0%, 100% { opacity: 0.85; } 50% { opacity: 0.35; } }
@keyframes wx-fog { from { transform: translateX(-8px); } to { transform: translateX(10px); } }
@keyframes wx-flash {
  0%, 86%, 100% { opacity: 0; }
  88% { opacity: 1; }
  90% { opacity: 0.25; }
  92% { opacity: 0.95; }
  96% { opacity: 0; }
}
</style>
