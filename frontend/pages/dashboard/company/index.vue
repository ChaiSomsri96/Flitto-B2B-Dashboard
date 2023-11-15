<template>
  <div v-loading="loading" class="app-container dashboard">
    <el-row :gutter="15">
      <el-col :md="24" :lg="12" class="trans-status-board">
        <div class="board-title">
          {{ $t('dashboard.trans_status') }}
        </div>
        <el-row :gutter="8">
          <el-col :md="8">
            <board-status-card
              :icon-name="'new-request'"
              :main-value="$t('dashboard.jobs', { num: transStatus.new_req_cnt })"
              :label-text="$t('dashboard.today_request')"
              :route-name="'caption-list-company'"
              :route-params="{ dateType: 1, period: 0 }"
            />
          </el-col>
          <el-col :md="8">
            <board-status-card
              :icon-name="'ongoing-trans'"
              :main-value="$t('dashboard.jobs', { num: transStatus.progress_req_cnt })"
              :label-text="$t('dashboard.ongoing_trans')"
              :route-name="'caption-list-company'"
              :route-params="{ dateType: 1, period: 6, finishWorkType: 3 }"
            />
          </el-col>
          <el-col :md="8">
            <board-status-card
              :icon-name="'finished_trans'"
              :main-value="$t('dashboard.jobs', { num: transStatus.end_req_cnt })"
              :label-text="$t('dashboard.today_finished_trans')"
              :route-name="'caption-list-company'"
              :route-params="{ dateType: 2, period: 0 }"
            />
          </el-col>
        </el-row>
      </el-col>
      <el-col :md="24" :lg="12" class="settle-status-board">
        <div class="board-title">
          {{ $t('dashboard.settle_status') }}
        </div>
        <el-row :gutter="8">
          <el-col :md="8">
            <board-status-card
              :icon-name="'last-money'"
              :main-value="lastMonthAmount"
              :label-text="$t('dashboard.last_amount')"
              :route-name="'settle'"
              :route-params="{ billingType: 2, period: 1, order: -4 }"
            />
          </el-col>
          <el-col :md="8">
            <board-status-card
              :icon-name="'cur-money'"
              :main-value="thisMonthAmount"
              :label-text="$t('dashboard.cur_amount')"
              :route-name="'settle'"
              :route-params="{ billingType: 2, period: 0, order: -4 }"
            />
          </el-col>
          <el-col :md="8">
            <board-status-card
              :icon-name="'total-money'"
              :main-value="totalAmount"
              :label-text="$t('dashboard.total_amount')"
              :route-name="'settle'"
              :route-params="{ billingType: 2, period: 5, order: -4 }"
            />
          </el-col>
        </el-row>
      </el-col>
    </el-row>
    <el-row :gutter="15">
      <el-col :md="12" :lg="12">
        <div class="board-title">
          {{ $t('dashboard.new_req_situation') }}
        </div>
        <line-chart v-if="loaded" :chartdata="newReqChartData" :options="chartOptions" />
      </el-col>
      <el-col :md="12" :lg="12">
        <div class="board-title">
          {{ $t('dashboard.requester_situation') }}
        </div>
        <line-chart v-if="loaded" :chartdata="reqChartData" :options="chartOptions" />
      </el-col>
    </el-row>
    <el-row :gutter="15">
      <el-col :md="24" :lg="12" class="ongoing-trans-board">
        <div class="board-title">
          {{ $t('dashboard.month_top_requester') }}({{ $t('dashboard.completed_trans_standard') }})
          <nuxt-link :to="{ name: 'settle', params: { billingType: 2, period: 0, order: -2 }}" class="load-more mr5">
            {{ $t('dashboard.load_more') }}
          </nuxt-link>
        </div>
        <board-requester-card
          v-for="(item, i) in completeList"
          :key="i"
          :ranking="i + 1"
          :avatar="item.avatar"
          :company-name="item.user_name"
          :complete-count="item.complete_count ? parseInt(item.complete_count) : 0"
          :route-name="'caption-list-company'"
          :route-params="{ dateType: 2, startDate: getStartDate(), endDate: getEndDate(), requester: item.user_no }"
        />
      </el-col>
      <el-col :md="24" :lg="12" class="finished-trans-board">
        <div class="board-title">
          {{ $t('dashboard.month_top_requester') }}({{ $t('dashboard.trans_amount_standard') }})
          <nuxt-link :to="{ name: 'settle', params: { billingType: 2, period: 0, order: -4 }}" class="load-more mr5">
            {{ $t('dashboard.load_more') }}
          </nuxt-link>
        </div>
        <board-requester-card
          v-for="(item, i) in priceList"
          :key="i"
          :ranking="i + 1"
          :avatar="item.avatar"
          :company-name="item.user_name"
          :price-sum="item.work_price_sum ? parseInt(item.work_price_sum) : 0"
          :currency-type="currencySymbols[$auth.user.currency_type]"
          :route-name="'settle'"
          :route-params="{ billingType: 2, period: 0, requester: item.user_no }"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import BoardRequesterCard from '@/components/common/BoardRequesterCard.vue'
import LineChart from '@/components/common/LineChart.js'

const currencySymbols = {
  JPY: '¥',
  KRW: '₩',
  USD: '$'
}

export default {
  layout: 'default',
  name: 'CompanyDashboard',
  // middleware: ['auth', 'auth-company'],
  middleware: ['auth', 'stats'],
  components: {
    BoardRequesterCard,
    LineChart
  },
  async fetch () {
    this.loading = true
    try {
      const transRes = await this.$axios.post('/dashboard/get-request-status')
      const settleRes = await this.$axios.post('/dashboard/get-billing-status')
      const completeListRes = await this.$axios.post('/dashboard/get-top-ranking', {
        method: 1 // 완료번역기준
      })
      const priceListRes = await this.$axios.post('/dashboard/get-top-ranking', {
        method: 2 // 번역금액기준
      })
      this.transStatus = transRes.data.data
      this.settleStatus = settleRes.data.data
      this.completeList = completeListRes.data.data
      this.priceList = priceListRes.data.data
    } catch (err) {
    }
    this.loading = false
  },
  data () {
    return {
      loading: false,
      transStatus: {},
      settleStatus: {},
      completeList: [],
      priceList: [],
      currencySymbols,
      loaded: false,
      newReqGraphList: {},
      reqGraphList: {},
      newReqChartData: {},
      reqChartData: {},
      chartOptions: {
        maintainAspectRatio: false,
        aspectRatio: 0.5,
        elements: {
          line: {
            tension: 0,
            borderColor: '#ec808d',
            backgroundColor: '#fdf4f3'
          },
          point: {
            borderColor: '#d38085',
            backgroundColor: '#fdf4f3'
          }
        },
        scales: {
          yAxes: [{
            ticks: {
              min: 0,
              precision: 0,
              fontSize: 14
            }
          }],
          xAxes: [{
            ticks: {
              fontSize: 14
            }
          }]
        }
      }
    }
  },
  computed: {
    lastMonthAmount () {
      if (this.settleStatus.last_month_work_price !== undefined) {
        return currencySymbols[this.$auth.user.currency_type] + this.$options.filters.numberFormat(parseInt(this.settleStatus.last_month_work_price))
      } else {
        return currencySymbols[this.$auth.user.currency_type] + ''
      }
    },
    thisMonthAmount () {
      if (this.settleStatus.this_month_work_price !== undefined) {
        return currencySymbols[this.$auth.user.currency_type] + this.$options.filters.numberFormat(parseInt(this.settleStatus.this_month_work_price))
      } else {
        return currencySymbols[this.$auth.user.currency_type] + ''
      }
    },
    totalAmount () {
      if (this.settleStatus.total_work_price !== undefined) {
        return currencySymbols[this.$auth.user.currency_type] + this.$options.filters.numberFormat(parseInt(this.settleStatus.total_work_price))
      } else {
        return currencySymbols[this.$auth.user.currency_type] + ''
      }
    }
  },
  async created () {
    this.loaded = false
    try {
      const reqGraphRes = await this.$axios.post('/dashboard/get-user-status')
      const newReqGraphRes = await this.$axios.post('/dashboard/get-new-request-status')
      this.newReqGraphList = newReqGraphRes.data.data
      this.reqGraphList = reqGraphRes.data.data
      this.newReqChartData = {
        labels: this.newReqGraphList.labels,
        datasets: [
          {
            label: '',
            data: this.newReqGraphList.values
          }
        ]
      }
      this.reqChartData = {
        labels: this.reqGraphList.labels,
        datasets: [
          {
            label: '',
            data: this.reqGraphList.values
          }
        ]
      }
      this.loaded = true
    } catch (e) {
      console.error(e)
    }
  },
  methods: {
    getStartDate () {
      const curDate = new Date()
      return new Date(curDate.getFullYear(), curDate.getMonth(), 1, 0, 0, 0).getTime()
    },
    getEndDate () {
      const curDate = new Date()
      return new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate(), 23, 59, 59).getTime()
    }
  }
}
</script>
<style lang="scss" scoped>
::v-deep {
  .ongoing-trans-board, .finished-trans-board {
    input {
      text-overflow: ellipsis;
    }
  }
}
</style>
