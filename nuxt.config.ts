// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/image',
  ],

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    typeCheck: false, // run explicitly via `npm run typecheck`
  },

  runtimeConfig: {
    // Server-only secrets (override with NUXT_* env vars)
    databaseUrl: process.env.DATABASE_URL || '',
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    jwtAccessTtl: process.env.JWT_ACCESS_TTL || '15m',
    jwtRefreshTtl: process.env.JWT_REFRESH_TTL || '7d',
    cookieDomain: process.env.COOKIE_DOMAIN || '',

    // Storage
    storageDriver: process.env.STORAGE_DRIVER || 'local', // local | s3 | supabase
    storageLocalDir: process.env.STORAGE_LOCAL_DIR || './public/uploads',
    storagePublicBase: process.env.STORAGE_PUBLIC_BASE || '/uploads',

    s3Endpoint: process.env.S3_ENDPOINT || '',
    s3Region: process.env.S3_REGION || 'auto',
    s3Bucket: process.env.S3_BUCKET || '',
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    s3PublicBase: process.env.S3_PUBLIC_BASE || '',
    s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE || 'true',

    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    supabaseBucket: process.env.SUPABASE_BUCKET || 'media',

    // Login rate limiting
    loginRateLimitMax: process.env.LOGIN_RATE_LIMIT_MAX || '5',
    loginRateLimitWindow: process.env.LOGIN_RATE_LIMIT_WINDOW || '900', // seconds

    public: {
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
      appName: process.env.APP_NAME || 'Sistem Informasi Desa',
    },
  },

  nitro: {
    // Swap presets per target: node-server (VPS), vercel, etc. Auto-detected on Vercel.
    preset: process.env.NITRO_PRESET || undefined,
    routeRules: {
      '/api/public/**': { cors: true },
      '/tentang-pengembang': { redirect: '/about-developer' },
      '/admin/**': { ssr: false },
    },
  },

  image: {
    quality: 72,
    format: ['webp'],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
})
