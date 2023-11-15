<template>
  <el-card>
    <div class="icon">
      <svg-icon :icon-class="iconName" />
    </div>
    <nuxt-link :to="{ name: routeName, params: routeParams }">
      <div class="main-value">
        {{ mainValue }}
      </div>
    </nuxt-link>
    <div class="label-text" :class="$i18n.locale">
      {{ labelText }}
    </div>
  </el-card>
</template>

<script>
export default {
  name: 'BoardStatusCard',
  props: {
    iconName: {
      type: String,
      default: ''
    },
    mainValue: {
      type: [String, Number],
      default: 0
    },
    routeName: {
      type: String,
      default: ''
    },
    routeParams: {
      type: Object,
      default () {
        return {}
      }
    },
    labelText: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
.el-card {
  border-radius: $cardBoxRadius;
}
.svg-icon {
  width: 3em;
  height: 3em;
}
.icon {
  text-align: right;
  margin-bottom: 15px;
}
.main-value {
  font-size: $boardInnerValFs;
  font-weight: bold;
  text-align: left;
}
.label-text {
  color: $gray60;
  text-align: left;
  font-size: $boardInnerLabelFs;
  font-weight: bold;
}
.label-text.en {
  min-height: 40px;
}
</style>
