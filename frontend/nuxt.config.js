
export default {
  /*
  ** Nuxt rendering mode
  ** See https://nuxtjs.org/api/configuration-mode
  */
  mode: 'universal',
  server: {
    /* host: process.env.APP_HOST || '127.0.0.1',
    port: process.env.APP_PORT || 3000 */
    host: 'localhost',
    // host: 'b2b.ku-min.com',
    port: 3000
  },
  /*
  ** Headers of the page
  ** See https://nuxtjs.org/api/configuration-head
  */
  head: {
    title: 'Flitto',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || 'Translation Portal' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      /* {
        rel: 'stylesheet',
        type: 'text/css',
        href: 'https://fonts.googleapis.com/css?family=Nanum+Gothic|Nanum+Myeongjo|Nanum+Gothic+Coding&display=swap&subset=korean'
      }, */
      {
        rel: 'stylesheet',
        type: 'text/css',
        href: 'https://fonts.googleapis.com/css?family=Noto+Sans+KR|Noto+Sans+JP|Noto+Sans+SC&display=swap&subset=korean,japanese,chinese-simplified'
      }
    ]
  },
  /*
  ** Global CSS
  */
  css: [
    '@/assets/styles/index.scss',
    'element-ui/lib/theme-chalk/index.css',
    'element-ui/lib/theme-chalk/display.css'
  ],
  /*
  ** Plugins to load before mounting the App
  ** https://nuxtjs.org/guide/plugins
  */
  plugins: [
    '@/plugins/svg-icon',
    '@/plugins/element-ui',
    '@/plugins/axios',
    '@/plugins/filter',
    { src: '@/plugins/editor', mode: 'client' },
    { src: '@/plugins/youtube-oauth2', mode: 'client' }
  ],
  /*
  ** Auto import components
  ** See https://nuxtjs.org/api/configuration-components
  */
  components: true,
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxtjs/eslint-module',
    '@nuxtjs/dotenv'
  ],
  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    '@nuxtjs/pwa',
    '@nuxtjs/auth',
    '@nuxtjs/onesignal',
    ['nuxt-i18n', {
      locales: [
        {
          name: 'Korean',
          code: 'ko',
          iso: 'ko-KO',
          file: 'ko.js'
        },
        {
          name: 'English',
          code: 'en',
          iso: 'en-US',
          file: 'en.js'
        },
        {
          name: 'Japanese',
          code: 'jp',
          iso: 'jp-JP',
          file: 'jp.js'
        },
        {
          name: 'Chinese(Simplified)',
          code: 'cn',
          iso: 'cn-CN',
          file: 'cn.js'
        }
      ],
      lazy: true,
      langDir: 'lang/',
      // defaultLocale: 'ko',
      strategy: 'no_prefix',
      detectBrowserLanguage: false,
      vuex: {
        // Module namespace
        moduleName: 'i18n',
        // If enabled, current app's locale is synced with nuxt-i18n store module
        syncLocale: true,
        // If enabled, current translation messages are synced with nuxt-i18n store module
        syncMessages: true,
        // Mutation to commit to set route parameters translations
        syncRouteParams: false
      }
    }]
  ],
  /*
  ** Axios module configuration
  ** See https://axios.nuxtjs.org/options
  */
  axios: {
    proxy: true,
    prefix: '/api'
  },
  oneSignal: {
    init: {
      appId: '480b3db2-5153-4c40-9a4c-218e6d820954',
      // appId: '4c34be7d-92bf-4b10-8acd-cc579b73ca44',
      allowLocalhostAsSecureOrigin: true,
      welcomeNotification: {
        disable: true
      }
    }
  },
  proxy: {
    // '/api/': { target: 'https://b2b.ku-min.com:3001', pathRewrite: { '^/api/': '' } }
    '/api/': { target: 'http://localhost:3001', pathRewrite: { '^/api/': '' } }
  },
  auth: {
    strategies: {
      local: {
        endpoints: {
          login: {
            url: '/auth/login',
            method: 'post',
            propertyName: 'data'
          },
          logout: {
            url: '/auth/logout',
            method: 'post'
          },
          user: {
            url: '/auth/me',
            method: 'post',
            propertyName: 'data'
          }
        }
      }
    },
    // tokenRequired: false,
    // tokenType: false,
    redirect: {
      login: '/login',
      callback: '/login',
      logout: '/login',
      home: false
    }
  },
  /*
  ** Build configuration
  ** See https://nuxtjs.org/api/configuration-build/
  */
  build: {
    transpile: ['element-ui', 'vue-google-oauth2'],
    postcss: {
      plugins: {
        'postcss-preset-env': {
          autoprefixer: {
            grid: true
          }
        }
      }
    },
    extend (config, ctx) {
      // set svg-sprite-loader
      // remove old pattern from the older loader
      config.module.rules.forEach((value) => {
        if (String(value.test) === String(/\.(png|jpe?g|gif|svg|webp)$/i)) {
          // reduce to svg and webp, as other images are handled above
          value.test = /\.(png|jpe?g|gif|webp)$/
          // keep the configuration from svg-sprite-loader here unchanged
        }
      })
      config.module.rules.push({
        test: /\.svg$/,
        use: {
          loader: 'svg-sprite-loader',
          options: {
            symbolId: 'icon-[name]'
          }
        }
      }, {
        test: /\.js$/,
        loader: 'babel-loader',
        query: { compact: false }
      })
    },
    babel: { compact: true },
    vendor: ['@toast-ui/vue-editor']
  }
}
