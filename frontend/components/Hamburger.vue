<template>
  <div @click="toggleClick">
    <!-- <img
      src="/imgs/hamburger.png"
      :class="{'is-active':isActive}"
    /> -->
    <svg-icon icon-class="hamburger" />
    <!-- <svg-icon
      icon-class="hamburger"
      :class="{'is-active':isActive, 'hamburger': true}"
      width="100"
      height="100"
    /> -->
  </div>
</template>

<script>
export default {
  name: 'Hamburger',
  props: {
    isActive: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    toggleClick () {
      this.$emit('toggleClick')
    }
  }
}
</script>
<style lang="scss" scoped>
.svg-icon {
  width: 110px;
  height: 110px;
}
</style>
