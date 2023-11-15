<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('manager.list') }}
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
        <div v-if="$auth.user.user_type == 1" class="company">
          <label>{{ $t('requester.company') }}</label>
          <el-select
            v-model="company_ids"
            multiple
            filterable
            :placeholder="$t('common.select')"
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
      </div>
      <div class="bottom-filter-container">
        <div class="requester">
          <label>{{ $t('caption.choose_requester') }}</label>
          <el-select
            v-model="requester_ids"
            multiple
            filterable
            :placeholder="$t('common.select')"
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

        <div class="manage-count">
          <input-filter-range
            :start-value="search.manage_cnt_start"
            :end-value="search.manage_cnt_end"
            :label="$t('common.manage_count')"
            class="manage-count"
            @minValChanged="startManageCntChange"
            @maxValChanged="endManageCntChange"
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
        :class="{ 'cant-delete': $auth.user.user_type == 2 }"
      >
        <i
          v-if="$auth.user.user_type == 1"
          class="el-icon-delete"
          @click="delManagers"
        ></i>
        <div class="table-header-actions">
          <el-button
            class="filter-item btn-add"
            type="primary"
            icon="el-icon-plus"
            @click="goToCreatePage"
          >
            {{ $t('manager.new_account') }}
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
              <span v-else>{{ !(scope.row[item] === null || scope.row[item] === undefined || scope.row[item] === '') ? scope.row[item] : '-' }}</span>
            </template>
          </el-table-column>
        </template>
        <template v-if="$auth.user.user_type == 2">
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
              <span v-else>{{ !(scope.row[item] === null || scope.row[item] === undefined || scope.row[item] === '') ? scope.row[item] : '-' }}</span>
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
import * as exportExcel from '@/utils/Export2Excel'

const defaultColumns = [
  'company_name',
  'user_id',
  'user_name',
  'manage_cnt',
  'phone_number',
  'email',
  'reg_date'
]

const columnWidths = {
  company_name: 0,
  user_id: 0,
  user_name: 0,
  manage_cnt: 0,
  phone_number: 0,
  email: 0,
  reg_date: 0
}

const companyColumns = [
  'user_id',
  'user_name',
  'manage_cnt',
  'phone_number',
  'email',
  'reg_date'
]

const compColumnWidths = {
  user_id: 0,
  user_name: 0,
  manage_cnt: 0,
  phone_number: 0,
  email: 0,
  reg_date: 0
}

export default {
  name: 'ManagerList',
  // middleware: ['auth', 'auth-admincom'],
  middleware: ['auth'],
  mixins: [list],
  async asyncData ({ $auth, $axios, params, error }) {
    try {
      // console.log('auth - user', $auth.user)
      const response = await $axios.post('/basic/get-table-info', { list_type: 'manager_list' })
      const { errorCode, data } = response.data

      if (errorCode !== 0) {
        const _defaultColumns = $auth.user.user_type === 1 ? defaultColumns : companyColumns
        const resp = await $axios.post('/basic/set-table-property', { columns: _defaultColumns, list_type: 'manager_list' })
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
      list_type: 'manager_list',
      table: {
        page: 1,
        page_length: 10,
        sort: '+id'
      },
      search: {
        keyword_type: 1,
        search_keyword: '',
        search_type: 1,
        manage_cnt_start: '',
        manage_cnt_end: ''
      },
      company_ids: [],
      requester_ids: [],
      searchFields: [
        { value: 1, label: this.$t('table.requester_name') },
        { value: 2, label: this.$t('table.user_id') },
        { value: 3, label: this.$t('table.phone_number') },
        { value: 4, label: this.$t('table.email') }
      ],
      companyList: [],
      companyFilterOptions: [],
      requesterList: []
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
    this.getRequesterList()
    this.getList()
  },
  methods: {
    onCompanyChange () {
      // console.log('companyFilterOptions', this.company_ids)
      this.getRequesterList()
    },
    goToCreatePage () {
      this.$router.push('/manager/add')
    },
    async getCompanyList () {
      const response = await this.$axios.post('/company/get-company-list')
      this.companyList = response.data.data.list
      this.companyFilterOptions = response.data.data.list
    },
    async getRequesterList () {
      try {
        if (this.$auth.user.user_type === 1) {
          let resp
          if (this.company_ids.length === 0) {
            resp = await this.$axios.post('/requester/get-requester-list')
          } else {
            resp = await this.$axios.post('/requester/get-requester-list', {
              search: { company_ids: this.company_ids }
            })
          }
          const { errorCode, data } = resp.data
          if (errorCode === 0) {
            this.requesterList = data.list
          } else {
            this.requesterList = []
          }
        } else {
          const resp = await this.$axios.post('/requester/get-requester-list', {
            search: { company_ids: [this.$auth.user.id] }
          })
          const { errorCode, data } = resp.data
          if (errorCode === 0) {
            this.requesterList = data.list
          } else {
            this.requesterList = []
          }
        }
      } catch (err) {
        this.requesterList = []
      }
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
    startManageCntChange (val) {
      this.search.manage_cnt_start = val
    },
    endManageCntChange (val) {
      this.search.manage_cnt_end = val
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
      window.open('/manager/detail/' + row.id, '_blank', popupSize)
    },
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

      searchParams.requester_ids = this.requester_ids

      this.listLoading = true
      try {
        const response = await this.$axios.post('/manager/get-manager-list', {
          table: { page, page_length },
          search: searchParams
        })
        this.list = response.data.data.list
        this.total = response.data.data.totalCount
      } catch (err) {
        this.list = []
        this.total = 0
      } finally {
        this.listLoading = false
      }
    },
    getSortClass (key) {
      const sort = this.table.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    },
    delManagers () {
      if (this.multipleSelection.length === 0) {
        this.$alert(
          this.$t('validation.select_del_manager'),
          this.$t('validation.delete'),
          {
            confirmButtonText: this.$t('common.ok')
          }
        )
      } else {
        this.$confirm(
          this.$t('validation.delete_manager'),
          this.$t('validation.delete'),
          {
            confirmButtonText: this.$t('common.ok'),
            cancelButtonText: this.$t('common.no')
          }
        )
          .then(async () => {
            this.listLoading = true
            const idList = []
            const delCondition = true
            this.multipleSelection.map((select) => {
              idList.push(select.id)
            })
            if (delCondition) {
              const response = await this.$axios.post(
                '/manager/delete-manager',
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
            }
          })
      }
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
        filename: 'list_of_managers'
      })
      this.downloadLoading = false
    },
    async formatJson (filterVal) {
      const searchParams = Object.assign({}, this.search)
      if (this.$auth.user.user_type === 1) {
        searchParams.company_ids = this.company_ids
      }
      searchParams.requester_ids = this.requester_ids
      try {
        const response = await this.$axios.post(
          '/manager/get-manager-list',
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

.search-box .bottom-filter-container > div {
    display: inline-flex;
    align-items: center;
    margin-right: 25px;
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
