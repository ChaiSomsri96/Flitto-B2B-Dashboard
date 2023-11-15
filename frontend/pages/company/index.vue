<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('company.list') }}
    </div>
    <el-card class="box-card search-box">
      <div class="top-filter-container">
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
      </div>
      <div class="bottom-filter-container">
        <input-filter-range
          :start-value="search.total_request_numbers_start"
          :end-value="search.total_request_numbers_end"
          :label="$t('common.request_count')"
          class="request-count"
          @minValChanged="startReqCntChange"
          @maxValChanged="endReqCntChange"
        />
        <input-filter-range
          :start-value="search.total_translate_price_start"
          :end-value="search.total_translate_price_end"
          :label="$t('common.trans_amount')"
          :option-list="currencyList"
          :pre-option="search.currency_type"
          :select-placeholder="$t('placeholder.currency_type')"
          class="trans-amount"
          @minValChanged="startTransAmtChange"
          @maxValChanged="endTransAmtChange"
          @selectChanged="currencyChange"
        />
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
        <i id="del_selected_company" class="el-icon-delete" @click="delSelCompany"></i>
        <div class="table-header-actions">
          <el-button class="filter-item btn-add" type="primary" icon="el-icon-plus" @click="goToCreatePage">
            {{ $t('requester.new_account') }}
          </el-button>
          <el-button :loading="downloadLoading" class="btn-excel-download" type="primary" icon="el-icon-download" @click="handleDownload">
            {{ $t('common.excel_download') }}
          </el-button>
          <el-dropdown trigger="click">
            <span class="el-dropdown-link">
              <el-button class="filter-item btn-add" icon="el-icon-s-tools">
              </el-button>
            </span>
            <el-dropdown-menu slot="dropdown" class="column-control-dropdown">
              <div class="column-control-desc">
                {{ $t('common.column_control_desc') }}
              </div>
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
        <el-table-column type="selection" width="55" align="center"></el-table-column>
        <el-table-column
          :label="$t('table.no')"
          type="index"
          sortable="custom"
          width="70"
          :class-name="getSortClass('no')"
          align="center"
          :index="indexMethod"
        >
        </el-table-column>
        <el-table-column :label="$t('table.detail')" width="80" align="center">
          <template slot-scope="{row}">
            <el-button size="mini" icon="el-icon-document" class="btn-detail" @click="viewDetail(row)">
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          v-for="item in tableColumnOptions"
          :key="item"
          :label="$t('table.' + item)"
          :width="columnWidths[item]"
          :prop="item"
          align="center"
        >
          <template slot-scope="scope">
            <span v-if="item=='reg_date'">{{ scope.row[item] | date }}</span>
            <span v-else-if="item=='total_request_numbers'">{{ scope.row[item] | numberFormat }}</span>
            <span v-else-if="item=='total_translate_price_JPY'">{{ scope.row[item] > 0 ? '¥' + (scope.row[item] | numberFormat) : '-' }}</span>
            <span v-else-if="item=='total_translate_price_KRW'">{{ scope.row[item] > 0 ? '₩' + (scope.row[item] | numberFormat) : '-' }}</span>
            <span v-else-if="item=='total_translate_price_USD'">{{ scope.row[item] > 0 ? '$' + (scope.row[item] | numberFormat) : '-' }}</span>
            <span v-else-if="item=='contact_name'">{{ scope.row['user_name'] ? scope.row['user_name'] : '-' }}</span>
            <span v-else>{{ scope.row[item] ? scope.row[item] : '-' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" :page.sync="table.page" :limit.sync="table.page_length" @pagination="getList" />
    </el-card>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import list from '@/mixin/list'
import * as exportExcel from '@/utils/Export2Excel'

const defaultColumns = [
  'user_id',
  'company_name',
  'contact_name',
  'phone_number',
  'email',
  'total_request_numbers',
  'total_translate_price_JPY',
  'total_translate_price_KRW',
  'total_translate_price_USD',
  'reg_date'
]

const columnWidths = {
  user_id: 150,
  company_name: 150,
  contact_name: 150,
  phone_number: 180,
  email: 220,
  total_request_numbers: 120,
  total_translate_price_JPY: 140,
  total_translate_price_KRW: 140,
  total_translate_price_USD: 140,
  reg_date: 180
}

export default {
  name: 'CompanyList',
  // middleware: ['auth', 'auth-admin'],
  middleware: ['auth', 'stats'],
  mixins: [list],
  async asyncData ({ $axios, params, error }) {
    try {
      const response = await $axios.post('/basic/get-table-info', { list_type: 'company_list' })
      const { errorCode, data } = response.data

      if (errorCode !== 0) {
        const resp = await $axios.post('/basic/set-table-property', { columns: defaultColumns, list_type: 'company_list' })
        const { errorCode } = resp.data
        console.log(errorCode)
        return {
          totalColumns: defaultColumns,
          tableColumnOptions: defaultColumns,
          columnCheckVal: defaultColumns,
          columnWidths
        }
      } else {
        const _columnWidths = columnWidths
        const _tableColumnOptions = []
        for (let i = 0; i < defaultColumns.length; i++) {
          if (data[defaultColumns[i]] !== undefined) {
            _tableColumnOptions.push(defaultColumns[i])
            if (data[defaultColumns[i]] !== 0) {
              _columnWidths[defaultColumns[i]] = data[defaultColumns[i]]
            }
          }
        }

        return {
          totalColumns: defaultColumns,
          tableColumnOptions: _tableColumnOptions,
          columnCheckVal: _tableColumnOptions,
          columnWidths: _columnWidths
        }
      }
    } catch (err) {
    }
  },
  data () {
    return {
      // columnWidths,
      list_type: 'company_list',
      table: {
        page: 1,
        page_length: 10,
        sort: '+id'
      },
      search: {
        keyword_type: 1,
        search_keyword: '',
        search_type: 1, // 1: 포함, 2: 일치
        total_request_numbers_start: '',
        total_request_numbers_end: '',
        currency_type: '',
        total_translate_price_start: '',
        total_translate_price_end: ''
      },
      searchFields: [
        { value: 1, label: this.$t('table.company_name') },
        { value: 2, label: this.$t('table.user_id') },
        { value: 3, label: this.$t('table.contact_name') },
        { value: 4, label: this.$t('table.phone_number') },
        { value: 5, label: this.$t('table.email') }
      ],
      currencyList: [
        { value: '', label: this.$t('company.all_currency') },
        { value: 'JPY', label: '¥' },
        { value: 'KRW', label: '₩' },
        { value: 'USD', label: '$' }
      ]
    }
  },
  created () {
    // this.initTableColumnData()
    /** Call api */
    this.getList()
  },
  methods: {
    initTableColumnData () {
      this.totalColumns = defaultColumns
      this.tableColumnOptions = defaultColumns
      this.columnCheckVal = defaultColumns
    },
    goToCreatePage () {
      this.$router.push('/company/add')
    },
    startReqCntChange (val) {
      this.search.total_request_numbers_start = val
    },
    endReqCntChange (val) {
      this.search.total_request_numbers_end = val
    },
    currencyChange (val) {
      this.search.currency_type = val
    },
    startTransAmtChange (val) {
      this.search.total_translate_price_start = val
    },
    endTransAmtChange (val) {
      this.search.total_translate_price_end = val
    },
    // For custom class names
    tableRowClassName ({ row, rowIndex }) {
      if (rowIndex % 2 === 0) {
        return 'even-row'
      } else {
        return 'odd-row'
      }
    },
    delSelCompany () {
      if (this.multipleSelection.length === 0) {
        this.$alert(this.$t('validation.select_del_company'), this.$t('validation.delete'), {
          confirmButtonText: 'OK'
        })
      } else {
        this.$confirm(this.$t('validation.delete_company'), this.$t('validation.delete'), {
          confirmButtonText: 'OK',
          cancelButtonText: 'Cancel'
        }).then(async () => {
          this.listLoading = true
          const idList = []
          let delCondition = true
          this.multipleSelection.map((select) => {
            idList.push(select.id)
            if (select.total_request_numbers !== 0 || select.total_translate_price_USD !== 0) {
              delCondition = false
            }
          })
          if (delCondition) {
            const response = await this.$axios.post('/company/delete-company', {
              ids: idList
            })
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
              message: this.$t('validation.delete_no_company')
            })
            this.listLoading = false
          }
        }).catch(() => {
        })
      }
    },
    async getList () {
      this.listLoading = true
      // eslint-disable-next-line camelcase
      const { page, page_length } = this.table
      const searchParams = Object.assign({}, this.search)
      const response = await this.$axios.post('/company/get-company-list', {
        table: { page, page_length },
        search: searchParams
      })
      this.list = response.data.data.list
      this.total = response.data.data.totalCount
      this.listLoading = false
    },
    handleFilter () {
      this.table.page = 1
      this.getList()
    },
    optionChanged (option) {
      this.search.search_type = option
    },
    keywordTypeChanged (keywordType) {
      this.search.keyword_type = keywordType
    },
    searchWordChanged (searchWord) {
      this.search.search_keyword = searchWord
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
      const popupSize = 'width=' + this.variables.popupWidth + ',height=' + this.variables.popupHeight

      window.open('/company/detail/' + row.id, '_blank', popupSize)
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
      for (let i = 0; i < this.tableColumnOptions.length; i++) {
        tHeader.push(this.$t('table.' + this.tableColumnOptions[i]))
        filterVal.push(this.tableColumnOptions[i])
      }
      this.downloadLoading = true
      const data = await this.formatJson(filterVal)
      exportExcel.exportJsonToExcel({
        header: tHeader,
        data,
        filename: 'list_of_clients'
      })
      this.downloadLoading = false
    },
    async formatJson (filterVal) {
      const searchParams = Object.assign({}, this.search)
      try {
        const response = await this.$axios.post('/company/get-company-list', {
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
        } else if (j === 'reg_date') {
          return this.$options.filters.date(v[j])
        } else {
          return v[j]
        }
      }))
    },
    getSortClass (key) {
      const sort = this.table.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
.bottom-filter-container {
  & > div {
    margin-right: 30px;
  }
}

.btn-detail {
  background: $blue10;
}

.column-control-desc {
  max-width: 300px;
}
::v-deep {
  .el-input__prefix {
    left: 10px;
    top: 10px;
  }
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
