<template>
  <div :class="{'hidden':hidden}" class="pagination-container">
    <el-pagination
      :background="background"
      :current-page.sync="currentPage"
      :page-size.sync="pageSize"
      :layout="layout"
      :page-sizes="pageSizes"
      :total="total"
      v-bind="$attrs"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script>
import { easeInOutQuad } from '@/utils/index.js'

export default {
  name: 'Pagination',
  props: {
    total: {
      required: true,
      type: Number
    },
    page: {
      type: Number,
      default: 1
    },
    limit: {
      type: Number,
      default: 20
    },
    pageSizes: {
      type: Array,
      default () {
        return [10, 20, 30, 50]
      }
    },
    layout: {
      type: String,
      default: 'total, sizes, prev, pager, next, jumper'
    },
    background: {
      type: Boolean,
      default: true
    },
    autoScroll: {
      type: Boolean,
      default: true
    },
    hidden: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    currentPage: {
      get () {
        return this.page
      },
      set (val) {
        this.$emit('update:page', val)
      }
    },
    pageSize: {
      get () {
        return this.limit
      },
      set (val) {
        this.$emit('update:limit', val)
      }
    }
  },
  methods: {
    handleSizeChange (val) {
      this.$emit('pagination', { page: this.currentPage, limit: val })
      if (this.autoScroll) {
        this.scrollTo(0, 800)
      }
    },
    handleCurrentChange (val) {
      this.$emit('pagination', { page: val, limit: this.pageSize })
      if (this.autoScroll) {
        this.scrollTo(0, 800)
      }
    },
    /* 'scroll-to.js utils from vue-element-admin theme' */
    scrollTo (to, duration, callback) {
      const start = this.position()
      const change = to - start
      const increment = 20
      let currentTime = 0
      duration = (typeof (duration) === 'undefined') ? 500 : duration
      const self = this
      const animateScroll = function () {
        // increment the time
        currentTime += increment
        // find the value with the quadratic in-out easing function
        const val = easeInOutQuad(currentTime, start, change, duration)
        // move the document.body
        self.move(val)
        // do the animation unless its over
        if (currentTime < duration) {
          self.requestAnimFrame(animateScroll)
        } else if (callback && typeof (callback) === 'function') {
          // the animation is done so lets callback
          callback()
        }
      }
      animateScroll()
    },
    position () {
      return document.documentElement.scrollTop || document.body.parentNode.scrollTop || document.body.scrollTop
    },
    move (amount) {
      document.documentElement.scrollTop = amount
      document.body.parentNode.scrollTop = amount
      document.body.scrollTop = amount
    },
    requestAnimFrame () {
      return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
      function (callback) { window.setTimeout(callback, 1000 / 60) }
    }
  }
}
</script>

<style scoped>
.pagination-container {
  background: #fff;
  padding: 32px 16px;
}
.pagination-container.hidden {
  display: none;
}
</style>
