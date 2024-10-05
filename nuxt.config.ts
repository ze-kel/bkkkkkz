export default defineNuxtConfig({
  alias: {
    components: './components',
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'shadcn-nuxt',
    '@nuxtjs/color-mode',
  ],
  compatibilityDate: '2024-09-29',

  experimental: {
    // to use plugins/node.client.ts
    clientNodeCompat: true,
  },

  shadcn: {
    prefix: 'Sh',
    componentDir: './components/_shadcn',
  },

  tailwindcss: {
    configPath: 'tailwind.config.ts',
  },

  // Everything below is recomended Tauri config for nuxt
  // https://v2.tauri.app/start/frontend/nuxt/
  devtools: { enabled: true },
  ssr: false,
  devServer: { host: '0.0.0.0' },
  vite: {
    clearScreen: false,
    // https://v2.tauri.app/reference/environment-variables/
    envPrefix: ['VITE_', 'TAURI_'],
    server: {
      strictPort: true,
      hmr: {
        // Use websocket for mobile hot reloading
        protocol: 'ws',
        // Make sure it's available on the network
        host: '0.0.0.0',
        port: 5183,
      },
    },
  },
});