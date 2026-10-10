import type { WeatherCondition } from '#shared/weather'

/**
 * Pemetaan kondisi cuaca (hasil klasifikasi BMKG di server) → tampilan.
 * Satu-satunya tempat yang menentukan warna atmosfer, lapisan ilustrasi, dan ikon cuaca;
 * komponen di components/weather/ hanya membaca hasilnya.
 *
 * Warna di sini sengaja di luar palet merah situs: atmosfer kartu cuaca mengikuti kondisi
 * aktual. Ditulis sebagai nilai CSS (bukan kelas Tailwind) karena folder utils tidak dipindai Tailwind.
 */

export type WeatherScene = 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'heavy-rain' | 'thunderstorm' | 'fog' | 'unknown'

export interface SceneLayers {
  sun?: 'full' | 'partial'
  moon?: 'full' | 'partial'
  stars?: boolean
  clouds?: 'few' | 'some' | 'many'
  rain?: 'light' | 'heavy'
  lightning?: boolean
  fog?: boolean
  /** Lingkaran netral tanpa makna cuaca, untuk kondisi yang tidak dikenali. */
  neutral?: boolean
}

export interface WeatherVisual {
  /** mis. 'sunny', 'night-rainy' — dipakai sebagai data-attribute & kunci pengujian. */
  key: string
  scene: WeatherScene
  tone: 'light' | 'dark'
  layers: SceneLayers
  colors: {
    background: string
    ink: string
    muted: string
    chipBg: string
    chipBorder: string
    cloudFront: string
    cloudBack: string
    rain: string
    fog: string
  }
  /** Nama ikon di utils/icons.ts + warnanya di atas permukaan putih (kontras ≥ 3:1). */
  icon: string
  iconColor: string
}

const SCENE_OF: Record<WeatherCondition, WeatherScene> = {
  'clear': 'sunny',
  'partly-cloudy': 'partly-cloudy',
  'cloudy': 'cloudy',
  'overcast': 'cloudy',
  'haze': 'fog',
  'fog': 'fog',
  'light-rain': 'rainy',
  'moderate-rain': 'heavy-rain',
  'heavy-rain': 'heavy-rain',
  'thunderstorm': 'thunderstorm',
  'unknown': 'unknown',
}

export const CONDITION_LABEL: Record<WeatherCondition, string> = {
  'clear': 'Cerah',
  'partly-cloudy': 'Cerah Berawan',
  'cloudy': 'Berawan',
  'overcast': 'Berawan Tebal',
  'haze': 'Udara Kabur',
  'fog': 'Kabut',
  'light-rain': 'Hujan Ringan',
  'moderate-rain': 'Hujan Sedang',
  'heavy-rain': 'Hujan Lebat',
  'thunderstorm': 'Hujan Petir',
  'unknown': 'Kondisi tidak dikenali',
}

const INK_LIGHT = { ink: '#0E2033', muted: 'rgba(14, 32, 51, 0.76)', chipBg: 'rgba(255, 255, 255, 0.55)', chipBorder: 'rgba(255, 255, 255, 0.85)', rain: '#3E78AE', fog: 'rgba(255, 255, 255, 0.72)' }
const INK_DARK = { ink: '#FFFFFF', muted: 'rgba(255, 255, 255, 0.82)', chipBg: 'rgba(255, 255, 255, 0.09)', chipBorder: 'rgba(255, 255, 255, 0.16)', rain: '#A9CBEA', fog: 'rgba(205, 214, 226, 0.22)' }

type Def = Pick<WeatherVisual, 'tone' | 'layers'> & { background: string, cloudFront: string, cloudBack: string }

const DAY: Record<WeatherScene, Def> = {
  'sunny': {
    tone: 'light',
    layers: { sun: 'full' },
    background: 'linear-gradient(160deg, #BFE2FB 0%, #E4F2FD 52%, #FFF0D6 100%)',
    cloudFront: '#FFFFFF', cloudBack: '#E6EEF5',
  },
  'partly-cloudy': {
    tone: 'light',
    layers: { sun: 'partial', clouds: 'few' },
    background: 'linear-gradient(160deg, #C9DFF2 0%, #E8F1F8 55%, #FBF0E0 100%)',
    cloudFront: '#FFFFFF', cloudBack: '#E3EBF3',
  },
  'cloudy': {
    tone: 'light',
    layers: { clouds: 'many' },
    background: 'linear-gradient(165deg, #C3CFDA 0%, #DDE4EA 60%, #E9EDF0 100%)',
    cloudFront: '#F4F6F8', cloudBack: '#B9C5D1',
  },
  'rainy': {
    tone: 'light',
    layers: { clouds: 'some', rain: 'light' },
    background: 'linear-gradient(165deg, #A9BCCC 0%, #C7D3DE 60%, #D9E1E8 100%)',
    cloudFront: '#E6EBF0', cloudBack: '#A3B2C1',
  },
  'heavy-rain': {
    tone: 'dark',
    layers: { clouds: 'many', rain: 'heavy' },
    background: 'linear-gradient(165deg, #3D5062 0%, #50637A 100%)',
    cloudFront: '#74849A', cloudBack: '#5A6A80',
  },
  'thunderstorm': {
    tone: 'dark',
    layers: { clouds: 'many', rain: 'light', lightning: true },
    background: 'linear-gradient(165deg, #232838 0%, #3B3F58 100%)',
    cloudFront: '#5C6180', cloudBack: '#454A66',
  },
  'fog': {
    tone: 'light',
    layers: { clouds: 'few', fog: true },
    background: 'linear-gradient(170deg, #D2D9DF 0%, #E6EAED 60%, #F1F3F4 100%)',
    cloudFront: '#F2F4F6', cloudBack: '#CBD3DA',
  },
  'unknown': {
    tone: 'light',
    layers: { neutral: true },
    background: 'linear-gradient(165deg, #E7EAEE 0%, #F5F6F8 100%)',
    cloudFront: '#FFFFFF', cloudBack: '#E2E6EA',
  },
}

/** Malam: tanpa matahari; bulan/bintang hanya bila langit cukup terbuka. */
const NIGHT: Partial<Record<WeatherScene, Def>> = {
  'sunny': {
    tone: 'dark',
    layers: { moon: 'full', stars: true },
    background: 'linear-gradient(165deg, #0B1630 0%, #1A2B4D 70%, #26365A 100%)',
    cloudFront: '#3A4A63', cloudBack: '#2B3950',
  },
  'partly-cloudy': {
    tone: 'dark',
    layers: { moon: 'partial', stars: true, clouds: 'few' },
    background: 'linear-gradient(165deg, #0E1A33 0%, #1E2E4E 70%, #2A3A5A 100%)',
    cloudFront: '#46566F', cloudBack: '#34435C',
  },
  'cloudy': {
    tone: 'dark',
    layers: { clouds: 'many' },
    background: 'linear-gradient(165deg, #161E2B 0%, #263243 100%)',
    cloudFront: '#46546A', cloudBack: '#354255',
  },
  'rainy': {
    tone: 'dark',
    layers: { clouds: 'some', rain: 'light' },
    background: 'linear-gradient(165deg, #16202D 0%, #2A3849 100%)',
    cloudFront: '#4A586D', cloudBack: '#37455A',
  },
  'heavy-rain': {
    tone: 'dark',
    layers: { clouds: 'many', rain: 'heavy' },
    background: 'linear-gradient(165deg, #121A25 0%, #243142 100%)',
    cloudFront: '#46546A', cloudBack: '#333F52',
  },
  'thunderstorm': {
    tone: 'dark',
    layers: { clouds: 'many', rain: 'light', lightning: true },
    background: 'linear-gradient(165deg, #151826 0%, #2C2E45 100%)',
    cloudFront: '#4A4F6A', cloudBack: '#363A52',
  },
  'fog': {
    tone: 'dark',
    layers: { fog: true, clouds: 'few' },
    background: 'linear-gradient(165deg, #1F262F 0%, #343D48 100%)',
    cloudFront: '#4A5462', cloudBack: '#3A434F',
  },
  'unknown': {
    tone: 'dark',
    layers: { neutral: true },
    background: 'linear-gradient(165deg, #1C222B 0%, #2E3640 100%)',
    cloudFront: '#4A5462', cloudBack: '#3A434F',
  },
}

const ICON: Record<WeatherCondition, [day: string, night: string, color: string]> = {
  'clear': ['sun', 'moon', '#C27803'],
  'partly-cloudy': ['cloudSun', 'cloudMoon', '#B5740A'],
  'cloudy': ['cloud', 'cloud', '#64748B'],
  'overcast': ['cloud', 'cloud', '#52606F'],
  'haze': ['cloudFog', 'cloudFog', '#6E7A87'],
  'fog': ['cloudFog', 'cloudFog', '#6E7A87'],
  'light-rain': ['cloudDrizzle', 'cloudDrizzle', '#3B7BB8'],
  'moderate-rain': ['cloudRain', 'cloudRain', '#2C5F93'],
  'heavy-rain': ['cloudRain', 'cloudRain', '#234E7C'],
  'thunderstorm': ['cloudLightning', 'cloudLightning', '#5B4A9A'],
  'unknown': ['thermometer', 'thermometer', '#71717A'],
}

export function getWeatherVisual(condition: WeatherCondition, isNight: boolean): WeatherVisual {
  const scene = SCENE_OF[condition] ?? 'unknown'
  const def = (isNight ? NIGHT[scene] : undefined) ?? DAY[scene]
  const ink = def.tone === 'dark' ? INK_DARK : INK_LIGHT
  const [dayIcon, nightIcon, iconColor] = ICON[condition] ?? ICON.unknown
  // Berawan tebal: awan lebih padat & gelap dari berawan biasa.
  const cloudBack = condition === 'overcast' && !isNight ? '#A7B4C1' : def.cloudBack
  return {
    key: isNight && scene !== 'unknown' ? `night-${scene === 'sunny' ? 'clear' : scene}` : scene,
    scene,
    tone: def.tone,
    layers: def.layers,
    colors: { ...ink, background: def.background, cloudFront: def.cloudFront, cloudBack },
    icon: isNight ? nightIcon : dayIcon,
    iconColor: isNight && condition === 'clear' ? '#4C5E8C' : isNight && condition === 'partly-cloudy' ? '#52648F' : iconColor,
  }
}
