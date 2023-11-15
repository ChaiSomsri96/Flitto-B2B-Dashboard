<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('settle.list') }}
    </div>
    <el-card class="box-card search-box">
      <div class="top-filter-container">
        <div v-if="$auth.user.user_type == 2 || $auth.user.user_type == 7" class="settle-option">
          <label>{{ $t('settle.base') }}</label>
          <el-select
            v-model="search.billing_type"
            @change="onBillingTypeChange"
          >
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
          <el-select
            v-model="period"
            class="period-options"
            @change="onPeriodChange"
          >
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
        <div v-if="$auth.user.user_type == 2 || $auth.user.user_type == 7" class="select-requester">
          <label>{{ $t('caption.choose_requester') }}</label>
          <el-select
            v-model="search.requesters"
            multiple
            filterable
            :placeholder="$t('common.select')"
          >
            <el-option
              v-for="item in requesterList"
              :key="item.id"
              :label="item.user_name"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
        <div>
          <el-button
            class="filter-item btn-search"
            type="primary"
            icon="el-icon-search"
            @click="handleFilter"
          >
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
        <div></div>
        <div class="table-header-actions">
          <el-button
            :loading="downloadLoading"
            type="primary"
            icon="el-icon-download"
            @click="handleDownload"
          >
            {{ $t('common.excel_download') }}
          </el-button>
          <el-dropdown trigger="click">
            <span class="el-dropdown-link">
              <el-button class="filter-item btn-add" icon="el-icon-s-tools">
              </el-button>
            </span>
            <el-dropdown-menu slot="dropdown" class="column-control-dropdown">
              <div>{{ $t('common.column_control_desc') }}</div>
              <el-checkbox
                v-model="checkAllColumns"
                class="mt10"
                :indeterminate="isIndeterminate"
                @change="handleCheckAllColumnChange"
              >
                {{ $t('common.all') }}
              </el-checkbox>
              <el-checkbox-group
                v-model="columnCheckVal"
                @change="handleCheckedColumnChange"
              >
                <draggable
                  v-model="totalColumns"
                  class="list-group"
                  ghost-class="ghost"
                  @start="dragging = true"
                  @end="dragging = false"
                >
                  <el-checkbox
                    v-for="(item, i) in totalColumns"
                    :key="i"
                    :label="item"
                  >
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
          width="80"
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
          <template slot="header" slot-scope="{ column }">
            <span class="header-label">{{ column.label }}</span>
            <span class="header-sort-icons">
              <i class="el-icon-caret-top" :class="column.labelClassName"></i>
              <i
                class="el-icon-caret-bottom"
                :class="column.labelClassName"
              ></i>
            </span>
          </template>
          <template slot-scope="{ row, $index }">
            <div v-if="$index == 0">
              <span
                v-if="
                  item == 'complete_trans_number' ||
                    item == 'complete_work_number'
                "
              >
                {{ row['total_complete_count'] | numberFormat }}
              </span>
              <span v-else-if="item == 'total_scene_length'">
                {{ formatDuration(row['total_duration_sum']) }}
              </span>
              <span v-else-if="item == 'total_work_price'">
                {{ ('$' + row['total_work_price_sum']) | numberFormat }}
              </span>
              <span v-else-if="item == 'trans_amount'">
                {{
                  (currencySymbols[$auth.user.currency_type] +
                    row['total_work_price_sum'])
                    | numberFormat
                }}
              </span>
              <span v-else>
                -
              </span>
            </div>
            <div v-else>
              <div v-if="item == 'month'">
                <span>
                  {{
                    $t('settle.year_month', {
                      year: row['year'],
                      month:
                        $i18n.locale == 'en'
                          ? months[row['month'] - 1]
                          : row['month']
                    })
                  }}
                </span>
                <i
                  class="el-icon-document ml5"
                  @click="goToCaption(row, 'month')"
                ></i>
              </div>
              <span v-else-if="item == 'requester'">
                {{ row['user_name'] }}({{ row['user_id'] }})
                <i
                  class="el-icon-document ml5"
                  @click="goToCaption(row, 'requester')"
                ></i>
              </span>
              <span
                v-else-if="
                  item == 'complete_trans_number' ||
                    item == 'complete_work_number'
                "
              >
                {{ row['complete_count'] | numberFormat }}
              </span>
              <span v-else-if="item == 'total_scene_length'">
                {{ formatDuration(row['duration_sum']) }}
              </span>
              <span v-else-if="item == 'trans_amount'">
                {{
                  (currencySymbols[$auth.user.currency_type] +
                    row['work_price_sum'])
                    | numberFormat
                }}
              </span>
              <span v-else-if="item == 'total_work_price'">
                {{ ('$' + row['work_price_sum']) | numberFormat }}
              </span>
            </div>
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
import list from '@/mixin/list'
import * as exportExcel from '@/utils/Export2Excel'

const defaultColumns1 = [
  'month',
  'complete_trans_number',
  'total_scene_length',
  'trans_amount'
]

const defaultColumns2 = [
  'month',
  'complete_work_number',
  'total_scene_length',
  'total_work_price'
]

const columnWidths = {
  month: 0,
  complete_trans_number: 0,
  total_scene_length: 0,
  trans_amount: 0,
  total_work_price: 0,
  complete_work_number: 0,
  requester: 0
}

const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

export default {
  // middleware: ['auth', 'auth-other'],
  middleware: ['auth', 'stats'],
  mixins: [list],
  async asyncData ({ $auth, $axios, params, error }) {
    try {
      const response = await $axios.post('/basic/get-table-info', { list_type: 'billing_list' })
      const { errorCode, data } = response.data

      if (errorCode !== 0) {
        let _defaultColumns
        if ($auth.user.user_type === 2 || $auth.user.user_type === 3 || $auth.user.user_type === 7) {
          _defaultColumns = defaultColumns1
        } else if ($auth.user.user_type === 4 || $auth.user.user_type === 5 || $auth.user.user_type === 6) {
          _defaultColumns = defaultColumns2
        }
        const resp = await $axios.post('/basic/set-table-property', { columns: _defaultColumns, list_type: 'billing_list' })
        const { errorCode } = resp.data
        console.log(errorCode)
        return {
          totalColumns: _defaultColumns,
          tableColumnOptions: _defaultColumns,
          columnCheckVal: _defaultColumns,
          columnWidths
        }
      } else {
        let _defaultColumns
        const _columnWidths = columnWidths
        const _tableColumnOptions = []
        if ($auth.user.user_type === 2 || $auth.user.user_type === 3 || $auth.user.user_type === 7) {
          _defaultColumns = defaultColumns1
        } else if ($auth.user.user_type === 4 || $auth.user.user_type === 5 || $auth.user.user_type === 6) {
          _defaultColumns = defaultColumns2
        }
        for (let i = 0; i < _defaultColumns.length; i++) {
          if (data[_defaultColumns[i]] !== undefined) {
            _tableColumnOptions.push(_defaultColumns[i])
            // if (data[_defaultColumns[i]] !== 0) {
            _columnWidths[_defaultColumns[i]] = data[_defaultColumns[i]]
            // }
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
      console.log(error)
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
      monthRange: [],
      billingTypes: [
        { value: 1, label: this.$t('settle.monthly_integration') },
        { value: 2, label: this.$t('settle.by_request') }
      ],
      requesterList: [],
      table: {
        page: 1,
        page_length: 10,
        order: -1
      },
      search: {
        billing_type: 1, // 1:월별(통합), 2: 요청자별
        start_year: '',
        start_month: '',
        end_year: '',
        end_month: '',
        requesters: []
      }
    }
  },
  created () {
    /*
    if (this.$auth.user.user_type === 2 || this.$auth.user.user_type === 3 || this.$auth.user.user_type === 7) {
      this.totalColumns = defaultColumns1
      this.columnCheckVal = defaultColumns1
      this.tableColumnOptions = defaultColumns1
    }
    if (
      this.$auth.user.user_type === 4 ||
      this.$auth.user.user_type === 5 ||
      this.$auth.user.user_type === 6
    ) {
      this.totalColumns = defaultColumns2
      this.columnCheckVal = defaultColumns2
      this.tableColumnOptions = defaultColumns2
    }
    */

    this.setSettleRouteParams()
    if (
      this.$route.params.period === undefined &&
      !this.$route.query.startDate
    ) {
      this.initDateRange()
    }
    if (this.$auth.user.user_type === 1 || this.$auth.user.user_type === 2 || this.$auth.user.user_type === 7) {
      this.getRequesterList()
    }
    this.getList()
  },
  methods: {
    setSettleRouteParams () {
      const routeParams = this.$route.params
      if (routeParams.billingType) {
        this.search.billing_type = this.$route.params.billingType
        if (routeParams.billingType === 2) {
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
      if (routeParams.requester !== undefined) {
        this.search.requesters.push(routeParams.requester)
      }
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
              // if (data[newArr[i]] !== 0) {
              _columnWidths[newArr[i]] = data[newArr[i]]
              // }
            }
          }
          this.totalColumns = newArr
          this.tableColumnOptions = _tableColumnOptions
          this.columnCheckVal = _tableColumnOptions
          this.columnWidths = _columnWidths
        }
      } catch (error) {
        console.log(error)
      }
    },
    initTableColumnsByMonth () {
      /*
      this.totalColumns = defaultColumns1
      this.tableColumnOptions = defaultColumns1
      this.columnCheckVal = defaultColumns1 */
      this.setTableProperty(defaultColumns1)
    },
    initTableColumnsByRequester () {
      const newArr = defaultColumns1.map(item => item)
      newArr.splice(0, 1)
      newArr.unshift('requester')
      /*
      this.totalColumns = newArr
      this.tableColumnOptions = newArr
      this.columnCheckVal = newArr */
      this.setTableProperty(newArr)
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
    onBillingTypeChange () {
      if (this.search.billing_type === 1) {
        this.period = 2
      } else {
        this.period = 0
      }
      this.onPeriodChange()
    },
    indexMethod (index) {
      if (index === 0) {
        return this.$t('table.sum')
      }
      return (
        this.total -
        ((this.table.page - 1) * this.table.page_length + index) +
        1
      ) // descending order
    },
    handleFilter () {
      if (this.$auth.user.user_type === 2 || this.$auth.user.user_type === 7) {
        if (this.search.billing_type === 1) { this.list_type = 'billing_list' } else if (this.search.billing_type === 2) { this.list_type = 'billing_list1' }

        switch (this.search.billing_type) {
          case 1: // 월별통합
            this.initTableColumnsByMonth()
            break
          case 2: // 요청자별
            this.initTableColumnsByRequester()
            break
          default:
            break
        }
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
      let apiRoute = ''
      let response = null
      if (this.$auth.user.user_type === 2 || this.$auth.user.user_type === 7) {
        apiRoute = '/billing/get-company-billing-data'
      } else if (
        this.$auth.user.user_type === 3 ||
        this.$auth.user.user_type === 4
      ) {
        delete searchParams.billing_type
        delete searchParams.requesters
        apiRoute = '/billing/get-billing-data'
      } else {
        delete searchParams.billing_type
        delete searchParams.requesters
        apiRoute = '/billing/get-worker-billing-data'
      }
      try {
        response = await this.$axios.post(apiRoute, {
          search: searchParams
        })
        this.excelList = response.data.data.list
      } catch (err) {
        this.excelList = []
      }

      const totalCount = this.excelList.length

      return this.excelList.map((v, index) =>
        filterVal.map((j) => {
          if (j === 'no') {
            return (totalCount - index)
          } else if (j === 'month') {
            if (v.year) {
              return this.$t('settle.year_month', {
                year: v.year,
                month:
                  this.$i18n.locale === 'en'
                    ? this.months[v.month - 1]
                    : v.month
              })
            }
            if (v.user_name) {
              return v.user_name + '(' + v.user_id + ')'
            }
          } else if (
            j === 'complete_trans_number' ||
            j === 'complete_work_number'
          ) {
            return this.$options.filters.numberFormat(v.complete_count)
          } else if (j === 'total_scene_length') {
            return this.formatDuration(v.duration_sum)
          } else if (j === 'trans_amount') {
            return (
              this.currencySymbols[this.$auth.user.currency_type] +
              this.$options.filters.numberFormat(v.work_price_sum)
            )
          } else if (j === 'total_work_price') {
            return '$' + this.$options.filters.numberFormat(v.work_price_sum)
          } else {
            return v[j]
          }
        })
      )
    },
    async getRequesterList () {
      try {
        const resp = await this.$axios.post('/requester/get-requester-list')
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
    initDateRange () {
      const curDate = new Date()
      const endDate = curDate.getTime()
      const startDate = curDate.setFullYear(
        curDate.getFullYear() - 1,
        curDate.getMonth(),
        1
      )
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
          startDate = new Date(
            curDate.getFullYear(),
            curDate.getMonth() - 1,
            1
          ).getTime() // last month
          endDate = new Date(
            curDate.getFullYear(),
            curDate.getMonth(),
            0
          ).getTime()
          break
        case 2:
          startDate = curDate.setFullYear(
            curDate.getFullYear() - 1,
            curDate.getMonth(),
            1
          ) // recent year
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
    sortChange (data) {
      const { prop, order } = data
      if (order === 'ascending') {
        this.table.sort = '+' + prop
      } else {
        this.table.sort = '-' + prop
      }
      this.handleFilter()
    },
    goToCaption (row, billingType) {
      let routePath = ''
      let routeQuery = {}
      if (billingType === 'month') {
        const startDate = new Date(row.year, row.month - 1, 1).getTime()
        const endDate = new Date(row.year, row.month, 0).getTime()

        routeQuery = { dateType: 2, startDate, endDate }

        if (
          this.$auth.user.user_type === 2 ||
          this.$auth.user.user_type === 3 ||
          this.$auth.user.user_type === 7
        ) {
          routePath = 'caption/list/company'
          routeQuery.finishWorkType = 1
          if (this.search.requesters.length > 0) {
            routeQuery.requesters = JSON.stringify(this.search.requesters)
          }
        }
        let workStatus = ''
        if (this.$auth.user.user_type > 3 && this.$auth.user.user_type < 7) {
          routePath = 'caption/list/worker'
          switch (this.$auth.user.user_type) {
            case 4:
              workStatus = 'tc_complete'
              break
            case 5:
              workStatus = 'translation_complete'
              break
            case 6:
              workStatus = 'review_complete'
              break
          }
          routeQuery.status = workStatus
          routeQuery.dateType = 3
        }
      } else {
        routePath = 'caption/list/company'
        routeQuery = {
          dateType: 2,
          finishWorkType: 1,
          requester: row.user_no
        }
        if (this.monthRange && this.monthRange.length === 2) {
          routeQuery.startDate = this.monthRange[0]
          routeQuery.endDate = this.monthRange[1]
        }
      }
      const routeData = this.$router.resolve({
        path: routePath,
        query: routeQuery
      })
      window.open(routeData.href, '_blank')
    },
    async getList () {
      this.listLoading = true
      // eslint-disable-next-line camelcase
      const searchParams = Object.assign({}, this.search)
      if (this.monthRange && this.monthRange.length === 2) {
        const startDate = new Date(this.monthRange[0])
        const endDate = new Date(this.monthRange[1])
        searchParams.start_year = startDate.getFullYear()
        searchParams.start_month = startDate.getMonth() + 1
        searchParams.end_year = endDate.getFullYear()
        searchParams.end_month = endDate.getMonth() + 1
      }
      let apiRoute = ''
      let response = null
      if (this.$auth.user.user_type === 2 || this.$auth.user.user_type === 7) {
        apiRoute = '/billing/get-company-billing-data'
      } else if (
        this.$auth.user.user_type === 3 ||
        this.$auth.user.user_type === 4
      ) {
        delete searchParams.billing_type
        delete searchParams.requesters
        apiRoute = '/billing/get-billing-data'
      } else {
        delete searchParams.billing_type
        delete searchParams.requesters
        apiRoute = '/billing/get-worker-billing-data'
      }
      try {
        response = await this.$axios.post(apiRoute, {
          table: this.table,
          search: searchParams
        })
        this.list = response.data.data.list
        this.list.unshift({
          total_complete_count: response.data.data.total_complete_count,
          total_duration_sum: response.data.data.total_duration_sum,
          total_work_price_sum: response.data.data.total_work_price_sum
        })
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
/* Search box on the header */
.top-filter-container {
  .settle-option {
    .el-select {
      width: 150px;
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
.column-control-dropdown {
  div:first-child {
    max-width: 300px;
  }
}
.table-card {
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
}
</style>
