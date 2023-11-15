<template>
  <el-card>
    <nuxt-link :to="{ name: routeName, params: routeParams }">
      <div class="container">
        <div class="left-container">
          <span class="ranking ml20 mr30">{{ ranking }}.</span>
          <img :src="companyLogo ? companyLogo : defaultLogo" class="company-logo mr20" />
          <span class="company-name">{{ companyName }}</span>
        </div>
        <div class="right-container">
          <span v-if="completeCount" class="mr20">{{ $t('dashboard.jobs', { num: completeCount }) }}</span>
          <span v-else class="mr20">{{ currencyType + priceSum | numberFormat }}</span>
        </div>
      </div>
    </nuxt-link>
  </el-card>
</template>

<script>
const defaultLogo = '/imgs/dashboard-logo.png'

export default {
  name: 'BoardCompanyCard',
  props: {
    ranking: {
      type: [String, Number],
      default: ''
    },
    companyLogo: {
      type: String,
      default: ''
    },
    companyName: {
      type: String,
      default: ''
    },
    completeCount: {
      type: Number,
      default: 0
    },
    priceSum: {
      type: Number,
      default: 0
    },
    currencyType: {
      type: String,
      default: '¥'
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
    }
  },
  data () {
    return {
      defaultLogo
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
.el-card {
  margin-bottom: 15px;
}

.container {
  border-radius: $cardBoxRadius;
  display: flex;
  align-items: center;
  font-weight: bold;
  .left-container {
    flex: 1;
    display: inline-flex;
    align-items: center;
    .ranking {
      font-size: 15px;
    }
    img {
      padding: 1.5px 5px;
      width: 150px;
      height: 50px;
    }
  }
  .right-container {
    span {
      font-size: 16px;
    }
  }
}
</style>
