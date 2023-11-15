<template>
  <el-checkbox
    v-model="model"
    :label="label"
    :border="border"
    :disabled="disabled"
    :style="style"
    @change="onChange"
  >
  </el-checkbox>
</template>
<script>
export default {
  name: 'CustomCheckBox',
  props: {
    isChecked: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: ''
    },
    border: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    height: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      model: this.isChecked
    }
  },
  computed: {
    style () {
      if (this.height) {
        return 'height: ' + this.height
      } else {
        return ''
      }
    }
  },
  watch: {
    isChecked (newVal) {
      this.model = newVal
    }
  },
  methods: {
    onChange () {
      this.$emit('checkChanged', this.model)
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

::v-deep {
  .el-checkbox__label {
    font-size: 14px;
    line-height: 27px;
  }
  /** checkbox customize */
  .el-checkbox__inner {
    border-radius: 50%;
    display: inline-block;
    position: relative;
    border: 1px solid #DCDFE6;
    box-sizing: border-box;
    width: 15px;
    height: 15px;
    background-color: #DDDDDD;
    &::after {
      transform: rotate(45deg) scaleY(1);
      box-sizing: content-box;
      content: "";
      border: 1px solid #FFF;
      border-left: 0;
      border-top: 0;
      height: 7px;
      left: 5px;
      position: absolute;
      top: 2px;
      width: 3px;
      transition: transform .15s ease-in .05s;
      transform-origin: center;
    }
  }
  .el-checkbox__input.is-focus .el-checkbox__inner {
    border-color: #DCDFE6;
  }
  .el-checkbox__input.is-checked .el-checkbox__inner {
    background-color: $blue50;
    border-color: $blue50;
  }

  .el-checkbox.is-disabled.is-bordered.is-checked .el-checkbox__inner {
    border-color: $blue50;
  }
  .el-checkbox__input.is-disabled.is-checked .el-checkbox__inner::after {
    border-color: #FFF;
  }
  .el-checkbox__input.is-disabled.is-checked+span.el-checkbox__label {
    color: $blue50;
  }
  .el-checkbox__input.is-disabled .el-checkbox__inner {
    background-color: #DDDDDD;
    &::after {
      border-color: #FFF;
    }
  }
  .el-checkbox__input.is-checked.is-disabled .el-checkbox__inner {
    background-color: $blue50;
  }
}

.el-checkbox {
  height: $inputBoxHeight;
  border-radius: $formControlBorderRadius;
  padding-left: $notifyCheckboxPaddingLeft;
}
.el-checkbox.is-checked.is-disabled.is-bordered {
  border-color: $blue50 !important;
}
.el-checkbox.is-disabled.is-bordered {
  background-color: $detailInputBgColor;
}
</style>
