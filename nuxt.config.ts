export default defineNuxtConfig({
  devtools: { enabled: true },
  alias: {
    components: '/<srcDir>/components',
  },

  router: {
    options: {
      hashMode: true,
    },
  },

  experimental: {
    appManifest: false,
  },

  modules: ['nuxt-electron', '@nuxtjs/tailwindcss', '@pinia/nuxt'],

  electron: {
    build: [
      {
        // Main-Process entry file of the Electron App.
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.ts',
        onstart(args) {
          args.reload();
        },
      },
    ],
    renderer: {},
  },
  ssr: false,
  compatibilityDate: '2024-09-29',
});
