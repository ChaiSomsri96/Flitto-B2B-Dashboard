<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('settle.list') }}
    </div>
    <el-card class="box-card search-box">
      <div class="top-filter-container">
        <div class="settle-option">
          <label>{{ $t('settle.base') }}</label>
          <el-select v-model="search.billing_type" @change="onBillingTypeChange">
            <el-option
              v-for="(item, i) in billingTypes"
              :key="i"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
        <div class="period">
          <label>{{ $t('caption.work_finish_time') }}</label>
          <el-select v-model="period" class="period-options" @change="onPeriodChange">
            <el-option
              v-for="(item, i) in periods"
              :key="i"
              :label="item"
              :value="i"
            >
            </el-option>
          </el-select>
          <el-date-picker
            v-model="monthRange"
            type="monthrange"
            range-separator="~"
            start-placeholder="2020-04"
            end-placeholder="2020-07"
            value-format="timestamp"
          >
          </el-date-picker>
        </div>
      </div>
      <div class="bottom-filter-container">
        <div v-if="search.billing_type <= 3" class="select-company">
          <label>{{ $t('user_type.company') }}</label>
          <el-select
            v-model="search.companies"
            filterable
            multiple
            :placeholder="$t('common.all')"
            @change="onCompanyChange"
          >
            <el-option
              v-for="item in companyList"
              :key="item.id"
              :label="item.company_name + '(' + item.user_id + ')'"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
        <div v-if="search.billing_type == 1 || search.billing_type == 3" class="select-requester">
          <label>{{ $t('user_type.requester') }}</label>
          <el-select
            v-model="search.requesters"
            multiple
            filterable
            :placeholder="$t('common.all')"
          >
            <el-option
              v-for="item in requesterList"
              :key="item.id"
              :label="item.user_name + '(' + item.user_id + ')'"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
        <div v-if="search.billing_type == 4" class="select-tc">
          <label class="mr10">{{ $t('user_type.tc') }}</label>
          <el-select
            v-model="search.workers"
            multiple
            filterable
            :placeholder="$t('common.all')"
          >
            <el-option
              v-for="item in tcList"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
        <div v-if="search.billing_type == 5" class="select-translator">
          <label class="mr10">{{ $t('user_type.translator') }}</label>
          <el-select
            v-model="search.workers"
            multiple
            filterable
            :placeholder="$t('common.all')"
          >
            <el-option
              v-for="item in translatorList"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
        <div v-if="search.billing_type == 6" class="select-reviewer">
          <label class="mr10">{{ $t('user_type.reviewer') }}</label>
          <el-select
            v-model="search.workers"
            multiple
            filterable
            :placeholder="$t('common.all')"
          >
            <el-option
              v-for="item in reviewerList"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>

        <div v-if="search.billing_type == 4 || search.billing_type == 5 || search.billing_type == 6" class="select-reviewer">
          <label>{{ $t('worker.tag') }}</label>
          <el-select
            v-model="search.tags"
            multiple
            filterable
            :placeholder="$t('common.select')"
          >
            <el-option
              v-for="item in tagList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>

        <div v-if="search.billing_type == 1 || search.billing_type == 2 || search.billing_type == 3" class="settle-option">
          <label>{{ $t('settle.settle_type') }}</label>
          <el-select v-model="search.settle_type">
            <el-option
              v-for="(item, i) in settleTypes"
              :key="i"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>

        <div>
          <el-button class="btn-search" type="primary" icon="el-icon-search" @click="handleFilter">
            {{ $t('common.search') }}
          </el-button>
        </div>
      </div>
    </el-card>
    <el-card class="box-card table-card">
      <label class="total-count">
        {{ $t('table.total_count', { total: total }) }}
      </label>
      <div class="table-header">
        <div>
        </div>
        <div class="table-header-actions">
          <el-button :loading="downloadLoading" type="primary" icon="el-icon-download" @click="handleDownload">
            {{ $t('common.excel_download') }}
          </el-button>
          <el-dropdown trigger="click">
            <span class="el-dropdown-link">
              <el-button class="filter-item btn-add" icon="el-icon-s-tools">
              </el-button>
            </span>
            <el-dropdown-menu slot="dropdown" class="column-control-dropdown">
              <div>{{ $t('common.column_control_desc') }}</div>
              <el-checkbox v-model="checkAllColumns" class="mt10" :indeterminate="isIndeterminate" @change="handleCheckAllColumnChange">
                {{ $t('common.all') }}
              </el-checkbox>
              <el-checkbox-group v-model="columnCheckVal" @change="handleCheckedColumnChange">
                <draggable
                  v-model="totalColumns"
                  class="list-group"
                  ghost-class="ghost"
                  @start="dragging = true"
                  @end="dragging = false"
                >
                  <el-checkbox v-for="(item, i) in totalColumns" :key="i" :label="item">
                    {{ $t('table.' + item) }}
                  </el-checkbox>
                </draggable>
              </el-checkbox-group>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
      <el-table
        ref="settleTable"
        :key="tableKey"
        v-loading="listLoading"
        :data="list"
        fit
        border
        highlight-current-row
        style="width: 100%;"
        :row-class-name="tableRowClassName"
        @header-click="onHeaderClick"
        @header-dragend="headerwidthChange"
      >
        <el-table-column
          :label="$t('table.no')"
          type="index"
          width="100"
          align="center"
          :index="indexMethod"
        >
        </el-table-column>
        <el-table-column
          v-for="(item, i) in tableColumnOptions"
          :key="item"
          :label="$t('table.' + item)"
          :width="columnWidths[item]"
          align="center"
          :prop="(i + 1).toString()"
        >
          <template slot="header" slot-scope="{column}">
            <span class="header-label">{{ column.label }}</span>
            <span class="header-sort-icons">
              <i class="el-icon-caret-top" :class="column.labelClassName"></i>
              <i class="el-icon-caret-bottom" :class="column.labelClassName"></i>
            </span>
          </template>
          <template slot-scope="{row, $index}">
            <template v-if="$index == 0">
              <span v-if="detailColumns.indexOf(item) > -1">
                -
              </span>
              <span v-else-if="item == 'month' || item == 'company'">
                -
              </span>
              <span v-else-if="item == 'complete_trans_number' || item == 'complete_work_number'">
                {{ row['total_complete_count'] | numberFormat }}
              </span>
              <span v-else-if="item == 'total_scene_length'">
                {{ formatDuration(row['total_duration_sum']) }}
              </span>
              <span v-else-if="item == 'usd_work_price_sum'">
                {{ '$' + row[item] | numberFormat }}
              </span>
              <span v-else-if="item == 'krw_work_price_sum'">
                {{ '₩' + row[item] | numberFormat }}
              </span>
              <span v-else-if="item == 'jpy_work_price_sum'">
                {{ '¥' + row[item] | numberFormat }}
              </span>
              <span v-else>
                {{ '$' + row[item] | numberFormat }}
              </span>
            </template>
            <template v-else>
              <div v-if="item == 'month'">
                <span>
                  {{ $t('settle.year_month', { year: row['year'], month: $i18n.locale == 'en' ? months[row['month'] - 1] : row['month'] }) }}
                </span>
                <i class="el-icon-document ml5" @click="goToCaption(row, 'month')"></i>
              </div>
              <div v-else-if="detailColumns.indexOf(item) > -1">
                <span>
                  {{ row.user_name }}({{ row.user_id }})
                </span>
                <i class="el-icon-document ml5" @click="goToCaption(row)"></i>
              </div>
              <div v-else-if="item == 'company'">
                <span>
                  {{ row.company_name }}({{ row.company_id }})
                </span>
                <i class="el-icon-document ml5" @click="goToCaption(row, 'company')"></i>
              </div>
              <span v-else-if="item == 'complete_trans_number' || item == 'complete_work_number'">
                {{ row['complete_count'] | numberFormat }}
              </span>
              <span v-else-if="item == 'total_scene_length'">
                {{ formatDuration(row['duration_sum']) }}
              </span>
              <span v-else-if="item == 'usd_work_price_sum'">
                {{ '$' + row[item] | numberFormat }}
              </span>
              <span v-else-if="item == 'krw_work_price_sum'">
                {{ '₩' + row[item] | numberFormat }}
              </span>
              <span v-else-if="item == 'jpy_work_price_sum'">
                {{ '¥' + row[item] | numberFormat }}
              </span>
              <span v-else>
                {{ '$' + row[item] | numberFormat }}
              </span>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="table.page"
        :limit.sync="table.page_length"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import list from '@/mixin/list'
import * as exportExcel from '@/utils/Export2Excel'

const defaultColumns = [
  'complete_trans_number',
  'total_scene_length',
  'usd_work_price_sum',
  'krw_work_price_sum',
  'jpy_work_price_sum',
  'total_work_price_sum',
  'tc_work_price_sum',
  'translate_work_price_sum',
  'review_work_price_sum'
]

const columnWidths = {
  month: 150,
  company: 220,
  requester: 220,
  tc: 280,
  translator: 280,
  reviewer: 280,
  complete_trans_number: 200,
  complete_work_number: 200,
  total_scene_length: 180,
  usd_work_price_sum: 160,
  krw_work_price_sum: 160,
  jpy_work_price_sum: 160,
  total_work_price_sum: 190,
  tc_work_price_sum: 180,
  translate_work_price_sum: 180,
  review_work_price_sum: 180,
  total_work_price: 180
}

const detailColumns = ['requester', 'tc', 'translator', 'reviewer']

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default {
  name: 'SettleAdminList',
  // middleware: ['auth', 'auth-admin'],
  middleware: ['auth', 'stats'],
  mixins: [list],
  async asyncData ({ $auth, $axios, params, error }) {
    try {
      const response = await $axios.post('/basic/get-table-info', { list_type: 'billing_list' })
      const { errorCode, data } = response.data
      if (errorCode !== 0) {
        const newArr = defaultColumns.map(item => item)
        newArr.unshift('month')
        const resp = await $axios.post('/basic/set-table-property', { columns: newArr, list_type: 'billing_list' })
        const { errorCode } = resp.data
        console.log(errorCode)
        return {
          totalColumns: newArr,
          tableColumnOptions: newArr,
          columnCheckVal: newArr,
          columnWidths
        }
      } else {
        const _columnWidths = columnWidths
        const _tableColumnOptions = []
        const _defaultColumns = defaultColumns.map(item => item)
        _defaultColumns.unshift('month')
        for (let i = 0; i < _defaultColumns.length; i++) {
          if (data[_defaultColumns[i]] !== undefined) {
            _tableColumnOptions.push(_defaultColumns[i])
            if (data[_defaultColumns[i]] !== 0) {
              _columnWidths[_defaultColumns[i]] = data[_defaultColumns[i]]
            }
          }
        }
        return {
          totalColumns: _defaultColumns,
          tableColumnOptions: _tableColumnOptions,
          columnCheckVal: _tableColumnOptions,
          columnWidths: _columnWidths
        }
      }
    } catch (error) {
    }
  },
  data () {
    return {
      list_type: 'billing_list',
      months,
      period: 2,
      periods: [
        this.$t('settle.this_month'),
        this.$t('settle.last_month'),
        this.$t('settle.recent_year'),
        this.$t('settle.this_year'),
        this.$t('settle.last_year'),
        this.$t('settle.all_time')
      ],
      detailColumns,
      monthRange: [],
      tagList: [],
      billingTypes: [
        { value: 1, label: this.$t('settle.monthly_integration') },
        { value: 2, label: this.$t('settle.by_company') },
        { value: 3, label: this.$t('settle.by_request') },
        { value: 4, label: this.$t('settle.by_tc') },
        { value: 5, label: this.$t('settle.by_translator') },
        { value: 6, label: this.$t('settle.by_reviewer') }
      ],
      settleTypes: [
        { value: 1, label: this.$t('settle.settle_type1') },
        { value: 2, label: this.$t('settle.settle_type2') }
      ],
      requesterList: [],
      companyList: [],
      tcList: [],
      translatorList: [],
      reviewerList: [],
      table: {
        page: 1,
        page_length: 20,
        order: -1
      },
      search: {
        billing_type: 1,
        settle_type: 1,
        requesters: [],
        companies: [],
        workers: [],
        start_year: '',
        start_month: '',
        end_year: '',
        end_month: '',
        tags: []
      } // ,
      // columnWidths
    }
  },
  computed: {
    ...mapGetters(['loggedUser'])
  },
  created () {
    this.setSettleRouteParams()
    if (this.$route.params.period === undefined && !this.$route.query.startDate) {
      // this.initTableColumnsByMonth()
      this.initDateRange()
    }
    this.getList()
    this.getCompanyList()
    this.getRequesterList()
    this.getWorkerList()
    this.getTags()
  },
  methods: {
    onCompanyChange () {
      this.getRequesterList()
    },
    async getTags () {
      const resp = await this.$axios.post('/worker/get-tags')
      this.tagList = resp.data.data
    },
    onHeaderClick (column, event) {
      if (this.table.order !== parseInt(column.property)) {
        this.table.order = parseInt(column.property)
      } else {
        this.table.order *= -1
      }
      const self = this
      this.$refs.settleTable.columns.forEach(function (c) {
        if (column.label === c.label) {
          c.labelClassName = self.table.order < 0 ? 'desc' : 'asc'
        }
      })
      // column.labelClassName = this.table.order < 0 ? 'desc' : 'asc'
      this.handleFilter()
    },
    setSettleRouteParams () {
      const routeParams = this.$route.params
      if (routeParams.billingType) {
        this.search.billing_type = this.$route.params.billingType
        if (routeParams.billingType === 2) {
          this.initTableColumnsByCompany()
        } else if (routeParams.billingType === 3) {
          this.initTableColumnsByRequester()
        }
      }
      if (routeParams.period !== undefined) {
        this.period = this.$route.params.period
        this.onPeriodChange()
      }
      if (routeParams.order !== undefined) {
        this.table.order = routeParams.order
      }
    },
    goToCaption (row, billingType = '') {
      let routeQuery = {}
      if (billingType === 'month') { // 월별
        const startDate = new Date(row.year, row.month - 1, 1).getTime()
        const endDate = new Date(row.year, row.month, 0).getTime()
        routeQuery = { dateType: 2, startDate, endDate, finishWorkType: 1 }
        if (this.search.requesters.length > 0) {
          routeQuery.requesters = JSON.stringify(this.search.requesters)
        }
        if (this.search.companies.length > 0) {
          routeQuery.companies = JSON.stringify(this.search.companies)
        }
      } else if (billingType === 'company') { // 고객사별
        routeQuery = {
          dateType: 2,
          finishWorkType: 1,
          company: row.company_no
        }
        if (this.monthRange && this.monthRange.length === 2) {
          routeQuery.startDate = this.monthRange[0]
          routeQuery.endDate = this.monthRange[1]
        }
      } else {
        routeQuery = {
          dateType: 2
        }
        if (this.monthRange && this.monthRange.length === 2) {
          routeQuery.startDate = this.monthRange[0]
          routeQuery.endDate = this.monthRange[1]
          routeQuery.finishWorkType = 1
        }
        if (this.search.billing_type === 3) {
          routeQuery.requester = row.user_no
          routeQuery.finishWorkType = 1
        } else if (this.search.billing_type === 4) {
          routeQuery.dateType = 4
          routeQuery.tc = row.user_no
          routeQuery.finishWorkType = 0
          routeQuery.status = ['tc_complete', 'translating', 'translation_complete', 'reviewing', 'review_complete', 'subtitle_apply', 'subtitle_apply_failed']
        } else if (this.search.billing_type === 5) {
          routeQuery.dateType = 5
          routeQuery.translator = row.user_no
          routeQuery.finishWorkType = 0
          routeQuery.status = ['translation_complete', 'reviewing', 'review_complete', 'subtitle_apply', 'subtitle_apply_failed']
        } else {
          routeQuery.dateType = 6
          routeQuery.reviewer = row.user_no
          routeQuery.finishWorkType = 0
          routeQuery.status = ['review_complete', 'subtitle_apply', 'subtitle_apply_failed']
        }
      }
      const routeData = this.$router.resolve({
        name: 'caption-list-admin',
        query: routeQuery
      })
      window.open(routeData.href, '_blank')
    },
    async setTableProperty (newArr) {
      try {
        const response = await this.$axios.post('/basic/get-table-info', { list_type: this.list_type })
        const { errorCode, data } = response.data

        if (errorCode !== 0) {
          const resp = await this.$axios.post('/basic/set-table-property', { columns: newArr, list_type: this.list_type })
          const { errorCode } = resp.data
          console.log(errorCode)
          this.totalColumns = newArr
          this.tableColumnOptions = newArr
          this.columnCheckVal = newArr
          this.columnWidths = columnWidths
        } else {
          const _columnWidths = columnWidths
          const _tableColumnOptions = []
          for (let i = 0; i < newArr.length; i++) {
            if (data[newArr[i]] !== undefined) {
              _tableColumnOptions.push(newArr[i])
              if (data[newArr[i]] !== 0) {
                _columnWidths[newArr[i]] = data[newArr[i]]
              }
            }
          }
          this.totalColumns = newArr
          this.tableColumnOptions = _tableColumnOptions
          this.columnCheckVal = _tableColumnOptions
          this.columnWidths = _columnWidths
        }
      } catch (error) {
      }
    },
    initTableColumnsByMonth () {
      const newArr = defaultColumns.map(item => item)
      newArr.unshift('month')
      /*
      this.totalColumns = newArr
      this.tableColumnOptions = newArr
      this.columnCheckVal = newArr
      */
      this.setTableProperty(newArr)
    },
    initTableColumnsByCompany () {
      const newArr = defaultColumns.map(item => item)
      newArr.unshift('company')
      /*
      this.totalColumns = newArr
      this.tableColumnOptions = newArr
      this.columnCheckVal = newArr */
      this.setTableProperty(newArr)
    },
    initTableColumnsByRequester () {
      const newArr = defaultColumns.map(item => item)
      newArr.unshift('company', 'requester')

      /*
      this.totalColumns = newArr
      this.tableColumnOptions = newArr
      this.columnCheckVal = newArr */
      this.setTableProperty(newArr)
    },
    initTableColumnsByWorker () {
      const columns = [
        'complete_work_number',
        'total_scene_length',
        'work_price_sum'
      ]
      if (this.search.billing_type === 4) {
        columns.unshift('tc')
      } else if (this.search.billing_type === 5) {
        columns.unshift('translator')
      } else {
        columns.unshift('reviewer')
      }
      this.setTableProperty(columns)
      /*
      this.totalColumns = columns
      this.tableColumnOptions = columns
      this.columnCheckVal = columns */
    },
    indexMethod (index) {
      if (index === 0) {
        return this.$t('table.sum')
      }
      return this.total - ((this.table.page - 1) * this.table.page_length + index) + 1 // descending order
    },
    onBillingTypeChange () {
      if (this.search.billing_type !== 1) {
        this.period = 0
      } else {
        this.period = 2
      }
      this.onPeriodChange()
      this.search.workers = []
      this.search.companies = []
      this.search.requesters = []
    },
    handleFilter () {
      switch (this.search.billing_type) {
        case 1:
          this.list_type = 'billing_list'
          break
        case 2:
          this.list_type = 'billing_list1'
          break
        case 3:
          this.list_type = 'billing_list2'
          break
        case 4:
          this.list_type = 'billing_list3'
          break
        case 5:
          this.list_type = 'billing_list4'
          break
        case 6:
          this.list_type = 'billing_list5'
          break
      }
      switch (this.search.billing_type) {
        case 1: // 월별통합
          this.initTableColumnsByMonth()
          break
        case 2: // 고객사별
          this.initTableColumnsByCompany()
          break
        case 3: // 요청자별
          this.initTableColumnsByRequester()
          break
        default: // 작업자별
          this.initTableColumnsByWorker()
          break
      }
      this.table.page = 1
      this.getList()
    },
    async handleDownload () {
      this.downloadLoading = true
      const tHeader = [this.$t('table.no')]
      const filterVal = ['no']
      for (let i = 0; i < this.tableColumnOptions.length; i++) {
        tHeader.push(this.$t('table.' + this.tableColumnOptions[i]))
        filterVal.push(this.tableColumnOptions[i])
      }
      const data = await this.formatJson(filterVal)
      exportExcel.exportJsonToExcel({
        header: tHeader,
        data,
        filename: 'settlement_management'
      })
      this.downloadLoading = false
    },
    async formatJson (filterVal) {
      const searchParams = Object.assign({}, this.search)
      if (this.monthRange && this.monthRange.length === 2) {
        const startDate = new Date(this.monthRange[0])
        const endDate = new Date(this.monthRange[1])
        searchParams.start_year = startDate.getFullYear()
        searchParams.start_month = startDate.getMonth() + 1
        searchParams.end_year = endDate.getFullYear()
        searchParams.end_month = endDate.getMonth() + 1
      }
      if (this.search.companies.length === 0) {
        delete searchParams.companies
      }
      if (this.search.requesters.length === 0) {
        delete searchParams.requesters
      }
      if (this.search.workers.length === 0) {
        delete searchParams.workers
      }
      try {
        const response = await this.$axios.post('/billing/get-admin-billing-data ', {
          search: searchParams
        })
        this.excelList = response.data.data.list
      } catch (err) {
        this.excelList = []
      }

      const totalCount = this.excelList.length

      return this.excelList.map((v, index) => filterVal.map((j) => {
        if (j === 'no') {
          return (totalCount - index)
        } else if (j === 'month') {
          return this.$t('settle.year_month', { year: v.year, month: this.$i18n.locale === 'en' ? this.months[v.month - 1] : v.month })
        } else if (this.detailColumns.includes(j)) {
          return v.user_name + '(' + v.user_id + ')'
        } else if (j === 'company') {
          return v.company_name + '(' + v.company_id + ')'
        } else if (j === 'complete_trans_number' || j === 'complete_work_number') {
          return this.$options.filters.numberFormat(v.complete_count)
        } else if (j === 'total_scene_length') {
          return this.formatDuration(v.duration_sum)
        } else if (j === 'usd_work_price_sum') {
          return '$' + this.$options.filters.numberFormat(v[j])
        } else if (j === 'krw_work_price_sum') {
          return '₩' + this.$options.filters.numberFormat(v[j])
        } else if (j === 'jpy_work_price_sum') {
          return '¥' + this.$options.filters.numberFormat(v[j])
        } else {
          return '$' + this.$options.filters.numberFormat(v[j])
        }
      }))
    },
    async getRequesterList () {
      try {
        let resp
        if (this.search.companies.length === 0) { resp = await this.$axios.post('/requester/get-requester-list') } else {
          resp = await this.$axios.post('/requester/get-requester-list', {
            search: { company_ids: this.search.companies }
          })
        }
        const { errorCode, data } = resp.data
        if (errorCode === 0) {
          this.requesterList = data.list
        } else {
          this.requesterList = []
        }
      } catch (err) {
        this.requesterList = []
      }
    },
    async getCompanyList () {
      try {
        const resp = await this.$axios.post('/company/get-company-list')
        const { errorCode, data } = resp.data
        if (errorCode === 0) {
          this.companyList = data.list
        } else {
          this.companyList = []
        }
      } catch (err) {
        this.companyList = []
      }
    },
    async getWorkerList () {
      try {
        const resp = await this.$axios.post('/worker/get-worker-list')
        const { errorCode, data } = resp.data
        if (errorCode === 0) {
          if (data.list.length === 0) {
            this.tcList = this.translatorList = this.reviewerList = []
          } else {
            data.list.map((item) => {
              if (item.user_type === 'tc') {
                this.tcList.push({
                  id: item.id,
                  label: item.user_name + '(' + item.user_id + ')'
                })
              } else if (item.user_type === 'translator') {
                this.translatorList.push({
                  id: item.id,
                  label: item.user_name + '(' + item.user_id + ')'
                })
              } else {
                this.reviewerList.push({
                  id: item.id,
                  label: item.user_name + '(' + item.user_id + ')'
                })
              }
            })
          }
        } else {
        }
      } catch (err) {
      }
    },
    initDateRange () {
      const curDate = new Date()
      const endDate = curDate.getTime()
      const startDate = curDate.setFullYear(curDate.getFullYear() - 1, curDate.getMonth(), 1)
      this.monthRange.push(startDate, endDate)
    },
    onPeriodChange () {
      this.monthRange = []
      if (this.period === 5) {
        return
      }
      const curDate = new Date()
      let startDate
      let endDate = curDate.getTime()
      switch (this.period) {
        case 0:
          startDate = curDate.setMonth(curDate.getMonth(), 1) // this month
          break
        case 1:
          startDate = new Date(curDate.getFullYear(), curDate.getMonth() - 1, 1).getTime() // last month
          endDate = new Date(curDate.getFullYear(), curDate.getMonth(), 0).getTime()
          break
        case 2:
          startDate = curDate.setFullYear(curDate.getFullYear() - 1, curDate.getMonth(), 1) // recent year
          break
        case 3:
          startDate = curDate.setMonth(0, 1) // this year
          break
        case 4:
          startDate = new Date(curDate.getFullYear() - 1, 0, 1).getTime() // last year
          endDate = new Date(curDate.getFullYear() - 1, 11, 31).getTime() // 31 December
          break
        default:
          break
      }
      this.monthRange.push(startDate, endDate)
    },
    tableRowClassName ({ row, rowIndex }) {
      if (rowIndex === 0) {
        return 'sum-row'
      }
      if (row.status === 1) {
        return 'waiting-row'
      }
      return 'odd-row'
    },
    async getList () {
      this.listLoading = true

      const searchParams = Object.assign({}, this.search)
      if (this.monthRange && this.monthRange.length === 2) {
        const startDate = new Date(this.monthRange[0])
        const endDate = new Date(this.monthRange[1])
        searchParams.start_year = startDate.getFullYear()
        searchParams.start_month = startDate.getMonth() + 1
        searchParams.end_year = endDate.getFullYear()
        searchParams.end_month = endDate.getMonth() + 1
      }
      if (this.search.companies.length === 0) {
        delete searchParams.companies
      }
      if (this.search.requesters.length === 0) {
        delete searchParams.requesters
      }
      if (this.search.workers.length === 0) {
        delete searchParams.workers
      }
      try {
        const response = await this.$axios.post('/billing/get-admin-billing-data', {
          table: this.table,
          search: searchParams
        })
        this.list = response.data.data.list
        if (this.search.billing_type <= 3) {
          this.list.unshift({
            total_complete_count: response.data.data._complete_count,
            total_duration_sum: response.data.data._duration_sum,
            jpy_work_price_sum: response.data.data._jpy_work_price_sum,
            krw_work_price_sum: response.data.data._krw_work_price_sum,
            usd_work_price_sum: response.data.data._usd_work_price_sum,
            total_work_price_sum: response.data.data._total_work_price_sum,
            tc_work_price_sum: response.data.data._tc_work_price_sum,
            translate_work_price_sum: response.data.data._translate_work_price_sum,
            review_work_price_sum: response.data.data._review_work_price_sum
          })
        } else {
          this.list.unshift({
            total_complete_count: response.data.data._complete_count,
            total_duration_sum: response.data.data._duration_sum,
            work_price_sum: response.data.data._work_price_sum
          })
        }
        this.total = response.data.data.totalCount
      } catch {
        this.list = []
        this.total = 0
      }
      this.listLoading = false
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
.top-filter-container {
  .settle-option {
    .el-select {
      width: 160px;
    }
  }
  .period {
    .el-select {
      width: 120px;
      margin-right: 5px;
    }
  }
  .select-requester {
    .el-select {
      width: 200px;
    }
  }
}
.bottom-filter-container {
  & > div {
    display: inline-flex;
    align-items: center;
    margin-right: 30px;
  }
  .select-requester,
  .select-company,
  .select-translator,
  .select-tc,
  .select-reviewer {
    .el-select {
      width: 300px;
    }
  }
}
.column-control-dropdown {
  div:first-child {
    max-width: 300px;
  }
}
.el-icon-document {
  vertical-align: middle;
  font-size: 20px;
  color: $blue40;
}
.header-label {
  vertical-align: middle;
}
.header-sort-icons {
  display: inline-flex;
  flex-direction: column;
  i {
    line-height: 0.5;
  }
  .el-icon-caret-top.asc {
    color: blue;
  }
  .el-icon-caret-bottom.desc {
    color: blue;
  }
}
</style>
