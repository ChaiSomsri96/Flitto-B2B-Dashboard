<template>
  <el-select
    v-model="selectedOptions"
    multiple
    filterable
    :placeholder="placeholder"
    @change="optionChanged"
  >
    <!-- when multiple and filter is true,
    whether to reserve current keyword after selecting an option -->
    <el-option
      v-for="item in options"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    >
    </el-option>
  </el-select>
</template>
<script>
export default {
  name: 'SearchMultiSelect',
  props: {
    options: {
      type: Array,
      default () {
        return []
      }
    },
    defaultOptions: {
      type: Array,
      default () {
        return []
      }
    },
    placeholder: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      selectedOptions: this.defaultOptions
    }
  },
  watch: {
    defaultOptions (newVal) {
      this.selectedOptions = newVal
    }
  },
  methods: {
    optionChanged () {
      this.$emit('optionChanged', this.selectedOptions)
    }
  }
}
</script>
<style lang="scss" scoped>

</style>
