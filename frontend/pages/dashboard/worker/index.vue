<template>
  <div v-loading="loading" class="app-container dashboard">
    <el-row :gutter="15">
      <el-col :md="24" :lg="12" class="work-status-board">
        <div class="board-title">
          {{ workerStatusLabel }}
        </div>
        <el-row :gutter="8">
          <el-col :md="8">
            <board-status-card
              :icon-name="'new-request'"
              :main-value="$t('dashboard.jobs', { num: workStatus.allow_req_cnt })"
              :label-text="$t('dashboard.work_acceptable', { workType: getWorkType })"
              :route-name="'caption-list-worker'"
              :route-params="{ dateType: 1, period: 6, status: preparingStatus }"
            />
          </el-col>
          <el-col :md="8">
            <board-status-card
              :icon-name="'ongoing-trans'"
              :main-value="$t('dashboard.jobs', { num: getProgressCnt })"
              :label-text="$t('dashboard.ongoing_work', { workType: getWorkType })"
              :route-name="'caption-list-worker'"
              :route-params="{ dateType: 1, period: 6, status: progressStatus }"
            />
          </el-col>
          <!-- completed this month -->
          <el-col :md="8">
            <board-status-card
              :icon-name="'finished_trans'"
              :main-value="$t('dashboard.jobs', { num: workStatus.end_req_cnt })"
              :label-text="$t('dashboard.month_completed_work', { workType: getWorkType })"
              :route-name="'caption-list-worker'"
              :route-params="{ dateType: 3, startDate: thisMonthStartDate(), endDate: thisMonthEndDate(), status: completeStatus }"
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
              :label-text="$t('dashboard.last_work_amount', { workType: getWorkType })"
              :route-name="'caption-list-worker'"
              :route-params="{ dateType: 3, startDate: lastMonthStartDate(), endDate: lastMonthEndDate(), status: completeStatus }"
            />
          </el-col>
          <el-col :md="8">
            <board-status-card
              :icon-name="'cur-money'"
              :main-value="thisMonthAmount"
              :label-text="$t('dashboard.cur_work_amount', { workType: getWorkType })"
              :route-name="'caption-list-worker'"
              :route-params="{ dateType: 3, startDate: thisMonthStartDate(), endDate: thisMonthEndDate(), status: completeStatus }"
            />
          </el-col>
          <el-col :md="8">
            <board-status-card
              :icon-name="'total-money'"
              :main-value="totalAmount"
              :label-text="$t('dashboard.total_work_amount', { workType: getWorkType })"
              :route-name="'caption-list-worker'"
              :route-params="{ dateType: 3, period: 6, status: completeStatus }"
            />
          </el-col>
        </el-row>
      </el-col>
    </el-row>
    <el-row :gutter="15">
      <el-col :md="24" :lg="12" class="ongoing-trans-board">
        <div class="board-title">
          {{ $t('dashboard.ongoing_work', { workType: getWorkType }) }}({{ progressCnt }})
          <nuxt-link :to="{ name: 'caption-list-worker', params: { dateType: 1, period: 6, status: progressStatus }}" class="load-more mr5">
            {{ $t('dashboard.load_more') }}
          </nuxt-link>
        </div>
        <board-item-card
          v-for="(item, i) in progressList"
          :key="i"
          :title="item.title"
          :youtube-url="item.youtube_url"
          :status="item.status"
          :date-label="progressDateLabel"
          :date-time="item.predict_end_date"
          :work-no="item.id"
        />
      </el-col>
      <el-col :md="24" :lg="12" class="finished-trans-board">
        <div class="board-title">
          {{ $t('dashboard.completed_work', { workType: getWorkType }) }}({{ completeCnt }})
          <nuxt-link :to="{ name: 'caption-list-worker', params: { dateType: 3, period: 6, status: completeStatus }}" class="load-more mr5">
            {{ $t('dashboard.load_more') }}
          </nuxt-link>
        </div>
        <board-item-card
          v-for="(item, i) in completeList"
          :key="i"
          :title="item.title"
          :youtube-url="item.youtube_url"
          :status="item.status"
          :date-label="completeDateLabel"
          :date-time="item.end_date"
          :work-no="item.id"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import BoardStatusCard from '@/components/common/BoardStatusCard.vue'
import BoardItemCard from '@/components/common/BoardItemCard.vue'

export default {
  layout: 'default',
  name: 'WorkerDashboard',
  // middleware: ['auth', 'auth-worker'],
  middleware: ['auth', 'stats'],
  components: {
    BoardStatusCard,
    BoardItemCard
  },
  async fetch () {
    this.loading = true
    try {
      const workRes = await this.$axios.post('/dashboard/get-request-status')
      const settleRes = await this.$axios.post('/dashboard/get-worker-billing-status')
      const listRes = await this.$axios.post('/dashboard/get-request-list')
      this.workStatus = workRes.data.data
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
      workStatus: {},
      settleStatus: {},
      progressCnt: '',
      progressList: [],
      completeCnt: '',
      completeList: [],
      workerStatusLabel: '',
      workTypes: {
        tc: this.$t('dashboard.tc'),
        translator: this.$t('dashboard.trans'),
        reviewer: this.$t('dashboard.review')
      },
      preparingStatus: '',
      progressStatus: '',
      completeStatus: '',
      progressDateLabel: '',
      completeDateLabel: ''
    }
  },
  computed: {
    getWorkType () {
      return this.workTypes[this.$auth.user.role]
    },
    getProgressCnt () {
      if (this.workStatus.can_work !== undefined) {
        return this.workStatus.can_work !== -1 ? this.workStatus.progress_req_cnt + '/' + this.workStatus.can_work : this.workStatus.progress_req_cnt
      } else {
        return '0'
      }
    },
    lastMonthAmount () {
      if (this.settleStatus.last_month_work_price !== undefined) {
        return '$' + this.$options.filters.numberFormat(parseInt(this.settleStatus.last_month_work_price))
      } else {
        return '$0'
      }
    },
    thisMonthAmount () {
      if (this.settleStatus.this_month_work_price !== undefined) {
        return '$' + this.$options.filters.numberFormat(parseInt(this.settleStatus.this_month_work_price))
      } else {
        return '$0'
      }
    },
    totalAmount () {
      if (this.settleStatus.total_work_price !== undefined) {
        return '$' + this.$options.filters.numberFormat(parseInt(this.settleStatus.total_work_price))
      } else {
        return '$0'
      }
    }
  },
  created () {
    this.initVariables()
  },
  methods: {
    initVariables () {
      if (this.$auth.user.user_type === 4) {
        this.workerStatusLabel = this.$t('dashboard.tc_status')
        this.preparingStatus = 'preparing'
        this.progressStatus = 'tc_ing'
        this.completeStatus = 'tc_complete'
        this.progressDateLabel = this.$t('table.tc_predict_date')
        this.completeDateLabel = this.$t('table.tc_finish_date')
      } else if (this.$auth.user.user_type === 5) {
        this.workerStatusLabel = this.$t('dashboard.trans_status')
        this.preparingStatus = 'tc_complete'
        this.progressStatus = 'translating'
        this.completeStatus = 'translation_complete'
        this.progressDateLabel = this.$t('table.tr_predict_date')
        this.completeDateLabel = this.$t('table.tr_finish_date')
      } else {
        this.workerStatusLabel = this.$t('dashboard.review_status')
        this.preparingStatus = 'translation_complete'
        this.progressStatus = 'reviewing'
        this.completeStatus = 'review_complete'
        this.progressDateLabel = this.$t('table.re_predict_date')
        this.completeDateLabel = this.$t('table.re_finish_date')
      }
    },
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
