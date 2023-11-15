<template>
  <el-radio-group v-model="model" @change="onValueChange">
    <el-radio :label="1" :border="border">
      {{ option1 }}
    </el-radio>
    <el-radio :label="2" :border="border">
      {{ option2 }}
    </el-radio>
  </el-radio-group>
</template>
<script>
export default {
  props: {
    value: {
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
      model: this.value
    }
  },
  methods: {
    onValueChange () {
      this.$emit('radioChanged', this.model)
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
.el-radio {
  border-radius: $formControlBorderRadius;
  padding-left: 23px;
}
.el-radio.is-checked.is-disabled.is-bordered {
  border-color: $blue50 !important;
}
.el-radio.is-disabled.is-bordered {
  background-color: $detailInputBgColor;
}

::v-deep {
  .el-radio__label {
    font-size: 14px;
  }
}
</style>
