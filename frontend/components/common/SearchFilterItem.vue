<template>
  <div class="search-item">
    <label>{{ $t('common.search_word') }}</label>
    <el-select v-model="searchField" class="search-field" @change="keywordTypeChanged">
      <el-option v-for="item in searchFields" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-input
      v-model="searchWord"
      :placeholder="$t('common.type_to_search')"
      class="search-input"
      @input="onSearchWordChange"
      @change="onSearchWordChange"
      @keyup.enter.native="handleSearch"
    >
      <svg-icon slot="prefix" icon-class="search" />
    </el-input>
    <el-radio-group v-model="searchOption" class="search-option" @change="searchOptionChange">
      <el-radio :label="1" :border="border">
        {{ option1 }}
      </el-radio>
      <el-radio :label="2" :border="border">
        {{ option2 }}
      </el-radio>
    </el-radio-group>
  </div>
</template>
<script>
export default {
  name: 'SearchFilterItem',
  props: {
    searchFields: {
      type: Array,
      default () {
        return []
      }
    },
    selPreset: {
      type: Number,
      default: 1
    },
    border: {
      type: Boolean,
      default: true
    },
    option1: {
      type: String,
      default: ''
    },
    option2: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      searchField: this.selPreset,
      searchWord: '',
      searchOption: 1
    }
  },
  methods: {
    handleSearch () {
      this.$emit('handleSearch')
    },
    searchOptionChange () {
      this.$emit('optionChanged', this.searchOption)
    },
    onSearchWordChange () {
      this.$emit('searchWordChanged', this.searchWord)
    },
    keywordTypeChanged () {
      this.$emit('keywordTypeChanged', this.searchField)
    }
  }
}
</script>
<style lang="scss" scoped>
.search-item {
  display: flex;
  align-items: center;
  label {
    flex: none;
    min-width: 75px;
    white-space: nowrap !important;
    margin-right: 10px;
  }
  .search-field {
    min-width: 150px;
    margin-right: 5px;
    text-overflow: ellipsis;
  }
  .search-input {
    min-width: 180px;
    margin-right: 5px;
  }
  .search-option {
    display: inline-flex;
    margin-right: 10px;
    .el-radio {
      margin-right: 0px;
    }
    .el-radio.is-bordered+.el-radio.is-bordered {
      margin-left: 5px;
    }
  }
}
</style>
