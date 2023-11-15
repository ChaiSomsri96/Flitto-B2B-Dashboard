<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('caption.list') }}
    </div>
    <el-card class="box-card search-box">
      <div class="top-filter-container">
        <div class="period">
          <label>{{ $t('caption.duration') }}</label>
          <el-select v-model="search.date_type" class="date-range-option">
            <!-- tc -->
            <template v-if="$auth.user.user_type === 4">
              <el-option
                v-for="item in tcDateTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
              </el-option>
            </template>
            <template v-if="$auth.user.user_type === 5">
              <el-option
                v-for="item in trDateTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
              </el-option>
            </template>
            <template v-if="$auth.user.user_type === 6">
              <el-option
                v-for="item in reDateTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
              </el-option>
            </template>
          </el-select>
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
            v-model="dateRange"
            type="daterange"
            range-separator="~"
            start-placeholder="2020-08-01"
            end-placeholder="2020-08-01"
            value-format="timestamp"
          >
          </el-date-picker>
        </div>
        <div class="work-progress-status">
          <label>{{ $t('caption.prog_status') }}</label>
          <el-select
            v-model="search.status"
            multiple
            :placeholder="$t('common.select')"
          >
            <el-option
              v-for="item in progList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
        <div
          v-if="$auth.user.user_type == 4 || $auth.user.user_type == 5"
          class="original-language"
        >
          <label>{{ $t('caption.orglang') }}</label>
          <el-select v-model="search.original_language">
            <el-option
              v-for="item in orglangs"
              :key="item.id"
              :label="$t('common.' + item.name)"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
        <div
          v-if="$auth.user.user_type == 5 || $auth.user.user_type == 6"
          class="translate-language"
        >
          <label v-if="$auth.user.user_type == 5">{{
            $t('caption.translang')
          }}</label>
          <label v-if="$auth.user.user_type == 6">{{
            $t('table.re_language')
          }}</label>
          <el-select v-model="search.translate_language">
            <el-option
              v-for="item in translangs"
              :key="item.id"
              :label="$t('common.' + item.name)"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
      </div>
      <div class="bottom-filter-container">
        <div class="work-price">
          <input-filter-range
            :start-value="search.start_work_price"
            :end-value="search.end_work_price"
            :currency-type="'$'"
            :label="workPriceLabel"
            @minValChanged="minWorkPriceChange"
            @maxValChanged="maxWorkPriceChange"
          />
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
              <el-button class="filter-item" icon="el-icon-s-tools">
              </el-button>
            </span>
            <el-dropdown-menu slot="dropdown" class="column-control-dropdown">
              <div>{{ $t('common.column_control_desc') }}</div>
              <!--worker-->
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
        ref="captionList"
        :key="tableKey"
        v-loading="listLoading"
        :data="list"
        fit
        border
        highlight-current-row
        style="width: 100%;"
        :row-class-name="tableRowClassName"
        @header-dragend="headerwidthChange"
      >
        <el-table-column
          :label="$t('table.no')"
          type="index"
          sortable="custom"
          width="70"
          align="center"
          prop=""
          :index="indexMethod"
        >
        </el-table-column>
        <el-table-column
          v-for="item in tableColumnOptions"
          :key="item"
          :label="$t('table.' + item)"
          :width="columnWidths[item]"
          :prop="item"
          align="center"
        >
          <template slot-scope="{ row, $index }">
            <template v-if="$index == 0">
              <span v-if="item == 'duration'">
                {{ formatDuration(row[item]) }}
              </span>
              <span v-else-if="item.indexOf('work_price') > -1">
                {{ ('$' + row['price']) | numberFormat }}
              </span>
              <span v-else>
                -
              </span>
            </template>
            <template v-else>
              <template v-if="item == 'detail'">
                <i class="el-icon-document" @click="viewDetail(row)"></i>
              </template>
              <el-tag
                v-else-if="item == 'status'"
                class="progress-status"
                :class="progList[row[item] - 1].value + ' ' + $i18n.locale"
              >
                {{ progList[row[item] - 1].label }}
              </el-tag>
              <template
                v-else-if="$auth.user.user_type == 4 && item == 'work_no'"
              >
                {{ row[item].join() }}
              </template>
              <div v-else-if="item == 'title'" class="title">
                <a
                  :href="row['youtube_url']"
                  target="_blank"
                ><svg-icon icon-class="youtube" /></a>{{ row[item] }}
              </div>
              <template
                v-else-if="
                  item == 'tc_work_price' ||
                    item == 'translate_work_price' ||
                    item == 'review_work_price'
                "
              >
                {{ ('$' + row['price']) | numberFormat }}
              </template>
              <template v-else-if="item == 'duration'">
                {{ formatDuration(row[item]) }}
              </template>
              <span
                v-else-if="
                  item == 'original_language' || item == 'translate_language'
                "
                class="lang-tag"
                :class="row[item]"
              >
                {{ row[item] }}
              </span>
              <span
                v-else-if="item == 're_language'"
                class="lang-tag"
                :class="row['translate_language']"
              >
                {{ row['translate_language'] }}
              </span>
              <!--tc video & tr video -->
              <template
                v-else-if="
                  item == 'tc_video' || item == 'tr_video' || item == 're_video'
                "
              >
                <span v-if="!row['video']">-</span>
                <span
                  v-else
                  class="scene-file-info"
                  @click="downloadFile(row['video'])"
                ><i class="el-icon-download"></i></span>
              </template>
              <template
                v-else-if="item == 'tr_prev_video' || item == 're_prev_video'"
              >
                <span v-if="!row['prev_video']">-</span>
                <span
                  v-else
                  class="scene-file-info"
                  @click="downloadFile(row['prev_video'])"
                ><i class="el-icon-download"></i></span>
              </template>
              <span
                v-else-if="
                  item == 'title_desc_trans' || item == 'title_desc_review'
                "
                class="support-service"
                :class="row['has_title_translate']"
              >
                {{ row['has_title_translate'] }}
              </span>
              <template
                v-else-if="
                  item == 'tc_request_date' ||
                    item == 'tr_request_date' ||
                    item == 're_request_date'
                "
              >
                {{ row['req_date'] | date }}
              </template>
              <template
                v-else-if="
                  item == 'tc_predict_date' ||
                    item == 'tr_predict_date' ||
                    item == 're_predict_date'
                "
              >
                {{ formatPredictDate(row['predict_end_date'], row['status']) }}
              </template>
              <template
                v-else-if="
                  item == 'tc_finish_date' ||
                    item == 'tr_finish_date' ||
                    item == 're_finish_date'
                "
              >
                <span v-if="row['end_date']">
                  {{ row['end_date'] | date }}
                </span>
                <span v-else>
                  -
                </span>
              </template>
              <template v-else>
                {{ row[item] }}
              </template>
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
// eslint-disable-next-line no-unused-vars
import list from '@/mixin/list'
import * as exportExcel from '@/utils/Export2Excel'

/** Pre-define available columns' width each user type */
const tcDefaultColumns = [
  'detail',
  'status', // 진행상태
  'work_no', // 작업번호
  'title', // 제목
  'duration', // 영상길이
  'original_language', // 원본언어
  'tc_work_price', // 작업금액(TC)
  'tc_video', // TC자막
  'tc_request_date',
  'tc_predict_date',
  'tc_finish_date'
]

const trDefaultColumns = [
  'detail',
  'status', // 진행상태
  'work_no', // 작업번호
  'title', // 제목
  'duration', // 영상길이
  'original_language', // 원본언어
  'translate_language', // 번역언어
  'translate_work_price', // 작업금액(번역)
  'tr_prev_video', // TC자막,
  'tr_video', // 번역자막,
  'title_desc_trans', // 제목/설명 번역
  'tr_request_date',
  'tr_predict_date',
  'tr_finish_date'
]

const reDefaultColumns = [
  'detail',
  'status', // 진행상태
  'work_no', // 작업번호
  'title', // 제목
  'duration', // 영상길이
  're_language', // 검수언어
  'review_work_price', // 작업금액(검수)
  're_prev_video', // 번역자막,
  're_video', // 번역자막,
  'title_desc_review', // 제목/설명 검수
  're_request_date',
  're_predict_date',
  're_finish_date'
]

/** Pre-define all columns' widths for tc, translator, reviewer */
const columnWidths = {
  detail: 75,
  status: 120,
  work_no: 90,
  title: 300,
  duration: 120,
  original_language: 100,
  translate_language: 100,
  re_language: 110,
  tc_work_price: 120,
  translate_work_price: 120,
  review_work_price: 120,
  tc_video: 100,
  tr_video: 100,
  re_video: 100,
  tr_prev_video: 100,
  re_prev_video: 100,
  tc_request_date: 180,
  tc_predict_date: 180,
  tc_finish_date: 180,
  tr_request_date: 180,
  tr_predict_date: 180,
  tr_finish_date: 180,
  re_request_date: 180,
  re_predict_date: 180,
  re_finish_date: 180,
  title_desc_trans: 120,
  title_desc_review: 120
}

export default {
  // middleware: ['auth', 'auth-worker'],
  middleware: ['auth', 'stats'],
  mixins: [list],
  async asyncData ({ $auth, $axios, params, error }) {
    try {
      const response = await $axios.post('/basic/get-table-info', { list_type: 'caption_list' })
      const { errorCode, data } = response.data
      if (errorCode !== 0) {
        const _defaultColumns = $auth.user.user_type === 4 ? tcDefaultColumns : ($auth.user.user_type === 5 ? trDefaultColumns : reDefaultColumns)
        const resp = await $axios.post('/basic/set-table-property', { columns: _defaultColumns, list_type: 'caption_list' })
        const { errorCode } = resp.data
        console.log(errorCode)
        return {
          totalColumns: _defaultColumns,
          tableColumnOptions: _defaultColumns,
          columnCheckVal: _defaultColumns,
          columnWidths
        }
      } else {
        const _columnWidths = columnWidths
        const _tableColumnOptions = []
        const _defaultColumns = $auth.user.user_type === 4 ? tcDefaultColumns : ($auth.user.user_type === 5 ? trDefaultColumns : reDefaultColumns)
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
      list_type: 'caption_list',
      search: {
        date_type: 1, // 1: 작업요청일시, 2: 작업마감일시, 3: 작업완료일시
        start_date: '',
        end_date: '',
        status: [], // preset: 전체, ['preparing', 'tc_ings']: 준비중, TC작업중
        start_work_price: '',
        end_work_price: '',
        original_language: 0, // 0: 전체
        translate_language: 0,
        keyword_type: 1, // 1: 제목, 2: 작업번호
        search_keyword: '',
        search_type: 1 // 1: 포함, 2: 일치
      },
      tcDateTypes: [
        { value: 1, label: this.$t('table.tc_request_date') },
        { value: 2, label: this.$t('table.tc_predict_date') },
        { value: 3, label: this.$t('table.tc_finish_date') }
      ],
      trDateTypes: [
        { value: 1, label: this.$t('table.tr_request_date') },
        { value: 2, label: this.$t('table.tr_predict_date') },
        { value: 3, label: this.$t('table.tr_finish_date') }
      ],
      reDateTypes: [
        { value: 1, label: this.$t('table.re_request_date') },
        { value: 2, label: this.$t('table.re_predict_date') },
        { value: 3, label: this.$t('table.re_finish_date') }
      ],
      progList: [],
      tcProgList: [
        { value: 'preparing', label: this.$t('table.tc_wait') },
        { value: 'tc_ing', label: this.$t('table.tc_progress') },
        { value: 'tc_complete', label: this.$t('table.tc_finish') }
      ],
      trProgList: [
        { value: 'tc_complete', label: this.$t('table.tr_wait') },
        { value: 'translating', label: this.$t('table.tr_progress') },
        { value: 'translation_complete', label: this.$t('table.tr_finish') }
      ],
      reProgList: [
        { value: 'translation_complete', label: this.$t('table.re_wait') },
        { value: 'reviewing', label: this.$t('table.re_progress') },
        { value: 'review_complete', label: this.$t('table.re_finish') }
      ],
      // columnWidths,
      orglangs: [
        {
          id: 0,
          name: 'all'
        }
      ],
      translangs: [
        {
          id: 0,
          name: 'all'
        }
      ],
      searchFields: [
        { value: 1, label: this.$t('caption.title') },
        { value: 2, label: this.$t('caption.work_no') }
      ],
      workPriceLabel: ''
    }
  },
  created () {
    this.setRouteParams()
    this.setRouteQuery()
    if (
      this.$route.params.period === undefined &&
      !this.$route.params.startDate &&
      !this.$route.query.startDate
    ) {
      this.initDateRange()
    }
    if (this.$auth.user.user_type === 4) {
      // this.totalColumns = tcDefaultColumns
      // this.columnCheckVal = tcDefaultColumns
      // this.tableColumnOptions = tcDefaultColumns
      this.progList = this.tcProgList
      this.workPriceLabel = this.$t('table.tc_work_price')
    }
    if (this.$auth.user.user_type === 5) {
      // this.totalColumns = trDefaultColumns
      // this.columnCheckVal = trDefaultColumns
      // this.tableColumnOptions = trDefaultColumns
      this.progList = this.trProgList
      this.workPriceLabel = this.$t('table.translate_work_price')
    }
    if (this.$auth.user.user_type === 6) {
      // this.totalColumns = reDefaultColumns
      // this.columnCheckVal = reDefaultColumns
      // this.tableColumnOptions = reDefaultColumns
      this.progList = this.reProgList
      this.workPriceLabel = this.$t('table.review_work_price')
    }
    this.workingLangs()
    this.getList()
  },
  methods: {
    async workingLangs () {
      try {
        const response = await this.$axios.post('/worker/get-worker-language')
        const { errorCode, data } = response.data
        if (errorCode === 0) {
          if (this.$auth.user.user_type === 4) {
            // tc
            data.working_languages.map((item) => {
              const orgMatched = this.orglangs.filter(
                lang => lang.id === item.id
              )
              if (orgMatched.length === 0) {
                this.orglangs.push(item)
              }
            })
          }
          if (this.$auth.user.user_type === 5) {
            // translator
            data.originals.map((item) => {
              const orgMatched = this.orglangs.filter(
                lang => lang.id === item.id
              )
              if (orgMatched.length === 0) {
                this.orglangs.push(item)
              }
            })
            data.translates.map((item) => {
              const transMatched = this.translangs.filter(
                lang => lang.id === item.id
              )
              if (transMatched.length === 0) {
                this.translangs.push(item)
              }
            })
          }
          if (this.$auth.user.user_type === 6) {
            // reviewer
            data.working_languages.map((item) => {
              const transMatched = this.translangs.filter(
                lang => lang.id === item.id
              )
              if (transMatched.length === 0) {
                this.translangs.push(item)
              }
            })
          }
        }
      } catch (err) {}
    },
    formatDuration (duration) {
      if (!duration) {
        return '0h 0m 0s'
      }
      const secNum = parseInt(duration, 10) // don't forget the second param
      const hours = Math.floor(secNum / 3600)
      const minutes = Math.floor((secNum - hours * 3600) / 60)
      const seconds = secNum - hours * 3600 - minutes * 60
      return hours + 'h ' + minutes + 'm ' + seconds + 's'
    },
    formatPredictDate (predictDate, status) {
      if (!predictDate) {
        return '-'
      }
      if (status === 1) {
        const secNum = parseInt(predictDate, 10)
        const hour = Math.floor(secNum / 3600)
        const minute = Math.floor((secNum - hour * 3600) / 60)
        if (hour === 0 && minute !== 0) {
          return this.$t('caption.wait_min_pred_date', { minute })
        }
        if (hour !== 0 && minute === 0) {
          return this.$t('caption.wait_hour_pred_date', { hour })
        }
        return this.$t('caption.wait_pred_date', { hour, minute })
      } else {
        return this.$options.filters.date(predictDate)
      }
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
    async handleDownload () {
      const tHeader = [this.$t('table.no')]
      const filterVal = ['no']
      for (let i = 0; i < this.tableColumnOptions.length; i++) {
        if (this.tableColumnOptions[i] === 'detail') {
          continue
        }
        tHeader.push(this.$t('table.' + this.tableColumnOptions[i]))
        filterVal.push(this.tableColumnOptions[i])
      }
      this.downloadLoading = true
      const data = await this.formatJson(filterVal)

      exportExcel.exportJsonToExcel({
        header: tHeader,
        data,
        filename: this.$t('caption.list')
      })
      this.downloadLoading = false
    },
    async formatJson (filterVal) {
      const searchParams = Object.assign({}, this.search)
      if (this.dateRange.length === 2) {
        searchParams.start_date = Math.floor(this.dateRange[0] / 1000)
        searchParams.end_date = Math.floor(this.dateRange[1] / 1000)
      }
      if (searchParams.status.length === 0) {
        delete searchParams.status
      }
      if (searchParams.original_language === 0) {
        delete searchParams.original_language
      }
      if (searchParams.translate_language === 0) {
        delete searchParams.translate_language
      }
      if (searchParams.finish_work_type === 0) {
        delete searchParams.finish_work_type
      }
      try {
        let url = '/subtitle-worker/get-tc-request-list'
        if (this.$auth.user.user_type === 5 || this.$auth.user.user_type === 6) { url = '/subtitle-worker/get-worker-request-list' }
        const response = await this.$axios.post(
          url,
          {
            search: searchParams
          }
        )
        this.excelList = response.data.data.list
        /* this.excelList.unshift({
          duration: response.data.data.duration_sum,
          work_price: response.data.data.work_price_sum
        }) */
      } catch (err) {
        this.excelList = []
      }

      const totalCount = this.excelList.length

      return this.excelList.map((v, index) =>
        filterVal.map((j) => {
          if (j === 'no') {
            return (totalCount - index)
          } else if (j === 'status') {
            return this.progList[v[j] - 1].label
          } else if (j === 'duration') {
            return this.formatDuration(v[j])
          } else if (
            j === 'tc_work_price' ||
            j === 'translate_work_price' ||
            j === 'review_work_price'
          ) {
            return '$' + this.$options.filters.numberFormat(v.price)
          } else if (j === 'title_desc_trans' || j === 'title_desc_review') {
            return v.has_title_translate
          } else if (j === 're_lanaguage') {
            return v.translate_language
          } else if (j === 'tc_video') {
            return v.prev_video
          } else if (
            j === 'tc_request_date' ||
            j === 'tr_request_date' ||
            j === 're_request_date'
          ) {
            return this.$options.filters.date(v.req_date)
          } else if (
            j === 'tc_predict_date' ||
            j === 'tr_predict_date' ||
            j === 're_predict_date'
          ) {
            return this.formatPredictDate(v.predict_end_date, v.status)
          } else if (
            j === 'tc_finish_date' ||
            j === 'tr_finish_date' ||
            j === 're_finish_date'
          ) {
            if (!v.end_date) {
              return ''
            } else {
              return this.$options.filters.date(v.end_date)
            }
          } else {
            return v[j]
          }
        })
      )
    },
    minWorkPriceChange (val) {
      this.search.start_work_price = val
    },
    maxWorkPriceChange (val) {
      this.search.end_work_price = val
    },
    async getList () {
      this.listLoading = true
      // eslint-disable-next-line camelcase
      const { page, page_length } = this.table
      const searchParams = Object.assign({}, this.search)
      if (this.dateRange && this.dateRange.length === 2) {
        const startDate = this.setDateFormat((isNaN(parseInt(this.dateRange[0])) ? this.dateRange[0] : new Date(parseInt(this.dateRange[0]))))
        const endDate = this.setDateFormat((isNaN(parseInt(this.dateRange[1])) ? this.dateRange[1] : new Date(parseInt(this.dateRange[1]))))
        searchParams.start_date = Math.floor(new Date(startDate).getTime() / 1000) + (new Date()).getTimezoneOffset() * 60
        searchParams.end_date = Math.floor(new Date(endDate).getTime() / 1000) + 86399 + (new Date()).getTimezoneOffset() * 60
      }
      if (searchParams.status.length === 0) {
        delete searchParams.status
      }
      if (searchParams.original_language === 0) {
        delete searchParams.original_language
      }
      if (searchParams.translate_language === 0) {
        delete searchParams.translate_language
      }
      if (searchParams.start_work_price === '') {
        delete searchParams.start_work_price
      }
      if (searchParams.end_work_price === '') {
        delete searchParams.end_work_price
      }
      try {
        let response = null
        if (this.$auth.user.user_type === 4) {
          // for tc
          response = await this.$axios.post(
            '/subtitle-worker/get-tc-request-list',
            {
              table: { page, page_length },
              search: searchParams
            }
          )
        } else {
          response = await this.$axios.post(
            '/subtitle-worker/get-worker-request-list',
            {
              table: { page, page_length },
              search: searchParams
            }
          )
        }
        this.list = response.data.data.list
        this.list.unshift({
          duration: response.data.data.duration_sum,
          price: response.data.data.work_price_sum
        })
        this.total = response.data.data.totalCount
      } catch (err) {
        this.list = []
        this.total = 0
      } finally {
        this.listLoading = false
      }
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
    handleFilter (searchWord) {
      this.table.page = 1
      this.getList()
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
    async viewDetail (row) {
      try {
        const popupSize =
          'width=' +
          this.variables.popupWidth +
          ',height=' +
          this.variables.popupHeight
        if (this.$auth.user.user_type === 4) {
          const resp = await this.$axios.post(
            '/subtitle-worker/tc-detail-check',
            {
              id: row.id
            }
          )
          const { errorCode } = resp.data
          if (errorCode === 0) {
            window.open('/caption/detail/worker/' + row.id, '_blank', popupSize)
          } else {
            this.$message.error(this.$t('notice.worker_tc_not_able_assigned'))
          }
        } else {
          const resp = await this.$axios.post('/subtitle-worker/detail-check', {
            work_no: row.work_no
          })
          const { errorCode } = resp.data
          if (errorCode === 0) {
            window.open(
              '/caption/detail/worker/' + row.work_no,
              '_blank',
              popupSize
            )
          } else if (this.$auth.user.user_type === 5) {
            this.$message.error(
              this.$t('notice.worker_translator_not_able_assigned')
            )
          } else if (this.$auth.user.user_type === 6) {
            this.$message.error(
              this.$t('notice.worker_reviewer_not_able_assigned')
            )
          }
        }
      } catch (err) {}
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
.search-box {
  margin-bottom: $searchboxMgBottom;
  .top-filter-container {
    display: inline-flex;
    & > div {
      display: inline-flex;
      align-items: center;
      margin-right: $filterDivMgRight;
    }
    .period {
      .date-range-option {
        width: 150px;
        margin-right: 5px;
      }
      .period-options {
        width: 100px;
        margin-right: 5px;
      }
      .el-date-editor {
        width: 270px;
        margin-right: 30px;
      }
    }
    .work-progress-status {
      .el-select {
        width: 200px;
      }
    }
    .original-language,
    .translate-language {
      .el-select {
        width: 120px;
      }
    }
  }
  .bottom-filter-container {
    display: inline-flex;
    margin-top: $filterContainerMg;
    & > div {
      display: inline-flex;
      align-items: center;
      margin-right: $filterDivMgRight;
    }
    .btn-search {
      margin-right: 20px;
    }
  }
}
.table-card {
  .table-header {
    justify-content: flex-end;
  }
  .svg-icon {
    width: calc(#{$svgSize/1.5});
    height: calc(#{$svgSize/1.5});
    margin-right: 5px;
  }
  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  i {
    font-size: 18px;
  }
  .el-icon-document,
  .el-icon-circle-plus-outline,
  .el-icon-circle-remove-outline {
    cursor: pointer;
  }
}
.scene-file-info {
  cursor: pointer;
}
</style>
