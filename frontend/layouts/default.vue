<template>
  <div :class="classObj" class="app-wrapper">
    <div v-if="device==='mobile' && sidebar.opened" class="drawer-bg" @click="handleClickOutside"></div>
    <div :class="{'fixed-header':fixedHeader}">
      <navbar />
    </div>
    <sidebar class="sidebar-container" />
    <div class="main-container">
      <section class="app-main">
        <transition name="fade-transform" mode="out-in">
          <Nuxt />
        </transition>
      </section>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/layout/Navbar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import ResizeMixin from '@/mixin/ResizeHandler'

export default {
  name: 'Layout',
  components: {
    Navbar,
    Sidebar
  },
  mixins: [ResizeMixin],
  computed: {
    sidebar () {
      return this.$store.state.app.sidebar
    },
    device () {
      return this.$store.state.app.device
    },
    fixedHeader () {
      return this.$store.state.settings.fixedHeader
    },
    classObj () {
      return {
        hideSidebar: !this.sidebar.opened,
        openSidebar: this.sidebar.opened,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === 'mobile'
      }
    }
  },
  mounted () {
    console.log('init')
    const _self = this
    window.OneSignal = window.OneSignal || []
    window.OneSignal.push(() => {
      window.OneSignal.on('subscriptionChange', function (isSubscribed) {
        console.log("The user's subscription state is now:", isSubscribed)
        window.OneSignal.isPushNotificationsEnabled((isEnabled) => {
          if (isEnabled) {
            console.log('Push notifications are enabled!' + _self.$auth.user.player_id)
            window.OneSignal.setExternalUserId(_self.$auth.user.player_id)
          } else {
            console.log('Push notifications are not enabled yet.')
          }
        })
      })

      window.OneSignal.isPushNotificationsEnabled((isEnabled) => {
        if (isEnabled) {
          console.log('Push notifications are enabled!' + _self.$auth.user.player_id)
          window.OneSignal.setExternalUserId(_self.$auth.user.player_id)
        } else {
          setTimeout(() => {
            window.OneSignal.showSlidedownPrompt()
          }, 3000)
        }
      })
    })
  },
  methods: {
    handleClickOutside () {
      this.$store.dispatch('app/closeSideBar', { withoutAnimation: false })
    }
  }
}
</script>

<style lang="scss" scoped>
  @import "@/assets/styles/mixin.scss";
  @import "@/assets/styles/variables.scss";

  .app-wrapper {
    @include clearfix;
    position: relative;
    height: 100%;
    width: 100%;
    &.mobile.openSidebar{
      position: fixed;
      top: 0;
    }
  }
  .drawer-bg {
    background: #000;
    opacity: 0.3;
    width: 100%;
    top: 0;
    height: 100%;
    position: absolute;
    z-index: 999;
  }

  .fixed-header {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 9;
    // width: calc(100% - #{$sideBarWidth});
    width: 100%;
    transition: width 0.28s;
  }

  /* .hideSidebar .fixed-header {
    width: calc(100% - 54px)
  } */

  .mobile .fixed-header {
    width: 100%;
  }

  .app-main {
    /*50 = navbar  */
    min-height: calc(100vh - #{$navbarHeight});
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  .fixed-header+.app-main {
    padding-top: 50px;
  }

</style>

<style lang="scss">
// fix css style bug in open el-dialog
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 15px;
  }
}
</style>
