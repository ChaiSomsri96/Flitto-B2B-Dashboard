<template>
  <div v-if="hasPermission(item)">
    <div v-if="hasOneShowingChild(item.children, item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren) && !item.alwaysShow">
      <nuxt-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path)">
        <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{'submenu-title-noDropdown':!isNest}">
          <!-- <item :icon="onlyOneChild.meta.icon || (item.meta && item.meta.icon)" :title="onlyOneChild.meta.title" /> -->
          <svg-icon v-if="onlyOneChild.meta.icon || (item.meta && item.meta.icon)" :icon-class="onlyOneChild.meta.icon || (item.meta && item.meta.icon)" />
          <span>{{ $t('' + onlyOneChild.meta.title) }}</span>
        </el-menu-item>
      </nuxt-link>
    </div>

    <el-submenu v-else ref="subMenu" :index="resolvePath(item.path)" popper-append-to-body>
      <template slot="title">
        <!-- <item v-if="item.meta" :icon="item.meta && item.meta.icon" :title="item.meta.title" /> -->
        <svg-icon v-if="item.meta.icon" :icon-class="item.meta.icon" />
        <span>{{ $t('' + item.meta.title) }}</span>
      </template>
      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path)"
        class="nest-menu"
      />
    </el-submenu>
  </div>
</template>

<script>
import path from 'path'
// import Item from './Item'
import FixiOSBug from '@/mixin/FixiOSBug'
import { isExternal } from '@/utils/validate'

export default {
  name: 'SidebarItem',
  // components: { Item },
  mixins: [FixiOSBug],
  props: {
    // route object
    item: {
      type: Object,
      required: true
    },
    isNest: {
      type: Boolean,
      default: false
    },
    basePath: {
      type: String,
      default: ''
    }
  },
  data () {
    // To fix https://github.com/PanJiaChen/vue-admin-template/issues/237
    // TODO: refactor with render function
    return {
      onlyOneChild: null
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
    hasOneShowingChild (children = [], parent) {
      const showingChildren = children.filter((item) => {
        if (item.meta === '' || item.meta === undefined) {
          return false
        } else {
          // Temp set(will be used if only has one showing child)
          this.onlyOneChild = item
          return true
        }
      })

      // When there is only one child router, the child router is displayed by default
      if (showingChildren.length === 1) {
        return true
      }

      // Show parent if there are no child router to display
      if (showingChildren.length === 0) {
        this.onlyOneChild = { ...parent, path: '', noShowingChildren: true }
        return true
      }
      return false
    },
    resolvePath (routePath) {
      if (isExternal(routePath)) {
        return routePath
      }
      if (isExternal(this.basePath)) {
        return this.basePath
      }
      return path.resolve(this.basePath, routePath)
    }
  }
}
</script>
