<template>
  <div class="navbar">
    <!-- <breadcrumb class="breadcrumb-container" /> -->
    <nuxt-link :to="getDashboardLink" class="dashboard-logo">
      <img v-if="$auth.user.user_type == 2 || $auth.user.user_type == 3 || $auth.user.user_type == 7" :src="getCompanyLogo" class="company-logo" />
      <img v-else src="/imgs/dashboard-logo.png" class="flitto-logo" />
    </nuxt-link>
    <div class="right-menu">
      <div class="user-wrapper">
        <nuxt-link to="/notification">
          <el-badge :value="getNoticeCount" class="notifications" :class="noticeCount >= 1 ? 'show-count': 'hide-count'">
            <img src="/imgs/bell.png" />
          </el-badge>
        </nuxt-link>
        <nuxt-link to="/profile">
          <img :src="getUserAvatar + '?imageView2/1/w/80/h/80'" class="user-avatar" />
        </nuxt-link>
        <div class="user-info">
          <div class="user-name" :title="getUserName">
            {{ getUserName }}
          </div>
          <div class="user-name">
            <span v-if="$auth.user.user_type == 1" class="account-type" :title="$t('user_type.admin')">{{ $t('user_type.admin') }}</span>
            <span v-if="$auth.user.user_type == 2 && $auth.user.userid != 'uuum' && $auth.user.userid != 'uuum2'" class="account-type" :title="$t('user_type.company')">{{ $t('user_type.company') }}</span>
            <span v-if="$auth.user.user_type == 3 && $auth.user.domain != 'uuum' && $auth.user.domain != 'uuum2'" class="account-type" :title="$t('user_type.requester')">{{ $t('user_type.requester') }}</span>
            <span v-if="$auth.user.user_type == 4" class="account-type" :title="$t('user_type.tc')">{{ $t('user_type.tc') }}</span>
            <span v-if="$auth.user.user_type == 5" class="account-type" :title="$t('user_type.translator')">{{ $t('user_type.translator') }}</span>
            <span v-if="$auth.user.user_type == 6" class="account-type" :title="$t('user_type.reviewer')">{{ $t('user_type.reviewer') }}</span>
            <span v-if="$auth.user.user_type == 7 && $auth.user.domain != 'uuum' && $auth.user.domain != 'uuum2'" class="account-type" :title="$t('user_type.manager')">{{ $t('user_type.manager') }}</span>
          </div>
        </div>
      </div>
      <el-dropdown trigger="click">
        <div class="dropdown-caret">
          <!-- <UserDropdownCaret class="user-dropdown-caret" /> -->
          <svg-icon icon-class="user-dropdown-caret" class-name="icon-caret" />
        </div>
        <el-dropdown-menu slot="dropdown" class="user-dropdown">
          <nuxt-link to="/profile">
            <el-dropdown-item>
              {{ $t('sidebar.my_profile') }}
            </el-dropdown-item>
          </nuxt-link>
          <el-dropdown-item divided @click.native="logout">
            <span style="display:block;">{{ $t('navbar.logout') }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

const defaultAvatar = '/imgs/default-avatar.png'
const defaultHeaderLogo = '/imgs/dashboard-logo.png'

export default {
  computed: {
    ...mapGetters({
      userName: 'user/userName',
      userAvatar: 'user/userAvatar',
      companyLogo: 'user/companyLogo',
      noticeCount: 'app/noticeCount'
    }),
    getUserName () {
      return this.userName ? this.userName : this.$auth.user.user_name
    },
    sidebar () {
      return this.$store.state.app.sidebar
    },
    getUserAvatar () {
      return this.userAvatar ? this.userAvatar : (this.$auth.user.avatar || defaultAvatar)
    },
    getCompanyLogo () {
      return this.companyLogo ? this.companyLogo : (this.$auth.user.company_logo || defaultHeaderLogo)
    },
    getDashboardLink () {
      if (this.$auth.user.user_type === 1) {
        return '/'
      } else if (this.$auth.user.user_type >= 4 && this.$auth.user.user_type <= 6) {
        return '/dashboard/worker'
      } else if (this.$auth.user.user_type === 7) {
        return '/dashboard/company'
      } else {
        return '/dashboard/' + this.$auth.user.role
      }
    },
    getNoticeCount () {
      return this.noticeCount >= 1 ? this.noticeCount : ''
    }
  },
  watch: {
    $route (to, from) {
      if (to.path !== '/notification') {
        this.getNoiceCountAPI()
      }
    }
  },
  created () {
    this.getNoiceCountAPI()
  },
  methods: {
    async getNoiceCountAPI () {
      try {
        const response = await this.$axios.post('/notice/get-notice-count')
        await this.$store.dispatch('app/setNoticeCount', response.data.data)
      } catch {
      }
    },
    async logout () {
      await this.$auth.logout()
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/assets/styles/variables.scss";

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: $navbarHeight;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);

  .dashboard-logo {
    cursor: pointer;
    margin-left: 25px;
    img.company-logo {
      width: 150px;
      height: 50px;
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .right-menu {
    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      height: 100%;
      font-size: 16px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background .3s;

        &:hover {
          background: rgba(0, 0, 0, .025)
        }
      }
    }

    .el-dropdown {
      margin-top: 3px;
      margin-right: 30px;
      cursor: pointer;
      .icon-caret {
        width: 18px;
        height: 45px;
        vertical-align: middle;
      }
      &:hover {
        opacity: 0.8;
      }
    }
    .user-wrapper {
      display: flex;
      position: relative;
      float: left;
      align-items: center;
      .notifications {
        margin-right: 30px;
        img {
          width: 80%;
        }
      }
      .user-avatar {
        cursor: pointer;
        width: 50px;
        height: 50px;
        border-radius: 10px;
        vertical-align: middle;
      }
      .user-info {
        line-height: 25px;
        padding: 0px 40px 0px 10px;
      }
    }
  }
  .account-type{
    font-size: 15px;
    color: grey;
  }
}

@media screen and (max-width: 480px) {
  .navbar {
    .dashboard-logo {
      margin-left: 5px !important;
      img {
        width: 105px !important;
      }
    }

    .right-menu {
      .el-dropdown {
        margin-right: 10px !important;
      }
      .user-wrapper {
        .notifications {
          margin-right: 10px !important;
        }
        .user-avatar {
          width: 40px !important;
          height: 40px !important;
        }
        .user-info {
          max-width: 100px;
          padding: 0px 10px 0px 10px;
          .user-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }
}
::v-deep {
  .show-count sup {
    display: block !important;
  }
}
</style>
