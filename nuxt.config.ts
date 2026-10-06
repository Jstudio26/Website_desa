// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    '@nuxt/image',
    '@nuxtjs/supabase',
    '@nuxt/eslint',
  ],

  // Font di-host sendiri (bukan Google Fonts) supaya tidak ada request render-blocking ke pihak ketiga.
  css: [
    '@fontsource-variable/plus-jakarta-sans/wght.css',
    '@fontsource-variable/plus-jakarta-sans/wght-italic.css',
    '~/assets/css/main.css',
  ],

  typescript: {
    strict: true,
    typeCheck: false, // run explicitly via `npm run typecheck`
  },

  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      appName: process.env.APP_NAME || 'Website Desa',
    },
  },

  supabase: {
    // SUPABASE_URL + SUPABASE_KEY (anon key) are read from .env automatically.
    // Row types are passed explicitly at call sites: useSupabaseClient<Database>()
    types: false,
    redirectOptions: {
      login: '/admin/login',
      callback: '/confirm',
      include: ['/admin(/*)?'],
      exclude: ['/admin/login'],
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