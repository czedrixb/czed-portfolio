// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en', 'data-theme': 'dark' },
      meta: [
        { name: 'theme-color', content: '#07151b' },
        { name: 'color-scheme', content: 'light dark' },
      ],
      script: [{
        innerHTML: `(function(){try{var saved=localStorage.getItem('portfolio-theme');var theme=saved||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){}})()`,
      }],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: [],

  aos: {
    duration: 700,
    easing: 'ease-out-cubic',
    once: true,
    offset: 80,
    disableMutationObserver: false,
  },
})
