<template>
  <div class="lang-pairs">
    <el-tag type="info">
      {{ orglang }}
    </el-tag>
    <i class="el-icon-right"></i>
    <el-tag type="success">
      {{ translang }}
    </el-tag>
    <i class="el-icon-circle-close" @click="removeLangPair"></i>
  </div>
</template>
<script>
export default {
  name: 'LangTagPair',
  props: {
    index: {
      type: Number,
      default: 0
    },
    orglang: {
      type: String,
      default: ''
    },
    translang: {
      type: String,
      default: ''
    }
  },
  methods: {
    removeLangPair () {
      this.$emit('removeLangPair', this.index)
    }
  }
}
</script>
<style lang="scss" scoped>
.el-icon-circle-close {
  cursor: pointer;
}
</style>
