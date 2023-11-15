<template>
  <div>
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <hamburger
        :is-active="sidebar.opened"
        class="hamburger-container"
        @toggleClick="toggleSideBar"
      />
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="variables.blue50"
        :text-color="variables.menuText"
        :unique-opened="false"
        :active-text-color="variables.menuActiveText"
        :collapse-transition="false"
        :class="$i18n.locale"
        mode="vertical"
      >
        <!--Notification-->
        <nuxt-link to="/notification">
          <el-menu-item index="/notification" class="submenu-title-noDropdown">
            <svg-icon icon-class="wechat" />
            <span slot="title" class="wrap-title">{{
              $t('sidebar.notification')
            }}</span>
          </el-menu-item>
        </nuxt-link>
        <!--Profile-->
        <nuxt-link to="/profile">
          <el-menu-item index="/profile" class="submenu-title-noDropdown">
            <svg-icon icon-class="profile" />
            <span slot="title">{{ $t('sidebar.my_profile') }}</span>
          </el-menu-item>
        </nuxt-link>
        <!--Caption-->
        <el-submenu ref="subMenu" index="/caption" popper-append-to-body>
          <template slot="title">
            <svg-icon icon-class="document" />
            <span class="parent-menu-title">{{ $t('sidebar.caption') }}</span>
          </template>
          <nuxt-link v-if="$auth.user.user_type == 1" to="/caption/list/admin">
            <el-menu-item index="/caption/list/admin">
              <span>{{ $t('caption.list') }}</span>
            </el-menu-item>
          </nuxt-link>
          <nuxt-link
            v-if="$auth.user.user_type == 2 || $auth.user.user_type == 3 || $auth.user.user_type == 7"
            to="/caption/list/company"
          >
            <el-menu-item index="/caption/list/company">
              <span>{{ $t('caption.list') }}</span>
            </el-menu-item>
          </nuxt-link>
          <nuxt-link v-if="$auth.user.user_type >= 4 && $auth.user.user_type <= 6" to="/caption/list/worker">
            <el-menu-item index="/caption/list/worker">
              <span>{{ $t('caption.list') }}</span>
            </el-menu-item>
          </nuxt-link>
          <nuxt-link v-if="$auth.user.user_type <= 3 || $auth.user.user_type === 7" to="/caption/add">
            <el-menu-item index="/caption/add">
              <span class="wrap-title">{{ $t('caption.add') }}</span>
            </el-menu-item>
          </nuxt-link>
        </el-submenu>
        <!--Admin-->
        <el-submenu
          v-if="$auth.user.user_type == 1"
          ref="subMenu"
          index="/admin"
          popper-append-to-body
        >
          <template slot="title">
            <svg-icon icon-class="peoples" />
            <span class="parent-menu-title">{{ $t('sidebar.admin') }}</span>
          </template>
          <nuxt-link to="/admin">
            <el-menu-item index="/admin">
              <span>{{ $t('admin.list') }}</span>
            </el-menu-item>
          </nuxt-link>
          <nuxt-link to="/admin/add">
            <el-menu-item index="/admin/add">
              <span class="wrap-title">{{ $t('admin.add') }}</span>
            </el-menu-item>
          </nuxt-link>
        </el-submenu>
        <!--Company-->
        <el-submenu
          v-if="$auth.user.user_type == 1"
          ref="subMenu"
          index="/company"
          popper-append-to-body
        >
          <template slot="title">
            <svg-icon icon-class="company-manage" />
            <span class="parent-menu-title">{{
              $t('sidebar.company')
            }}</span>
          </template>
          <nuxt-link to="/company">
            <el-menu-item index="/company">
              <span>{{
                $t('company.list')
              }}</span>
            </el-menu-item>
          </nuxt-link>
          <nuxt-link to="/company/add">
            <el-menu-item index="/company/add">
              <span>{{
                $t('company.add')
              }}</span>
            </el-menu-item>
          </nuxt-link>
        </el-submenu>
        <!--Manager-->
        <el-submenu
          v-if="$auth.user.user_type == 1 || $auth.user.user_type == 2"
          ref="subMenu"
          index="/manager"
          popper-append-to-body
        >
          <template slot="title">
            <svg-icon icon-class="company-manage" />
            <span class="parent-menu-title">{{
              $t('sidebar.manager')
            }}</span>
          </template>
          <nuxt-link to="/manager">
            <el-menu-item index="/manager">
              <span>{{ $t('manager.list') }}</span>
            </el-menu-item>
          </nuxt-link>
          <nuxt-link to="/manager/add">
            <el-menu-item index="/manager/add">
              <span>{{
                $t('manager.add')
              }}</span>
            </el-menu-item>
          </nuxt-link>
        </el-submenu>
        <!--Requester-->
        <el-submenu
          v-if="$auth.user.user_type == 1 || $auth.user.user_type == 2 || $auth.user.user_type == 7"
          ref="subMenu"
          index="/requester"
          popper-append-to-body
        >
          <template slot="title">
            <svg-icon icon-class="requester-manage" />
            <span class="parent-menu-title">{{ $t('sidebar.requester') }}</span>
          </template>
          <nuxt-link to="/requester">
            <el-menu-item index="/requester">
              <span>{{ $t('requester.list') }}</span>
            </el-menu-item>
          </nuxt-link>
          <nuxt-link to="/requester/add">
            <el-menu-item index="/requester/add">
              <span>{{ $t('requester.add') }}</span>
            </el-menu-item>
          </nuxt-link>
        </el-submenu>
        <!--Worker-->
        <el-submenu
          v-if="$auth.user.user_type == 1"
          ref="subMenu"
          index="/worker"
          popper-append-to-body
        >
          <template slot="title">
            <svg-icon icon-class="worker-manage" />
            <span>{{ $t('sidebar.worker') }}</span>
          </template>
          <nuxt-link to="/worker">
            <el-menu-item index="/worker">
              <span>{{ $t('worker.list') }}</span>
            </el-menu-item>
          </nuxt-link>
          <nuxt-link to="/worker/add">
            <el-menu-item index="/worker/add">
              <span>{{ $t('worker.add') }}</span>
            </el-menu-item>
          </nuxt-link>
        </el-submenu>
        <!--Settle-->
        <nuxt-link v-if="$auth.user.user_type == 1" to="/settle/admin">
          <el-menu-item index="/settle/admin" class="submenu-title-noDropdown">
            <svg-icon icon-class="wallet" />
            <span slot="title" class="wrap-title">{{
              $t('sidebar.settle')
            }}</span>
          </el-menu-item>
        </nuxt-link>
        <nuxt-link v-else to="/settle">
          <el-menu-item index="/settle" class="submenu-title-noDropdown">
            <svg-icon icon-class="wallet" />
            <span slot="title" class="wrap-title">{{
              $t('sidebar.settle')
            }}</span>
          </el-menu-item>
        </nuxt-link>
        <!--Inquiry-->
        <el-submenu ref="subMenu" index="/inquiry" popper-append-to-body>
          <template slot="title">
            <svg-icon icon-class="carousel" />
            <span>{{ $t('sidebar.inquiry') }}</span>
          </template>
          <nuxt-link to="/inquiry">
            <el-menu-item index="/inquiry">
              <span>{{ $t('inquiry.list') }}</span>
            </el-menu-item>
          </nuxt-link>
          <nuxt-link to="/inquiry/add">
            <el-menu-item index="/inquiry/add">
              <span>{{ $t('inquiry.add') }}</span>
            </el-menu-item>
          </nuxt-link>
        </el-submenu>
        <el-menu-item
          index="logout"
          class="submenu-title-noDropdown logout-menu-item"
          @click="logOut"
        >
          <svg-icon icon-class="logout" />
          <span slot="title">{{ $t('sidebar.logout') }}</span>
        </el-menu-item>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script>
// import SidebarItem from './SidebarItem.vue'
import variables from '@/assets/styles/variables.scss'
import Hamburger from '@/components/Hamburger.vue'

export default {
  components: { Hamburger },
  computed: {
    sidebar () {
      return this.$store.state.app.sidebar
    },
    activeMenu () {
      const route = this.$route
      const { meta, path } = route
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      return path
    },
    variables () {
      return variables
    },
    isCollapse () {
      return !this.sidebar.opened
    }
  },
  methods: {
    hasPermission (menuItem) {
      if (menuItem.roles === undefined) {
        return true
      } else if (menuItem.roles.includes(this.$auth.user.role)) {
        return true
      } else {
        return false
      }
    },
    toggleSideBar () {
      this.$store.dispatch('app/toggleSideBar')
    },
    async logOut () {
      await this.$auth.logout()
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

::v-deep {
  .el-menu.jp {
    .el-menu-item {
      span.jp-multiline-menu-title {
        display: inline-block;
        line-height: 1.5em;
        height: 3em;
        overflow: hidden;
        white-space: normal;
        max-width: 110px;
      }
    }
    .el-submenu {
      span.jp-multiline-menu-title {
        display: inline-block;
        line-height: 1.5em;
        height: 3em;
        overflow: hidden;
        white-space: normal;
        max-width: 110px;
      }
    }
  }

  .el-menu.en {
    .el-menu-item {
      span.wrap-title {
        display: inline-block;
        line-height: 1.5em;
        height: 3em;
        overflow: hidden;
        white-space: normal;
        max-width: 110px;
        margin-bottom: 10px;
      }
    }
    .el-submenu {
      span.parent-menu-title {
        display: inline-block;
        line-height: 1.5em;
        height: 3em;
        overflow: hidden;
        white-space: normal;
        max-width: 110px;
        margin-bottom: 10px;
      }
    }
  }
  .el-menu {
    .el-menu-item {
      font-weight: bold;
      font-size: $sideBarFontSize;
    }

    .el-submenu {
      & > .el-submenu__title {
        font-weight: bold;
        font-size: $sideBarFontSize;
        i {
          color: white;
          font-size: 14px;
        }
      }
    }

    .el-menu-item.is-active {
      background-color: $subMenuActive !important;
      border-left: 3px solid #ffffff;
    }
  }
  .logout-menu-item {
    margin-top: 150px;
    margin-bottom: 20px;
  }
}
</style>
