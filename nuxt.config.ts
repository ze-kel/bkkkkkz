export default defineNuxtConfig({
  alias: {
    components: '/<srcDir>/components',
  },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  compatibilityDate: '2024-09-29',

  experimental: {
    // to use plugins/node.client.ts
    clientNodeCompat: true,
  },

  tailwindcss: {
    config: {
      darkMode: 'selector',
      theme: {
        extend: {},
      },
      plugins: [require('@tailwindcss/container-queries')],
    },
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
