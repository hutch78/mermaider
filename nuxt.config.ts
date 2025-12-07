export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  modules: ['@nuxt/ui'],
  experimental: {
    watcher: 'parcel'
  },
  vite: {
    optimizeDeps: {
      force: false
    },
    vue: {
      script: {
        defineModel: true,
        propsDestructure: true
      }
    }
  },
  css: ['~/assets/css/main.css']
})

