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
              :route-name="'caption-list-company'"
              :route-params="{ dateType: 2, startDate: lastMonthStartDate(), endDate: lastMonthEndDate(), finishWorkType: 1 }"
            />
          </el-col>
          <el-col :md="8">
            <board-status-card
              :icon-name="'cur-money'"
              :main-value="thisMonthAmount"
              :label-text="$t('dashboard.cur_amount')"
              :route-name="'caption-list-company'"
              :route-params="{ dateType: 2, startDate: thisMonthStartDate(), endDate: thisMonthEndDate(), finishWorkType: 1 }"
            />
          </el-col>
          <el-col :md="8">
            <board-status-card
              :icon-name="'total-money'"
              :main-value="totalAmount"
              :label-text="$t('dashboard.total_amount')"
              :route-name="'settle'"
              :route-params="{ period: 5 }"
            />
          </el-col>
        </el-row>
      </el-col>
    </el-row>
    <el-row :gutter="15">
      <el-col :md="24" :lg="12" class="ongoing-trans-board">
        <div class="board-title">
          {{ $t('dashboard.ongoing_trans') + '(' + progressCnt + ')' }}
          <nuxt-link :to="{ name: 'caption-list-company', params: { dateType: 1, period: 6, finishWorkType: 3 }}" class="load-more mr5">
            {{ $t('dashboard.load_more') }}
          </nuxt-link>
        </div>
        <board-item-card
          v-for="(item, i) in progressList"
          :key="i"
          :title="item.title"
          :youtube-url="item.youtube_url"
          :status="item.status"
          :date-label="$t('table.tr_request_date')"
          :date-time="item.req_date"
          :work-no="item.id"
          :is-requester="true"
        />
      </el-col>
      <el-col :md="24" :lg="12" class="finished-trans-board">
        <div class="board-title">
          {{ $t('dashboard.finished_trans') + '(' + completeCnt + ')' }}
          <nuxt-link :to="{ name: 'caption-list-company', params: { dateType: 1, period: 6, finishWorkType: 1 }}" class="load-more mr5">
            {{ $t('dashboard.load_more') }}
          </nuxt-link>
        </div>
        <board-item-card
          v-for="(item, i) in completeList"
          :key="i"
          :title="item.title"
          :youtube-url="item.youtube_url"
          :status="item.status"
          :date-label="$t('table.tr_finish_date')"
          :date-time="item.end_date"
          :work-no="item.id"
          :is-requester="true"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import BoardStatusCard from '@/components/common/BoardStatusCard.vue'
import BoardItemCard from '@/components/common/BoardItemCard.vue'

const currencySymbols = {
  JPY: '¥',
  KRW: '₩',
  USD: '$'
}

export default {
  layout: 'default',
  name: 'RequesterDashboard',
  // middleware: ['auth', 'auth-requester'],
  middleware: ['auth', 'stats'],
  components: {
    BoardStatusCard,
    BoardItemCard
  },
  async fetch () {
    this.loading = true
    try {
      const transRes = await this.$axios.post('/dashboard/get-request-status')
      const settleRes = await this.$axios.post('/dashboard/get-billing-status')
      const listRes = await this.$axios.post('/dashboard/get-request-list')

      this.transStatus = transRes.data.data
      this.settleStatus = settleRes.data.data
      this.progressCnt = listRes.data.progress_count
      this.progressList = listRes.data.progress_list
      this.completeCnt = listRes.data.complete_count
      this.completeList = listRes.data.complete_list
    } catch (err) {
    }
    this.loading = false
  },
  data () {
    return {
      loading: false,
      transStatus: {},
      settleStatus: {},
      progressCnt: '',
      progressList: [],
      completeCnt: '',
      completeList: []
    }
  },
  computed: {
    lastMonthAmount () {
      if (this.settleStatus.last_month_work_price !== undefined) {
        return currencySymbols[this.$auth.user.currency_type] + this.$options.filters.numberFormat(this.settleStatus.last_month_work_price)
      } else {
        return currencySymbols[this.$auth.user.currency_type] + ''
      }
    },
    thisMonthAmount () {
      if (this.settleStatus.this_month_work_price !== undefined) {
        return currencySymbols[this.$auth.user.currency_type] + this.$options.filters.numberFormat(this.settleStatus.this_month_work_price)
      } else {
        return currencySymbols[this.$auth.user.currency_type] + ''
      }
    },
    totalAmount () {
      if (this.settleStatus.total_work_price !== undefined) {
        return currencySymbols[this.$auth.user.currency_type] + this.$options.filters.numberFormat(this.settleStatus.total_work_price)
      } else {
        return currencySymbols[this.$auth.user.currency_type] + ''
      }
    }
  },
  methods: {
    thisMonthStartDate () {
      const curDate = new Date()
      return new Date(curDate.getFullYear(), curDate.getMonth(), 1, 0, 0, 0).getTime()
    },
    thisMonthEndDate () {
      const curDate = new Date()
      return new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate(), 23, 59, 59).getTime()
    },
    lastMonthStartDate () {
      const curDate = new Date()
      return new Date(curDate.getFullYear(), curDate.getMonth() - 1, 1, 0, 0, 0).getTime()
    },
    lastMonthEndDate () {
      const curDate = new Date()
      return new Date(curDate.getFullYear(), curDate.getMonth(), 0, 23, 59, 59).getTime()
    }
  }
}
</script>
