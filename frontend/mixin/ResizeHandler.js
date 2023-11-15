const WIDTH = 768 // refer to Bootstrap's responsive design

export default {
  watch: {
    $route (route) {
      if (this.$store.state.app.device === 'mobile' && this.$store.state.app.sidebar.opened) {
        this.$store.dispatch('app/closeSideBar', { withoutAnimation: false })
        // this.$store.dispatch('app/toggleSideBar')
      }
    }
  },
  beforeDestroy () {
    if (process.browser) {
      window.removeEventListener('resize', this.$_resizeHandler)
    }
  },
  data () {
    return {
      body: null
    }
  },
  mounted () {
    this.body = document.body
    window.addEventListener('resize', this.$_resizeHandler)
    const isMobile = this.$_isMobile()
    if (isMobile) {
      // this.$store.dispatch('app/toggleDevice', 'mobile')
      this.$store.dispatch('app/closeSideBar', { withoutAnimation: false })
      // this.$store.dispatch('app/toggleSideBar')
    }
  },
  methods: {
    // use $_ for mixins properties
    // https://vuejs.org/v2/style-guide/index.html#Private-property-names-essential
    $_isMobile () {
      const rect = this.body.getBoundingClientRect()
      return rect.width - 1 < WIDTH
    },
    $_resizeHandler () {
      if (!document.hidden) {
        const isMobile = this.$_isMobile()
        // this.$store.dispatch('app/toggleDevice', isMobile ? 'mobile' : 'desktop')

        if (isMobile) {
          // this.$store.dispatch('app/closeSideBar', { withoutAnimation: true })
          this.$store.dispatch('app/closeSideBar', { withoutAnimation: false })
        }
      }
    }
  }
}
