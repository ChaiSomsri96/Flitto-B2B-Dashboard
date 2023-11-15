<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('requester.list') }}
    </div>
    <el-card class="box-card search-box">
      <div class="top-filter-container">
        <div v-if="$auth.user.user_type == 1" class="company">
          <label>{{ $t('requester.company') }}</label>
          <el-select
            v-model="company_ids"
            multiple
            filterable
            :placeholder="$t('common.select')"
            :filter-method="companyFilterMethod"
          >
            <el-option
              v-for="item in companyFilterOptions"
              :key="item.id"
              :label="item.company_name"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
        <search-filter-item
          :sel-preset="search.keyword_type"
          :search-fields="searchFields"
          :search-word="search.search_keyword"
          :option1="$t('common.include')"
          :option2="$t('common.match')"
          @searchWordChanged="searchWordChanged"
          @optionChanged="optionChanged"
          @handleSearch="handleFilter"
          @keywordTypeChanged="keywordTypeChanged"
        >
        </search-filter-item>
        <div v-if="$auth.user.user_type == 2 || $auth.user.user_type == 7" class="free-req-count">
          <input-filter-range
            :start-value="search.free_req_cnt_start"
            :end-value="search.free_req_cnt_end"
            :label="$t('requester.free_req_count')"
            @minValChanged="minFreeReqCntChange"
            @maxValChanged="maxFreeReqCntChange"
          />
        </div>
      </div>
      <div class="bottom-filter-container">
        <div class="account-sale">
          <input-filter-range
            v-if="$auth.user.user_type == 1"
            :start-value="search.discount_start"
            :end-value="search.discount_end"
            :label="$t('requester.account_sale')"
            :option-list="currencyList"
            :pre-option="search.discount_currency_type"
            :select-placeholder="$t('placeholder.currency_type')"
            @minValChanged="minDiscountChange"
            @maxValChanged="maxDiscountChange"
            @selectChanged="discountCurrencyChange"
          />
          <input-filter-range
            v-if="$auth.user.user_type == 2 || $auth.user.user_type === 7"
            :start-value="search.discount_start"
            :end-value="search.discount_end"
            :currency-type="currencySymbols[$auth.user.currency_type]"
            :label="$t('requester.account_sale')"
            @minValChanged="minDiscountChange"
            @maxValChanged="maxDiscountChange"
          />
        </div>
        <div class="request-count">
          <input-filter-range
            :start-value="search.total_request_numbers_start"
            :end-value="search.total_request_numbers_end"
            :label="$t('common.request_count')"
            class="request-count"
            @minValChanged="startReqCntChange"
            @maxValChanged="endReqCntChange"
          />
        </div>
        <div class="trans-amount">
          <input-filter-range
            v-if="$auth.user.user_type == 1"
            :start-value="search.total_translate_price_start"
            :end-value="search.total_translate_price_end"
            :label="$t('common.trans_amount')"
            :option-list="currencyList"
            :pre-option="search.translate_currency_type"
            :select-placeholder="$t('placeholder.currency_type')"
            @minValChanged="minTransAmtChange"
            @maxValChanged="maxTransAmtChange"
            @selectChanged="transAmtCurrencyChange"
          />
          <input-filter-range
            v-if="$auth.user.user_type == 2 || $auth.user.user_type == 7"
            :start-value="search.total_translate_price_start"
            :end-value="search.total_translate_price_end"
            :currency-type="currencySymbols[$auth.user.currency_type]"
            :label="$t('common.trans_amount')"
            @minValChanged="minTransAmtChange"
            @maxValChanged="maxTransAmtChange"
          />
        </div>
        <div class="mr20">
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
      <div
        class="table-header"
        :class="{ 'cant-delete': ($auth.user.user_type == 2 || $auth.user.user_type == 7) }"
      >
        <i
          v-if="$auth.user.user_type == 1"
          class="el-icon-delete"
          @click="delRequesters"
        ></i>
        <div class="table-header-actions">
          <el-button
            class="filter-item btn-add"
            type="primary"
            icon="el-icon-plus"
            @click="goToCreatePage"
          >
            {{ $t('requester.new_account') }}
          </el-button>
          <el-button
            :loading="downloadLoading"
            class="btn-excel-download"
            type="primary"
            icon="el-icon-download"
            @click="handleDownload"
          >
            {{ $t('common.excel_download') }}
          </el-button>
          <el-dropdown trigger="click">
            <span class="el-dropdown-link">
              <el-button class="filter-item" icon="el-icon-s-tools">
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
        :key="tableKey"
        v-loading="listLoading"
        :data="list"
        fit
        border
        highlight-current-row
        style="width: 100%;"
        :row-class-name="tableRowClassName"
        @sort-change="sortChange"
        @selection-change="handleSelectionChange"
        @header-dragend="headerwidthChange"
      >
        <el-table-column
          type="selection"
          width="55"
          align="center"
        ></el-table-column>
        <el-table-column
          :label="$t('table.no')"
          type="index"
          sortable="custom"
          width="80"
          :class-name="getSortClass('id')"
          align="center"
          :index="indexMethod"
        >
        </el-table-column>
        <el-table-column :label="$t('table.detail')" width="80" align="center">
          <template slot-scope="{ row }">
            <el-button
              size="mini"
              icon="el-icon-document"
              class="btn-detail"
              @click="viewDetail(row)"
            >
            </el-button>
          </template>
        </el-table-column>
        <template v-if="$auth.user.user_type == 1">
          <el-table-column
            v-for="item in tableColumnOptions"
            :key="item"
            :label="$t('table.' + item)"
            :width="columnWidths[item]"
            :prop="item"
            align="center"
          >
            <template slot-scope="scope">
              <span v-if="item == 'reg_date'">{{
                scope.row[item] | date
              }}</span>
              <span v-else-if="item == 'total_request_numbers'">
                {{ scope.row[item] != 0 && scope.row[item] != '' && scope.row[item] != null ? scope.row[item] : '-' }}
              </span>
              <span v-else-if="item == 'discount'">{{
                scope.row[item] > 0
                  ? currencySymbols[scope.row.currency_type] +
                    scope.row[item] +
                    '/min'
                  : '-'
              }}</span>
              <span
                v-else-if="
                  ( item == 'total_translate_price_JPY' ||
                    item == 'total_translate_price_KRW' ||
                    item == 'total_translate_price_USD' ) && scope.row[item] > 0
                "
              >
                {{ (currencySymbols[scope.row.currency_type] + scope.row[item]) | numberFormat }}
              </span>
              <span
                v-else-if="
                  ( item == 'total_translate_price_JPY' ||
                    item == 'total_translate_price_KRW' ||
                    item == 'total_translate_price_USD' ) && scope.row[item] <= 0
                "
              >
                -
              </span>
              <span v-else>{{ scope.row[item] ? scope.row[item] : '-' }}</span>
            </template>
          </el-table-column>
        </template>
        <template v-if="$auth.user.user_type == 2 || $auth.user.user_type == 7">
          <el-table-column
            v-for="item in tableCompColumnOptions"
            :key="item"
            :label="$t('table.' + item)"
            :width="compColumnWidths[item]"
            :prop="item"
            align="center"
          >
            <template slot-scope="scope">
              <span v-if="item == 'reg_date'">{{
                scope.row[item] | date
              }}</span>
              <span v-else-if="item == 'discount'">{{
                scope.row[item] > 0 ? currencySymbols[$auth.user.currency_type] + scope.row[item] + '/min' : '-'
              }}</span>
              <span v-else-if="item == 'free_req_cnt'">{{
                scope.row[item] != 0 && scope.row[item] != '' && scope.row[item] != null ? scope.row[item] : '-'
              }}</span>
              <span v-else-if="item == 'total_request_numbers'">
                {{ scope.row[item] != 0 && scope.row[item] != '' && scope.row[item] != null ? scope.row[item] : '-' }}
              </span>
              <span v-else-if="item == 'phone_number'">{{
                scope.row[item] != '' && scope.row[item] != null ? scope.row[item] : '-'
              }}</span>
              <span v-else-if="item == 'trans_amount' && scope.row['total_translate_price_' + $auth.user.currency_type] > 0">{{
                (currencySymbols[$auth.user.currency_type] +
                  ( scope.row[
                    'total_translate_price_' + $auth.user.currency_type
                  ]) ) | numberFormat
              }}</span>
              <span v-else-if="item == 'trans_amount' && scope.row['total_translate_price_' + $auth.user.currency_type] === 0">
                -
              </span>
              <span v-else>{{ scope.row[item] }}</span>
            </template>
          </el-table-column>
        </template>
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
// eslint-disable-next-line no-unused-vars
import * as exportExcel from '@/utils/Export2Excel'

const defaultColumns = [
  'company_name',
  'user_id',
  'user_name',
  'phone_number',
  'email',
  'discount',
  'free_req_cnt',
  'total_request_numbers',
  'total_translate_price_JPY',
  'total_translate_price_KRW',
  'total_translate_price_USD',
  'reg_date'
]

const columnWidths = {
  company_name: 150,
  user_id: 150,
  user_name: 150,
  phone_number: 180,
  email: 210,
  discount: 120,
  free_req_cnt: 120,
  total_request_numbers: 120,
  total_translate_price_JPY: 140,
  total_translate_price_KRW: 140,
  total_translate_price_USD: 140,
  reg_date: 180
}

const companyColumns = [
  'user_id',
  'user_name',
  'phone_number',
  'email',
  'discount',
  'free_req_cnt',
  'total_request_numbers',
  'trans_amount',
  'reg_date'
]

const compColumnWidths = {
  user_id: 150,
  user_name: 150,
  phone_number: 180,
  email: 210,
  discount: 120,
  free_req_cnt: 140,
  total_request_numbers: 120,
  trans_amount: 140,
  reg_date: 180
}

const currencySymbols = {
  JPY: '¥',
  KRW: '₩',
  USD: '$'
}

export default {
  name: 'RequesterList',
  // middleware: ['auth', 'auth-admincom'],
  middleware: ['auth', 'stats'],
  mixins: [list],
  async asyncData ({ $auth, $axios, params, error }) {
    try {
      const response = await $axios.post('/basic/get-table-info', { list_type: 'requester_list' })
      const { errorCode, data } = response.data

      if (errorCode !== 0) {
        const _defaultColumns = $auth.user.user_type === 1 ? defaultColumns : companyColumns
        const resp = await $axios.post('/basic/set-table-property', { columns: _defaultColumns, list_type: 'requester_list' })
        const { errorCode } = resp.data
        console.log(errorCode)
        return {
          totalColumns: _defaultColumns,
          tableColumnOptions: defaultColumns,
          tableCompColumnOptions: companyColumns,
          columnCheckVal: _defaultColumns,
          columnWidths,
          compColumnWidths
        }
      } else {
        const _columnWidths = $auth.user.user_type === 1 ? columnWidths : compColumnWidths
        const _tableColumnOptions = []
        const _defaultColumns = $auth.user.user_type === 1 ? defaultColumns : companyColumns
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
          tableCompColumnOptions: _tableColumnOptions,
          columnCheckVal: _tableColumnOptions,
          columnWidths: _columnWidths,
          compColumnWidths: _columnWidths
        }
      }
    } catch (error) {
    }
  },
  data () {
    return {
      // tableColumnOptions: defaultColumns,
      // columnWidths,
      // tableCompColumnOptions: companyColumns,
      // compColumnWidths,
      list_type: 'requester_list',
      currencyList: [
        { value: '', label: this.$t('company.all_currency') },
        { value: 'JPY', label: '¥' },
        { value: 'KRW', label: '₩' },
        { value: 'USD', label: '$' }
      ],
      currencySymbols,
      table: {
        page: 1,
        page_length: 10,
        sort: '+id'
      },
      search: {
        keyword_type: 1,
        search_keyword: '',
        search_type: 1,
        discount_currency_type: '',
        discount_start: '', // 계정 할인 범위
        discount_end: '',
        total_request_numbers_start: '', // 총 요청수 범위
        total_request_numbers_end: '',
        translate_currency_type: '', // 번역금액 currency_type
        total_translate_price_start: '', // 총 번역금액 범위
        total_translate_price_end: '',
        free_req_cnt_start: '',
        free_req_cnt_end: ''
      },
      company_ids: [], // for admin role
      searchFields: [
        { value: 1, label: this.$t('table.requester_name') },
        { value: 2, label: this.$t('table.user_id') },
        { value: 3, label: this.$t('table.phone_number') },
        { value: 4, label: this.$t('table.email') }
      ],
      companyList: [],
      companyFilterOptions: []
    }
  },
  watch: {
    columnCheckVal (valArr) {
      if (this.$auth.user.user_type === 1) {
        this.tableColumnOptions = this.totalColumns.filter(i =>
          valArr.includes(i)
        )
      } else {
        this.tableCompColumnOptions = this.totalColumns.filter(i =>
          valArr.includes(i)
        )
      }
      this.tableKey = this.tableKey + 1 // 为了保证table 每次都会重渲 In order to ensure the table will be re-rendered each time
    },
    totalColumns (newVal) {
      if (this.$auth.user.user_type === 1) {
        this.tableColumnOptions = newVal.filter(i =>
          this.columnCheckVal.includes(i)
        )
      } else {
        this.tableCompColumnOptions = newVal.filter(i =>
          this.columnCheckVal.includes(i)
        )
      }
      this.tableKey = this.tableKey + 1
    }
  },
  created () {
    /** Call api */

    /*
    if (this.$auth.user.user_type === 1) {
      this.totalColumns = defaultColumns
      this.columnCheckVal = defaultColumns
    } else {
      this.totalColumns = companyColumns
      this.columnCheckVal = companyColumns
    }
    */
    if (this.$auth.user.user_type === 1) {
      this.getCompanyList()
    }
    this.getList()
  },
  methods: {
    goToCreatePage () {
      this.$router.push('/requester/add')
    },
    async getCompanyList () {
      const response = await this.$axios.post('/company/get-company-list')
      this.companyList = response.data.data.list
      this.companyFilterOptions = response.data.data.list
    },
    minDiscountChange (val) {
      this.search.discount_start = val
    },
    maxDiscountChange (val) {
      this.search.discount_end = val
    },
    discountCurrencyChange (val) {
      this.search.discount_currency_type = val
    },
    transAmtCurrencyChange (val) {
      this.search.translate_currency_type = val
    },
    companyFilterMethod (query) {
      if (query !== '') {
        this.companyFilterOptions = this.companyList.filter((item) => {
          // eslint-disable-next-line unicorn/prefer-includes
          return (
            item.company_name.toLowerCase().includes(query.toLowerCase())
          )
        })
      } else {
        this.companyFilterOptions = this.companyList
      }
    },
    startReqCntChange (val) {
      this.search.total_request_numbers_start = val
    },
    endReqCntChange (val) {
      this.search.total_request_numbers_end = val
    },
    minTransAmtChange (val) {
      this.search.total_translate_price_start = val
    },
    maxTransAmtChange (val) {
      this.search.total_translate_price_end = val
    },
    minFreeReqCntChange (val) {
      this.search.free_req_cnt_start = val
    },
    maxFreeReqCntChange (val) {
      this.search.free_req_cnt_end = val
    },
    // For custom class names
    tableRowClassName ({ row, rowIndex }) {
      if (rowIndex % 2 === 0) {
        return 'even-row'
      } else {
        return 'odd-row'
      }
    },
    async getList () {
      // eslint-disable-next-line camelcase
      const { page, page_length } = this.table
      const searchParams = Object.assign({}, this.search)
      if (this.$auth.user.user_type === 1) {
        searchParams.company_ids = this.company_ids
      }
      this.listLoading = true
      try {
        const response = await this.$axios.post(
          '/requester/get-requester-list',
          {
            table: { page, page_length },
            search: searchParams
          }
        )
        this.list = response.data.data.list
        this.total = response.data.data.totalCount
      } catch (err) {
        this.list = []
        this.total = 0
      } finally {
        this.listLoading = false
      }
    },
    handleFilter () {
      this.table.page = 1
      this.getList()
    },
    searchWordChanged (searchWord) {
      this.search.search_keyword = searchWord
    },
    optionChanged (option) {
      this.search.search_type = option
    },
    keywordTypeChanged (keywordType) {
      this.search.keyword_type = keywordType
    },
    sortChange (data) {
      const { prop, order } = data
      if (prop === 'no') {
        this.sortByID(order)
      }
    },
    sortByID (order) {
      if (order === 'ascending') {
        this.table.sort = '+no'
      } else {
        this.table.sort = '-no'
      }
      this.handleFilter()
    },
    viewDetail (row) {
      const popupSize =
        'width=' +
        this.variables.popupWidth +
        ',height=' +
        this.variables.popupHeight
      window.open('/requester/detail/' + row.id, '_blank', popupSize)
    },
    handleDelete (row, index) {
      this.$notify({
        title: 'Success',
        message: 'Delete Successfully',
        type: 'success',
        duration: 2000
      })
      this.list.splice(index, 1)
    },
    async handleDownload () {
      const tHeader = [this.$t('table.no')]
      const filterVal = ['no']
      if (this.$auth.user.user_type === 1) {
        for (let i = 0; i < this.tableColumnOptions.length; i++) {
          tHeader.push(this.$t('table.' + this.tableColumnOptions[i]))
          filterVal.push(this.tableColumnOptions[i])
        }
      } else {
        for (let i = 0; i < this.tableCompColumnOptions.length; i++) {
          tHeader.push(this.$t('table.' + this.tableCompColumnOptions[i]))
          filterVal.push(this.tableCompColumnOptions[i])
        }
      }
      this.downloadLoading = true
      const data = await this.formatJson(filterVal)
      exportExcel.exportJsonToExcel({
        header: tHeader,
        data,
        filename: 'list_of_requestors'
      })
      this.downloadLoading = false
    },
    async formatJson (filterVal) {
      const searchParams = Object.assign({}, this.search)
      if (this.$auth.user.user_type === 1) {
        searchParams.company_ids = this.company_ids
      }
      try {
        const response = await this.$axios.post(
          '/requester/get-requester-list',
          {
            search: searchParams
          }
        )
        this.excelList = response.data.data.list
      } catch (err) {
        this.excelList = []
      }

      const totalCount = this.excelList.length

      return this.excelList.map((v, index) =>
        filterVal.map((j) => {
          if (j === 'no') {
            return (totalCount - index)
          } else if (j === 'reg_date') {
            return this.$options.filters.date(v[j])
          } else {
            return v[j]
          }
        })
      )
    },
    getSortClass (key) {
      const sort = this.table.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    },
    delRequesters () {
      if (this.multipleSelection.length === 0) {
        this.$alert(
          this.$t('validation.select_del_requester'),
          this.$t('validation.delete'),
          {
            confirmButtonText: this.$t('common.ok')
          }
        )
      } else {
        this.$confirm(
          this.$t('validation.delete_requester'),
          this.$t('validation.delete'),
          {
            confirmButtonText: this.$t('common.ok'),
            cancelButtonText: this.$t('common.no')
          }
        )
          .then(async () => {
            this.listLoading = true
            const idList = []
            let delCondition = true
            this.multipleSelection.map((select) => {
              idList.push(select.id)
              if (
                parseInt(select.total_request_numbers) !== 0
              ) {
                delCondition = false
              }
            })
            if (delCondition) {
              const response = await this.$axios.post(
                '/requester/delete-requester',
                {
                  ids: idList
                }
              )
              if (response.data.errorCode === 0) {
                this.$message({
                  type: 'success',
                  message: this.$t('validation.delete_success')
                })
                this.getList()
              } else {
                this.$message({
                  type: 'warning',
                  message: this.$t('validation.delete_fail')
                })
                this.listLoading = false
              }
            } else {
              this.$message({
                type: 'warning',
                message: this.$t('validation.delete_no_requester')
              })
              this.listLoading = false
            }
          })
          .catch(() => {})
      }
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.search-box {
  .top-filter-container {
    .company {
      .el-select {
        min-width: 180px;
      }
    }
  }
}

.column-control-dropdown {
  div:first-child {
    max-width: 300px;
  }
}

.table-card {
  .cant-delete {
    justify-content: flex-end;
  }
}

.btn-detail {
  background: $blue10;
}

::v-deep {
  .btn-detail.el-button--mini {
    font-size: 14px;
    line-height: 2;
    padding: 4px 8px;
  }
  .el-icon-document:before {
    color: $blue50 !important;
  }
}
</style>
