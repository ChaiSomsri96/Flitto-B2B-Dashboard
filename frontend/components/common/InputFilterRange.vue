<template>
  <div class="filter-item">
    <label class="label">{{ label }}{{ currencyType ? '(' + currencyType + ')' : '' }}</label>
    <el-select
      v-if="optionList.length > 0"
      v-model="selectedOption"
      :placeholder="selectPlaceholder"
      class="select-filter"
      @change="onSelectChange"
    >
      <el-option v-for="item in optionList" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-input v-model="minVal" :placeholder="$t('common.min')" @input="onMinValueInput">
    </el-input>
    <span class="to"> ~ </span>
    <el-input v-model="maxVal" :placeholder="$t('common.max')" @input="onMaxValueInput">
    </el-input>
  </div>
</template>

<script>
export default {
  name: 'InputFilterRange',
  props: {
    label: {
      type: String,
      default: ''
    },
    selectPlaceholder: {
      type: String,
      default: ''
    },
    optionList: {
      type: Array,
      default () {
        return []
      }
    },
    preOption: {
      type: [String, Number],
      default: '0'
    },
    startValue: {
      type: [String, Number],
      default: ''
    },
    endValue: {
      type: [String, Number],
      default: ''
    },
    currencyType: { // in case of company
      type: String,
      default: ''
    }
  },
  data () {
    return {
      selectedOption: this.preOption,
      minVal: this.startValue,
      maxVal: this.endValue
    }
  },
  watch: {
    startValue (newVal) {
      this.minVal = newVal
    },
    endValue (newVal) {
      this.maxVal = newVal
    },
    preOption (newVal) {
      this.selectedOption = newVal
    }
  },
  methods: {
    onSelectChange () {
      this.$emit('selectChanged', this.selectedOption)
    },
    onMinValueInput () {
      this.$emit('minValChanged', this.minVal)
    },
    onMaxValueInput () {
      this.$emit('maxValChanged', this.maxVal)
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-item {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  margin-right: 10px;
  margin-bottom: 0px !important;
  .label {
    min-width: 75px;
    white-space: nowrap !important;
    margin-right: 10px;
  }
  .select-filter {
    width: 110px;
    margin-right: 5px;
  }
  .el-input {
    width: 80px;
  }
  .to {
    width: 30px;
    text-align: center;
  }
}
</style>
