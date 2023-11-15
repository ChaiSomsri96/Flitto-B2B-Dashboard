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
              :route-name="'caption-list-admin'"
              :route-params="{ dateType: 1, period: 0 }"
            />
          </el-col>
          <el-col :md="8">
            <board-status-card
              :icon-name="'ongoing-trans'"
              :main-value="$t('dashboard.jobs', { num: transStatus.progress_req_cnt })"
              :label-text="$t('dashboard.ongoing_trans')"
              :route-name="'caption-list-admin'"
              :route-params="{ dateType: 1, period: 6, finishWorkType: 2 }"
            />
          </el-col>
          <el-col :md="8">
            <board-status-card
              :icon-name="'finished_trans'"
              :main-value="$t('dashboard.jobs', { num: transStatus.end_req_cnt })"
              :label-text="$t('dashboard.today_finished_trans')"
              :route-name="'caption-list-admin'"
              :route-params="{ dateType: 2, period: 0, finishWorkType: 1 }"
            />
          </el-col>
        </el-row>
      </el-col>
      <el-col :md="24" :lg="12" class="settle-status-board">
        <div class="board-title">
          {{ $t('dashboard.settle_status') }}
          <el-select v-model="settleCurrencyType">
            <el-option
              v-for="item in currencyTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
        <el-row v-loading="billLoading" :gutter="8">
          <el-col :md="8">
            <board-status-card
              :icon-name="'last-money'"
              :main-value="lastMonthAmount"
              :label-text="$t('dashboard.last_amount')"
              :route-name="'settle-admin'"
              :route-params="lastBillingRouteParams"
            />
          </el-col>
          <el-col :md="8">
            <board-status-card
              :icon-name="'cur-money'"
              :main-value="thisMonthAmount"
              :label-text="$t('dashboard.cur_amount')"
              :route-name="'settle-admin'"
              :route-params="thisBillingRouteParams"
            />
          </el-col>
          <el-col :md="8">
            <board-status-card
              :icon-name="'total-money'"
              :main-value="totalAmount"
              :label-text="$t('dashboard.total_amount')"
              :route-name="'settle-admin'"
              :route-params="totalBillingRouteParams"
            />
          </el-col>
        </el-row>
      </el-col>
    </el-row>
    <el-row :gutter="15">
      <el-col :md="12" :lg="6">
        <div class="board-title">
          {{ $t('dashboard.new_req_situation') }}
        </div>
        <line-chart v-if="loaded" :chartdata="newReqChartData" :options="chartOptions" />
      </el-col>
      <el-col :md="12" :lg="6">
        <div class="board-title">
          {{ $t('dashboard.company_situation') }}
        </div>
        <line-chart v-if="loaded" :chartdata="compChartData" :options="chartOptions" />
      </el-col>
      <el-col :md="12" :lg="6">
        <div class="board-title">
          {{ $t('dashboard.requester_situation') }}
        </div>
        <line-chart v-if="loaded" :chartdata="reqChartData" :options="chartOptions" />
      </el-col>
      <el-col :md="12" :lg="6">
        <div class="board-title worker-chart">
          {{ $t('dashboard.worker_situation') }}
          <el-select v-model="workerType" class="ml10">
            <el-option
              v-for="item in workerTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
        <line-chart v-if="workerGraphloaded" :chartdata="workerChartData" :options="chartOptions" />
      </el-col>
    </el-row>
    <el-row :gutter="15" class="bottom-list-items">
      <el-col v-loading="compLoading" :md="24" :lg="12" class="ongoing-trans-board">
        <div class="board-title">
          <div class="left-item">
            {{ $t('dashboard.month_top_company') }}
            <el-select v-model="compRankOption" class="ml10">
              <el-option
                v-for="item in rankOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
              </el-option>
            </el-select>
          </div>
          <nuxt-link :to="{ name: 'settle-admin', params: companyRouteParams }" class="load-more mr5">
            {{ $t('dashboard.load_more') }}
          </nuxt-link>
        </div>
        <board-company-card
          v-for="(item, i) in companyList"
          :key="i"
          :ranking="i + 1"
          :company-logo="item.avatar"
          :company-name="item.user_name"
          :complete-count="item.complete_count ? parseInt(item.complete_count) : 0"
          :price-sum="item.work_price_sum ? parseInt(item.work_price_sum) : 0"
          :currency-type="compCurrencyType"
          :route-name="'caption-list-admin'"
          :route-params="{ dateType: 2, startDate: getStartDate(), endDate: getEndDate(), company: item.user_no, finishWorkType: 1}"
        />
      </el-col>
      <el-col v-loading="reqLoading" :md="24" :lg="12" class="finished-trans-board">
        <div class="board-title">
          <div class="left-item">
            {{ $t('dashboard.month_top_requester') }}
            <el-select v-model="reqRankOption" class="ml10">
              <el-option
                v-for="item in rankOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
              </el-option>
            </el-select>
          </div>
          <nuxt-link :to="{ name: 'settle-admin', params: requesterRouteParams }" class="load-more mr10">
            {{ $t('dashboard.load_more') }}
          </nuxt-link>
        </div>
        <board-requester-card
          v-for="(item, i) in requesterList"
          :key="i"
          :ranking="i + 1"
          :avatar="item.avatar"
          :user-name="item.user_name"
          :complete-count="item.complete_count ? parseInt(item.complete_count) : 0"
          :price-sum="item.work_price_sum ? parseInt(item.work_price_sum) : 0"
          :currency-type="reqCurrencyType"
          :route-name="'caption-list-admin'"
          :route-params="{ dateType: 2, startDate: getStartDate(), endDate: getEndDate(), requester: item.user_no, company: item.company_no, finishWorkType: 1 }"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import BoardCompanyCard from '@/components/common/BoardCompanyCard.vue'
import BoardRequesterCard from '@/components/common/BoardRequesterCard.vue'
import LineChart from '@/components/common/LineChart.js'

const currencySymbols = {
  JPY: '¥',
  KRW: '₩',
  USD: '$'
}

export default {
  layout: 'default',
  name: 'AdminDashboard',
  // middleware: ['auth', 'auth-admin'],
  middleware: ['auth', 'stats'],
  components: {
    BoardCompanyCard,
    BoardRequesterCard,
    LineChart
  },
  async fetch () {
    if (this.$auth.user.user_type === 1) {
      this.loading = true
      try {
        const transRes = await this.$axios.post('/dashboard/get-request-status')
        const settleRes = await this.$axios.post('/dashboard/get-billing-status', {
          currency_type: 'JPY'
        })
        const companyListRes = await this.$axios.post('/dashboard/get-top-ranking-admin', {
          method: 1, // 완료번역기준
          user_type: 2 // 고객사
        })
        const requesterListRes = await this.$axios.post('/dashboard/get-top-ranking-admin', {
          method: 1, // 완료번역기준
          user_type: 1 // 요청자
        })

        this.transStatus = transRes.data.data
        this.settleStatus = settleRes.data.data
        this.companyList = companyListRes.data.data
        this.requesterList = requesterListRes.data.data
      } catch (err) {
      }
      this.loading = false
    }
  },
  data () {
    return {
      transStatus: {},
      settleStatus: {},
      companyList: [],
      requesterList: [],
      loading: false,
      billLoading: false,
      compLoading: false,
      reqLoading: false,
      loaded: false,
      workerGraphloaded: false,
      newReqGraphList: {},
      compGraphList: {},
      reqGraphList: {},
      workGraphList: {},
      newReqChartData: {},
      compChartData: {},
      reqChartData: {},
      workerChartData: {},
      settleCurrencyType: 'JPY',
      currencyTypes: [
        { value: 'JPY', label: this.$t('dashboard.currency_standard', { currency: '¥' }) },
        { value: 'KRW', label: this.$t('dashboard.currency_standard', { currency: '₩' }) },
        { value: 'USD', label: this.$t('dashboard.currency_standard', { currency: '$' }) }
      ],
      chartOptions: {
        responsive: true,
        maintainAspectRatio: true,
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
      },
      workerType: '',
      workerTypes: [
        { value: '', label: this.$t('common.all') },
        { value: 'tc', label: this.$t('user_type.tc') },
        { value: 'translator', label: this.$t('user_type.translator') },
        { value: 'reviewer', label: this.$t('user_type.reviewer') }
      ],
      compRankOption: 1,
      reqRankOption: 1,
      compCurrencyType: '',
      reqCurrencyType: '',
      rankOptions: [
        { value: 1, label: this.$t('dashboard.completed_trans_standard') },
        { value: 2, label: this.$t('dashboard.trans_amount_standard') + '(¥)' },
        { value: 3, label: this.$t('dashboard.trans_amount_standard') + '($)' },
        { value: 4, label: this.$t('dashboard.trans_amount_standard') + '(₩)' }
      ],
      companyRouteParams: {
        billingType: 2, // 고객사별
        period: 0, // 이번달
        order: -2 // 완료번역수 내림차순 정렬
      },
      requesterRouteParams: {
        billingType: 3, // 요청자별
        period: 0,
        order: -3
      },
      lastBillingRouteParams: {
        billingType: 3, period: 1, order: -7
      },
      thisBillingRouteParams: {
        billingType: 3, period: 0, order: -7
      },
      totalBillingRouteParams: {
        billingType: 3, period: 5, order: -7
      }
    }
  },
  computed: {
    lastMonthAmount () {
      if (this.settleStatus.last_month_work_price !== undefined) {
        return currencySymbols[this.settleCurrencyType] + this.$options.filters.numberFormat(parseInt(this.settleStatus.last_month_work_price))
      } else {
        return currencySymbols[this.settleCurrencyType] + ''
      }
    },
    thisMonthAmount () {
      if (this.settleStatus.this_month_work_price !== undefined) {
        return currencySymbols[this.settleCurrencyType] + this.$options.filters.numberFormat(parseInt(this.settleStatus.this_month_work_price))
      } else {
        return currencySymbols[this.settleCurrencyType] + ''
      }
    },
    totalAmount () {
      if (this.settleStatus.total_work_price !== undefined) {
        return currencySymbols[this.settleCurrencyType] + this.$options.filters.numberFormat(parseInt(this.settleStatus.total_work_price))
      } else {
        return currencySymbols[this.settleCurrencyType] + ''
      }
    }
  },
  watch: {
    compRankOption (newVal) {
      this.getTopRankings(newVal, 2)
      if (newVal === 2) {
        this.compCurrencyType = '¥'
        this.companyRouteParams.order = -6
      } else if (newVal === 3) {
        this.compCurrencyType = '$'
        this.companyRouteParams.order = -4
      } else if (newVal === 4) {
        this.compCurrencyType = '₩'
        this.companyRouteParams.order = -5
      }
    },
    reqRankOption (newVal) {
      this.getTopRankings(newVal, 1)
      if (newVal === 2) {
        this.reqCurrencyType = '¥'
        this.requesterRouteParams.order = -7
      } else if (newVal === 3) {
        this.reqCurrencyType = '$'
        this.requesterRouteParams.order = -5
      } else if (newVal === 4) {
        this.reqCurrencyType = '₩'
        this.requesterRouteParams.order = -6
      }
    },
    settleCurrencyType (newVal) {
      if (newVal === 'JPY') {
        this.lastBillingRouteParams.order = -7
        this.thisBillingRouteParams.order = -7
        this.totalBillingRouteParams.order = -7
      } else if (newVal === 'KRW') {
        this.lastBillingRouteParams.order = -6
        this.thisBillingRouteParams.order = -6
        this.totalBillingRouteParams.order = -6
      } else {
        this.lastBillingRouteParams.order = -5
        this.thisBillingRouteParams.order = -5
        this.totalBillingRouteParams.order = -5
      }
      this.getBillingStatus(newVal)
    },
    workerType (newVal) {
      this.getWorkerGraphData(newVal)
    }
  },
  async created () {
    this.loaded = false
    this.workerGraphloaded = false
    if (this.$auth.user.user_type === 1) {
      try {
        const compGraphRes = await this.$axios.post('/dashboard/get-user-status', {
          user_type: 'company' // 고객사현황
        })
        const reqGraphRes = await this.$axios.post('/dashboard/get-user-status', {
          user_type: 'requester' // 요청자현황
        })
        // 작업자전체현황
        const workerGraphRes = await this.$axios.post('/dashboard/get-user-status')
        // 신규요청현황
        const newReqGraphRes = await this.$axios.post('/dashboard/get-new-request-status')

        this.newReqGraphList = newReqGraphRes.data.data
        this.compGraphList = compGraphRes.data.data
        this.reqGraphList = reqGraphRes.data.data
        this.workGraphList = workerGraphRes.data.data

        this.newReqChartData = {
          labels: this.newReqGraphList.labels,
          datasets: [
            {
              label: '',
              data: this.newReqGraphList.values
            }
          ]
        }
        this.compChartData = {
          labels: this.compGraphList.labels,
          datasets: [
            {
              label: '',
              data: this.compGraphList.values
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
        this.workerChartData = {
          labels: this.workGraphList.labels,
          datasets: [
            {
              label: '',
              data: this.workGraphList.values
            }
          ]
        }
        this.loaded = true
        this.workerGraphloaded = true
      } catch (e) {
        console.error(e)
      }
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
    },
    async getWorkerGraphData (workerType) {
      this.workerGraphloaded = false
      try { // 작업자현황
        let workerGraphRes = null
        if (workerType) {
          workerGraphRes = await this.$axios.post('/dashboard/get-user-status', {
            user_type: workerType
          })
        } else {
          workerGraphRes = await this.$axios.post('/dashboard/get-user-status')
        }
        this.workGraphList = workerGraphRes.data.data
        this.workerChartData = {
          labels: this.workGraphList.labels,
          datasets: [
            {
              label: '',
              data: this.workGraphList.values
            }
          ]
        }
      } catch {
        this.workGraphList = {
          labels: ['N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'],
          values: ['0', '0', '0', '0', '0', '0', '0']
        }
      }
      this.workerGraphloaded = true
    },
    async getTopRankings (method, userType) {
      if (userType === 1) {
        this.reqLoading = true
      } else {
        this.compLoading = true
      }
      try {
        const res = await this.$axios.post('/dashboard/get-top-ranking-admin', {
          method,
          user_type: userType
        })
        if (userType === 1) {
          this.requesterList = res.data.data
        } else {
          this.companyList = res.data.data
        }
      } catch {
      } finally {
        this.reqLoading = false
        this.compLoading = false
      }
    },
    async getBillingStatus (currencyType) {
      try {
        this.billLoading = true
        const settleRes = await this.$axios.post('/dashboard/get-billing-status', {
          currency_type: currencyType
        })
        this.settleStatus = settleRes.data.data
      } catch {
      } finally {
        this.billLoading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.settle-status-board {
  & > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
.trans-status-board {
  .board-title {
    margin-bottom: 30px;
  }
}
::v-deep {
  .ongoing-trans-board, .finished-trans-board {
    input {
      text-overflow: ellipsis;
    }
  }
}
</style>
