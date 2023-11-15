<template>
  <el-input
    v-model="model"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :autosize="autoSize"
    @input="onChange"
    @change="onChange"
  >
    <template v-if="prepend" slot="prepend">
      <svg-icon slot="prefix" :icon-class="iconName" />
      <span class="prepend-text">{{ prepend }}</span>
    </template>
    <template v-else>
      <svg-icon slot="prefix" :icon-class="iconName" />
    </template>
  </el-input>
</template>

<script>
export default {
  name: 'InputWithIcon',
  props: {
    inputValue: {
      type: [String, Number],
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    placeholder: {
      type: String,
      default: ''
    },
    iconName: {
      type: String,
      default: ''
    },
    prepend: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    autoSize: {
      type: [Boolean, Object],
      default: false
    }
  },
  data () {
    return {
      model: this.inputValue
    }
  },
  watch: {
    inputValue (newVal) {
      this.model = newVal
    }
  },
  methods: {
    onChange () {
      this.$emit('inputChanged', this.model)
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
.svg-icon {
  width: $svgSize !important;
  height: $svgSize !important;
}
::v-deep {
  .el-input__prefix {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 4px;
  }
  .el-input__inner {
    padding-left: 3em;
    height: $inputBoxHeight;
    font-size: $inputFontSize;
    border-radius: $formControlBorderRadius;
  }
  .el-input-group__prepend {
    padding: 0 15px;
    border-top-left-radius: $formControlBorderRadius;
    border-bottom-left-radius: $formControlBorderRadius;
  }
  .prepend-text {
    font-size: $inputFontSize;
    vertical-align: super;
    padding-left: 10px;
  }
  .el-input-group--prepend .el-input__inner {
    border-top-right-radius: $formControlBorderRadius;
    border-bottom-right-radius: $formControlBorderRadius;
  }
}
</style>
