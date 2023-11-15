<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('worker.list') }}
    </div>
    <el-card class="box-card search-box">
      <div class="top-filter-container">
        <div class="user-type">
          <label>{{ $t('worker.user_type') }}</label>
          <el-select
            v-model="search.user_type"
            multiple
            :placeholder="$t('common.select')"
          >
            <el-option
              v-for="item in userTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
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
        <div class="tag">
          <label>{{ $t('worker.tag') }}</label>
          <el-select
            v-model="search.tags"
            multiple
            filterable
            :filter-method="tagFilterMethod"
            :placeholder="$t('common.select')"
          >
            <el-option
              v-for="item in tagFilterOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
        <div class="work-lang">
          <label>{{ $t('worker.work_lang') }}</label>
          <el-select
            v-model="search.w_lang_type"
            clearable
            class="select-work-lang mr20"
            :placeholder="$t('common.select')"
          >
            <el-option
              v-for="item in worklangOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div v-if="search.w_lang_type == 1" class="lang-pair">
          <el-select
            v-model="orglang"
            clearable
            class="original-language"
            :placeholder="$t('common.select')"
          >
            <el-option
              v-for="item in workLangs"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
          <el-select
            v-model="translang"
            clearable
            class="trans-language"
            :placeholder="$t('common.select')"
          >
            <el-option
              v-for="item in workLangs"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </div>
        <div v-if="search.w_lang_type == 2" class="lang-single">
          <el-select
            v-model="worklang"
            clearable
            class="original-language"
            :placeholder="$t('common.select')"
          >
            <el-option
              v-for="item in workLangs"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </div>
      </div>
      <div class="bottom-filter-container">
        <div class="correct-rate">
          <input-filter-range
            :start-value="search.correction_rate_start"
            :end-value="search.correction_rate_end"
            :label="$t('worker.correct_rate') + '(%)'"
            @minValChanged="minCorRateChange"
            @maxValChanged="maxCorRateChange"
          />
        </div>
        <div class="work-count">
          <input-filter-range
            :start-value="search.total_work_numbers_start"
            :end-value="search.total_work_numbers_end"
            :label="$t('worker.work_count')"
            @minValChanged="minWorkCntChange"
            @maxValChanged="maxWorkCntChange"
          />
        </div>
        <div class="work-amount">
          <input-filter-range
            :start-value="search.total_work_price_start"
            :end-value="search.total_work_price_end"
            :label="$t('worker.work_amount') + '($)'"
            @minValChanged="minWorkAmtChange"
            @maxValChanged="maxWorkAmtChange"
          />
        </div>
        <el-col class="btn-search">
          <el-button
            class="filter-item btn-search"
            type="primary"
            icon="el-icon-search"
            @click="handleFilter"
          >
            {{ $t('common.search') }}
          </el-button>
        </el-col>
      </div>
    </el-card>
    <el-card class="box-card table-card">
      <label class="total-count">
        {{ $t('table.total_count', { total: total }) }}
      </label>
      <div class="table-header">
        <i
          id="del_selected_worker"
          class="el-icon-delete"
          @click="delSelWorker"
        ></i>
        <div class="table-header-actions">
          <el-button
            class="filter-item btn-add"
            type="primary"
            icon="el-icon-plus"
            @click="handleCreate"
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
          width="70"
          :class-name="getSortClass('id')"
          align="center"
          :index="indexMethod"
        >
        </el-table-column>
        <el-table-column :label="$t('table.detail')" width="70" align="center">
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
        <el-table-column
          v-for="item in tableColumnOptions"
          :key="item"
          :label="$t('table.' + item)"
          :width="columnWidths[item]"
          :prop="item"
          align="center"
        >
          <template slot-scope="scope">
            <span v-if="item == 'user_type'">{{
              userTypeNames[scope.row[item]]
            }}</span>
            <div v-else-if="item == 'working_language'">
              <template v-if="scope.row['working_language'].length > 0">
                <div
                  v-if="scope.row['user_type'] != 'translator'"
                  class="lang-tag-group"
                >
                  <span
                    v-for="(lang, i) in scope.row['working_language']"
                    :key="i"
                    class="lang-tag"
                    :class="lang"
                  >{{ lang }}</span>
                </div>
                <div v-else class="lang-tag-group">
                  <div
                    v-for="(lang, i) in scope.row['working_language']"
                    :key="i"
                  >
                    <span class="lang-tag" :class="lang.original">{{
                      lang.original
                    }}</span>
                    <i class="el-icon-right"></i>
                    <span class="lang-tag" :class="lang.translate">{{
                      lang.translate
                    }}</span>
                  </div>
                </div>
              </template>
              <template v-else>
                -
              </template>
            </div>
            <div v-else-if="item == 'tags'" class="tags-column">
              <template v-if="scope.row[item].length > 0">
                <el-tag
                  v-for="(tag, i) in scope.row[item]"
                  :key="i"
                  type="info"
                  effect="dark"
                >
                  {{ tag }}
                </el-tag>
              </template>
              <template v-else>
                -
              </template>
            </div>
            <span v-else-if="item == 'admin_memo'" class="admin-memo">
              {{ scope.row['admin_memo'] }}
            </span>
            <template v-else-if="item == 'correction_rate'">
              {{ scope.row[item] + '%' }}
            </template>
            <template v-else-if="item == 'can_work'">
              {{ scope.row[item] | numberFormat }}
            </template>
            <template v-else-if="item == 'reg_date'">
              {{ scope.row[item] | date }}
            </template>
            <template v-else>
              {{ scope.row[item] }}
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
import list from '@/mixin/list'
// eslint-disable-next-line no-unused-vars
import * as exportExcel from '@/utils/Export2Excel'

const defaultColumns = [
  'user_type',
  'user_id',
  'user_name',
  'phone_number',
  'email',
  'working_language',
  'correction_rate',
  'can_work',
  'total_work_numbers',
  'total_work_price',
  'tags',
  'admin_memo',
  'reg_date'
]

const columnWidths = {
  user_type: 100,
  user_id: 150,
  user_name: 120,
  phone_number: 180,
  email: 210,
  working_language: 150,
  correction_rate: 120,
  can_work: 100,
  total_work_numbers: 120,
  total_work_price: 140,
  tags: 250,
  admin_memo: 200,
  reg_date: 180
}

export default {
  name: 'WorkerList',
  // middleware: ['auth', 'auth-admin'],
  middleware: ['auth', 'stats'],
  mixins: [list],
  async asyncData ({ $axios, params, error }) {
    try {
      const response = await $axios.post('/basic/get-table-info', { list_type: 'worker_list' })
      const { errorCode, data } = response.data

      if (errorCode !== 0) {
        const resp = await $axios.post('/basic/set-table-property', { columns: defaultColumns, list_type: 'worker_list' })
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
      list_type: 'worker_list',
      // columnWidths,
      userTypes: [
        { value: 'tc', label: this.$t('user_type.tc') },
        { value: 'translator', label: this.$t('user_type.translator') },
        { value: 'reviewer', label: this.$t('user_type.reviewer') }
      ],
      userTypeNames: {
        tc: this.$t('user_type.tc'),
        translator: this.$t('user_type.translator'),
        reviewer: this.$t('user_type.reviewer')
      },
      searchFields: [
        { value: 1, label: this.$t('table.user_name') },
        { value: 2, label: this.$t('table.user_id') },
        { value: 3, label: this.$t('table.phone_number') },
        { value: 4, label: this.$t('table.email') }
      ],
      tagList: [],
      tagFilterOptions: [],
      worklangOptions: [
        { value: 1, label: this.$t('worker.lang_pair') },
        { value: 2, label: this.$t('worker.single_lang') }
      ],
      workLangs: [],
      table: {
        page: 1,
        page_length: 10,
        sort: '+id'
      },
      search: {
        user_type: [],
        keyword_type: 1, // 1: 이름, 2: 아이디, 3: 전화번호, 4: 이메일
        search_keyword: '', // 검색어
        search_type: 1, // 1: 포함, 2: 일치
        tags: [], // 아무것도 선택하지 않았을때 [], 전체선택경우 -1
        w_lang_type: '', // 전체: -1, 언어쌍: 1, 단일언어: 2
        correction_rate_start: '',
        correction_rate_end: '',
        total_work_numbers_start: '',
        total_work_numbers_end: '',
        total_work_price_start: '',
        total_work_price_end: ''
      },
      orglang: '',
      translang: '',
      worklang: ''
    }
  },
  created () {
    /** Call api */
    // this.initTableColumnData()
    this.getTags()
    this.getWorkLangs()
    this.getList()
  },
  methods: {
    initTableColumnData () {
      this.totalColumns = defaultColumns
      this.tableColumnOptions = defaultColumns
      this.columnCheckVal = defaultColumns
    },
    async getTags () {
      const resp = await this.$axios.post('/worker/get-tags')
      this.tagList = resp.data.data
      this.tagFilterOptions = this.tagList
    },
    async getWorkLangs () {
      const resp = await this.$axios.post('/basic/get-working-languages')
      this.workLangs = resp.data.data
    },
    tagFilterMethod (query) {
      if (query !== '') {
        this.tagFilterOptions = this.tagList.filter((item) => {
          // eslint-disable-next-line unicorn/prefer-includes
          return item.name.toLowerCase().indexOf(query.toLowerCase()) > -1
        })
      } else {
        this.tagFilterOptions = this.tagList
      }
    },
    minCorRateChange (val) {
      this.search.correction_rate_start = val
    },
    maxCorRateChange (val) {
      this.search.correction_rate_end = val
    },
    minWorkCntChange (val) {
      this.search.total_work_numbers_start = val
    },
    maxWorkCntChange (val) {
      this.search.total_work_numbers_end = val
    },
    minWorkAmtChange (val) {
      this.search.total_work_price_start = val
    },
    maxWorkAmtChange (val) {
      this.search.total_work_price_end = val
    },
    // For custom class names
    tableRowClassName ({ row, rowIndex }) {
      if (rowIndex % 2 === 0) {
        return 'even-row'
      } else {
        return 'odd-row'
      }
    },
    delSelWorker () {
      if (this.multipleSelection.length === 0) {
        this.$alert(
          this.$t('validation.select_del_worker'),
          this.$t('validation.delete'),
          {
            confirmButtonText: 'OK'
          }
        )
      } else {
        this.$confirm(
          this.$t('validation.delete_worker'),
          this.$t('validation.delete'),
          {
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel'
          }
        )
          .then(async () => {
            this.listLoading = true
            const idList = []
            let delCondition = true
            this.multipleSelection.map((select) => {
              idList.push(select.id)
              if (
                select.total_work_numbers !== 0 ||
                select.total_work_price !== 0
              ) {
                delCondition = false
              }
            })
            if (delCondition) {
              const response = await this.$axios.post('/worker/delete-worker', {
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
                message: this.$t('validation.delete_no_worker')
              })
              this.listLoading = false
            }
          })
          .catch(() => {})
      }
    },
    async getList () {
      this.listLoading = true
      // eslint-disable-next-line camelcase
      const { page, page_length } = this.table
      const searchParams = Object.assign({}, this.search)
      if (this.search.user_type.length === 0) {
        searchParams.user_type = -1
      }
      if (this.search.tags.length === 0) {
        searchParams.tags = -1
      }
      if (this.search.w_lang_type === '') {
        searchParams.w_lang_type = -1
      } else if (this.search.w_lang_type === 1) {
        if (this.orglang === '' && this.translang === '') {
          searchParams.work_lang = {
            original: -1,
            translate: -1
          }
        } else if (this.orglang === '') {
          searchParams.work_lang = {
            original: -1,
            translate: this.translang
          }
        } else if (this.translang === '') {
          searchParams.work_lang = {
            original: this.orglang,
            translate: -1
          }
        } else {
          searchParams.work_lang = {
            original: this.orglang,
            translate: this.translang
          }
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (this.worklang === '') {
          searchParams.work_lang = -1
        } else {
          searchParams.work_lang = this.worklang
        }
      }
      try {
        const response = await this.$axios.post('/worker/get-worker-list', {
          table: { page, page_length },
          search: searchParams
        })
        this.list = response.data.data.list
        this.total = response.data.data.totalCount
      } catch (err) {
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
    handleCreate () {
      this.$router.push('/worker/add')
    },
    viewDetail (row) {
      const popupSize =
        'width=' +
        this.variables.popupWidth +
        ',height=' +
        this.variables.popupHeight
      window.open('/worker/detail/' + row.id, '_blank', popupSize)
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
        filename: 'list_of_editors'
      })
      this.downloadLoading = false
    },
    async formatJson (filterVal) {
      const searchParams = Object.assign({}, this.search)
      if (this.search.user_type.length === 0) {
        searchParams.user_type = -1
      }
      if (this.search.tags.length === 0) {
        searchParams.tags = -1
      }
      if (this.search.w_lang_type === '') {
        searchParams.w_lang_type = -1
      } else if (this.search.w_lang_type === 1) {
        if (this.orglang === '' && this.translang === '') {
          searchParams.work_lang = {
            original: -1,
            translate: -1
          }
        } else if (this.orglang === '') {
          searchParams.work_lang = {
            original: -1,
            translate: this.translang
          }
        } else if (this.translang === '') {
          searchParams.work_lang = {
            original: this.orglang,
            translate: -1
          }
        } else {
          searchParams.work_lang = {
            original: this.orglang,
            translate: this.translang
          }
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (this.worklang === '') {
          searchParams.work_lang = -1
        } else {
          searchParams.work_lang = this.worklang
        }
      }
      try {
        const response = await this.$axios.post('/worker/get-worker-list', {
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
          } else if (j === 'user_type') {
            return this.userTypeNames[v[j]]
          } else if (j === 'reg_date') {
            return this.$options.filters.date(v[j])
          } else if (j === 'working_language' && v.user_type === 'translator') {
            let workingLanguage = ''
            for (let i = 0; i < v[j].length; i++) {
              workingLanguage +=
                v[j][i].original + '->' + v[j][i].translate + ' '
            }
            return workingLanguage
          } else {
            return v[j]
          }
        })
      )
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
/* Search box on the header */

.lang-pair {
  background-color: white;
}

.admin-memo {
  white-space: nowrap;
}

.search-box {
  .top-filter-container {
    .user-type {
      .el-select {
        min-width: 150px;
      }
    }
    .tag {
      label {
        min-width: 60px;
      }
      .el-select {
        min-width: 150px;
      }
    }
    .work-lang {
      margin-right: 10px;
      .el-select {
        width: 120px;
      }
    }
    .lang-pair,
    .lang-single {
      margin-left: 5px;
      .el-select {
        width: 120px;
        margin-right: 5px;
      }
    }
  }
}

.btn-detail {
  background: $blue10;
}

.column-control-dropdown {
  div:first-child {
    max-width: 300px;
  }
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.tags-column {
  .el-tag {
    margin-right: 5px;
    margin-bottom: 5px;
  }
}
.lang-tag-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
::v-deep {
  .search-item .search-input {
    min-width: 230px !important;
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
