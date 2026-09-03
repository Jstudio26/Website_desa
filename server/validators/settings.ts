import { z } from '../utils/validation'
import { FEATURE_FLAGS } from '../../shared/types/config'

const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Warna harus format hex, mis. #1155aa')

export const villageConfigSchema = z.object({
  villageName: z.string().min(1).max(200),
  district: z.string().max(200).default(''),
  regency: z.string().max(200).default(''),
  province: z.string().max(200).default(''),
  postalCode: z.string().max(12).default(''),
  logo: z.string().max(500).default(''),
  logoDark: z.string().max(500).default(''),
  favicon: z.string().max(500).default(''),
  tagline: z.string().max(300).default(''),
  shortDescription: z.string().max(600).default(''),
  areaKm2: z.number().nonnegative().nullable().default(null),
  population: z.number().int().nonnegative().nullable().default(null),
  households: z.number().int().nonnegative().nullable().default(null),
  hamlets: z.number().int().nonnegative().nullable().default(null),
  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),
  contact: z.object({
    address: z.string().max(400).default(''),
    phone: z.string().max(40).default(''),
    email: z.string().max(160).default(''),
    whatsapp: z.string().max(40).default(''),
    mapEmbedUrl: z.string().max(1000).default(''),
    emergencyContacts: z
      .array(z.object({ label: z.string().max(80), number: z.string().max(40) }))
      .max(12)
      .default([]),
  }),
  socialMedia: z.object({
    instagram: z.string().max(200).default(''),
    facebook: z.string().max(200).default(''),
    youtube: z.string().max(200).default(''),
    tiktok: z.string().max(200).default(''),
    twitter: z.string().max(200).default(''),
  }),
  homepageLayout: z.string().max(40).default('immersive'),
  heroStyle: z.string().max(40).default('fullscreen-image'),
})

export const themeConfigSchema = z.object({
  colors: z.object({
    primary: hex, secondary: hex, accent: hex, surface: hex, surfaceMuted: hex,
    ink: hex, inkMuted: hex, line: hex,
    darkSurface: hex, darkSurfaceMuted: hex, darkInk: hex, darkInkMuted: hex, darkLine: hex,
  }),
  typography: z.object({
    fontHeading: z.string().min(1).max(200),
    fontBody: z.string().min(1).max(200),
    fontScale: z.number().min(0.8).max(1.25),
    googleFonts: z.array(z.string().max(160)).max(6).default([]),
  }),
  layout: z.object({
    containerWidth: z.string().max(20),
    radius: z.string().max(20),
    buttonStyle: z.enum(['solid', 'outline', 'soft', 'ghost']),
    cardStyle: z.enum(['raised', 'bordered', 'flat']),
  }),
  mode: z.enum(['light', 'dark', 'system']),
  identity: z.object({
    pattern: z.string().max(300).default('none'),
    patternOpacity: z.number().min(0).max(1).default(0.06),
    ornamentImage: z.string().max(500).default(''),
    heroAccentImage: z.string().max(500).default(''),
  }),
})

export const featureFlagsSchema = z.object(
  Object.fromEntries(FEATURE_FLAGS.map((f) => [f, z.boolean()])) as Record<
    (typeof FEATURE_FLAGS)[number],
    z.ZodBoolean
  >,
)

export const footerConfigSchema = z.object({
  description: z.string().max(600).default(''),
  showCredit: z.boolean().default(true),
  creditText: z.string().max(600).default(''),
  programName: z.string().max(200).default(''),
  showDeveloperLink: z.boolean().default(true),
  developerLinkLabel: z.string().max(120).default('Tentang Tim Pengembang'),
  developerLinkUrl: z.string().max(300).default('/about-developer'),
  bottomText: z.string().max(300).default(''),
  columns: z
    .array(
      z.object({
        title: z.string().max(120),
        links: z.array(z.object({ label: z.string().max(120), url: z.string().max(300) })).max(12),
      }),
    )
    .max(6)
    .default([]),
})
