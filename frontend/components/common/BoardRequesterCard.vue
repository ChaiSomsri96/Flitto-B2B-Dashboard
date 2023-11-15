<template>
  <el-card>
    <nuxt-link :to="{ name: routeName, params: routeParams }">
      <div class="container">
        <div class="left-container">
          <span class="ranking ml20 mr30">{{ ranking }}</span>
          <img :src="avatar ? avatar : defaultAvatar" class="avatar mr20" />
          <div class="requester-info">
            <span class="company-name mb5">{{ companyName }}</span>
            <span class="user-name">{{ userName }}</span>
          </div>
        </div>
        <div class="right-container">
          <span v-if="completeCount" class="mr20">{{
            $t('dashboard.jobs', { num: completeCount })
          }}</span>
          <span v-else class="mr20">{{
            (currencyType + priceSum) | numberFormat
          }}</span>
        </div>
      </div>
    </nuxt-link>
  </el-card>
</template>

<script>
const defaultAvatar = '/imgs/default-avatar.png'
export default {
  name: 'BoardRequesterCard',
  props: {
    ranking: {
      type: [String, Number],
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    companyName: {
      type: String,
      default: ''
    },
    userName: {
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
      defaultAvatar
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
      width: 50px;
      height: 50px;
      border-radius: 50%;
    }
    .requester-info {
      display: inline-flex;
      flex-direction: column;
    }
  }
  .right-container {
    span {
      font-size: 16px;
    }
  }
}
</style>
