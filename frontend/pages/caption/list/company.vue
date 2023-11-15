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
            <el-option
              v-for="item in dateTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
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
            start-placeholder="2020-04-01"
            end-placeholder="2020-07-01"
            value-format="timestamp"
          >
          </el-date-picker>
        </div>
        <div class="work-finish-status">
          <label>{{ $t('caption.status') }}</label>
          <el-select
            v-model="search.finish_work_type"
            :placeholder="$t('common.select')"
          >
            <el-option
              v-for="item in finishStatus"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
        <div class="work-progress-status">
          <label>{{ $t('caption.prog_status') }}</label>
          <el-select
            v-model="search.status"
            multiple
            :placeholder="$t('common.select')"
          >
            <el-option
              v-for="item in progressList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
        <div v-if="$auth.user.user_type == 2 || $auth.user.user_type == 7" class="select-requester">
          <label>{{ $t('caption.choose_requester') }}</label>
          <el-select
            v-model="search.requesters"
            multiple
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
      </div>
      <div class="bottom-filter-container">
        <div class="trans-amount">
          <input-filter-range
            :start-value="search.start_work_price"
            :end-value="search.end_work_price"
            :currency-type="currencySymbols[$auth.user.currency_type]"
            :label="$t('common.trans_amount')"
            @minValChanged="minTransAmtChange"
            @maxValChanged="maxTransAmtChange"
          />
        </div>
        <div class="original-language">
          <label>{{ $t('caption.orglang') }}</label>
          <el-select v-model="search.original_language">
            <el-option
              v-for="item in orglangs"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
        <div class="translate-language">
          <label>{{ $t('caption.translang') }}</label>
          <el-select v-model="search.translate_language">
            <el-option
              v-for="item in translangs"
              :key="item.id"
              :label="item.name"
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
            class="btn-add"
            type="primary"
            icon="el-icon-plus"
            @click="goToRequestPage"
          >
            {{ $t('caption.require_trans') }}
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
              <div>
                {{ $t('common.column_control_desc') }}
              </div>
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
              <span v-else-if="item == 'work_price'">
                {{
                  (currencySymbols[$auth.user.currency_type] + row[item])
                    | numberFormat
                }}
              </span>
              <span v-else>
                -
              </span>
            </template>
            <template v-else>
              <template v-if="item == 'detail'">
                <i
                  v-if="row['can_expand'] == 'N'"
                  class="el-icon-document"
                  @click="viewDetail(row)"
                ></i>
                <template v-else>
                  <i
                    v-if="isExpanded($index)"
                    class="el-icon-circle-plus-outline"
                    @click="toggleExpand(row, $index)"
                  ></i>
                  <i
                    v-else
                    class="el-icon-remove-outline"
                    @click="toggleExpand(row, $index)"
                  ></i>
                </template>
              </template>
              <template v-else-if="item == 'end_type'">
                <el-tag v-if="row[item] == 1" type="danger" effect="dark">
                  {{ $t('caption.completion_status') }}
                </el-tag><!--전체작업완료-->
                <el-tag
                  v-if="row[item] == 2"
                  type="danger"
                  effect="dark"
                  class="partial-completed"
                  :class="$i18n.locale"
                >
                  {{ $t('caption.part_finish') }}
                </el-tag><!--부분작업완료-->
                <el-tag v-if="row[item] == 3" type="warning" effect="plain">
                  {{ $t('caption.in_progress') }}
                </el-tag><!--미완료-->
              </template>
              <!-- <div class="column-container" :style="'text-align: ' + (item=='creator' && scope.row['depth'] == 0 ? 'center' : (item=='title' ? 'center' : 'center')) + ';'"> -->
              <el-tag
                v-else-if="item == 'status'"
                class="progress-status"
                :class="row[item] + ' ' + $i18n.locale"
                :style="
                  'opacity: ' +
                    (row['end_type'] == 2 ||
                      (row['end_type'] == 3 && row['can_expand'] == 'Y')
                      ? '0.4'
                      : '1')
                "
              >
                {{ status[row[item]] }}
              </el-tag>
              <span v-else-if="item == 'work_no'">{{
                row['can_expand'] == 'Y' ? '-' : row[item]
              }}</span>
              <div v-else-if="item == 'title'" class="title" :title="row[item]">
                <a
                  :href="row['youtube_url']"
                  target="_blank"
                ><svg-icon icon-class="youtube" /></a>{{ row[item] }}
              </div>
              <span v-else-if="item == 'work_price'">{{
                (currencySymbols[$auth.user.currency_type] + row[item])
                  | numberFormat
              }}</span>
              <span v-else-if="item == 'duration'">{{
                formatDuration(row[item])
              }}</span>
              <span
                v-else-if="item == 'original_language'"
                class="lang-tag"
                :class="row[item]"
              >{{ row[item] }}</span>
              <template v-else-if="item == 'translate_languages'">
                <span
                  v-for="(lang, i) in row[item]"
                  :key="i"
                  class="lang-tag"
                  :class="lang"
                >
                  {{ lang }}
                </span>
              </template>
              <template
                v-else-if="
                  item == 'original_video' || item == 'translate_video'
                "
              >
                <span v-if="!row[item]">-</span>
                <span
                  v-else
                  class="scene-file-info"
                  @click="downloadFile(row[item])"
                ><i class="el-icon-download"></i></span>
              </template>
              <span
                v-else-if="serviceParams.includes(item)"
                class="support-service"
                :class="row[item]"
              >{{ row[item] }}</span>
              <span v-else-if="item == 'requester'">
                {{ row['requester_user_name'] }}<br />({{
                  row['requester_user_id']
                }})
              </span>
              <span
                v-else-if="item == 'requester_memo'"
                class="requester-memo"
                :title="row['requester_memo']"
              >
                {{ row['requester_memo'] }}
              </span>
              <span
                v-else-if="item == 'request_date' || item == 'predict_end_date'"
              >{{ row[item] | date }}</span>
              <span v-else-if="item == 'end_date'">
                <template v-if="row['end_type'] != 1">-</template>
                <template v-else>{{ row[item] | date }}</template>
              </span>
              <span v-else>{{ row[item] ? row[item] : '-' }}</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column type="expand" width="1" class-name="expand-icon">
          <template slot-scope="{ row }">
            <el-table
              ref="captionChildList"
              :data="row['child']"
              fit
              border
              style="width: 100%;"
              :header-row-class-name="childTableHeaderClassName"
            >
              <el-table-column type="index" width="70" align="center">
                <i class="el-icon-right"></i>
              </el-table-column>
              <el-table-column
                v-for="item in tableColumnOptions"
                :key="item"
                :width="columnWidths[item]"
                align="center"
              >
                <template slot-scope="child">
                  <template v-if="item == 'detail'">
                    <i
                      class="el-icon-document"
                      @click="viewDetail(child.row)"
                    ></i>
                  </template>
                  <template v-else-if="item == 'end_type'">
                    <el-tag
                      v-if="child.row['is_end'] == 'Y'"
                      type="danger"
                      effect="dark"
                    >
                      {{ $t('caption.completion_status') }}
                    </el-tag><!--전체작업완료-->
                    <el-tag v-else type="warning" effect="plain">
                      {{ $t('caption.in_progress') }}
                    </el-tag><!--미완료-->
                  </template>
                  <el-tag
                    v-else-if="item == 'status'"
                    class="progress-status"
                    :class="child.row[item] + ' ' + $i18n.locale"
                  >
                    {{ status[child.row[item]] }}
                  </el-tag>
                  <div v-else-if="item == 'title'" class="title">
                    <a
                      :href="row['youtube_url']"
                      target="_blank"
                    ><svg-icon icon-class="youtube" /></a>{{ child.row[item] }}
                  </div>
                  <span v-else-if="item == 'work_price'">{{
                    (currencySymbols[$auth.user.currency_type] +
                      child.row[item])
                      | numberFormat
                  }}</span>
                  <span v-else-if="item == 'duration'">{{
                    formatDuration(child.row[item])
                  }}</span>
                  <span
                    v-else-if="item == 'original_language'"
                    class="lang-tag"
                    :class="child.row[item]"
                  >{{ child.row[item] }}</span>
                  <span
                    v-else-if="item == 'translate_languages'"
                    class="lang-tag"
                    :class="child.row['translate_language']"
                  >{{ child.row['translate_language'] }}</span>
                  <template
                    v-else-if="
                      item == 'original_video' || item == 'translate_video'
                    "
                  >
                    <span v-if="!child.row[item]">-</span>
                    <span
                      v-else
                      class="scene-file-info"
                      @click="downloadFile(child.row[item])"
                    ><i class="el-icon-download"></i></span>
                  </template>
                  <span
                    v-else-if="serviceParams.includes(item)"
                    class="support-service"
                    :class="row[item]"
                  >{{ row[item] }}</span>
                  <span
                    v-else-if="
                      item == 'request_date' || item == 'predict_end_date'
                    "
                  >{{ row[item] | date }}</span>
                  <span v-else-if="item == 'end_date'">
                    <template v-if="!child.row[item]">-</template>
                    <template v-else>{{ child.row[item] | date }}</template>
                  </span>
                  <span v-else>{{
                    child.row[item] ? child.row[item] : '-'
                  }}</span>
                </template>
              </el-table-column>
            </el-table>
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
// eslint-disable-next-line no-unused-vars
import list from '@/mixin/list'
import * as exportExcel from '@/utils/Export2Excel'

const currencySymbols = {
  JPY: '¥',
  KRW: '₩',
  USD: '$'
}
const defaultColumns = [
  'detail',
  'end_type', // 작업완료
  'status', // 진행상태
  'work_no', // 작업번호
  'requester',
  'title', // 제목
  'duration', // 영상길이
  'original_language', // 원본언어
  'translate_languages', // 번역언어
  'work_price', // 번역금액
  'original_video', // 원본자막
  'translate_video', // 번역자막
  'emergency_request_check',
  'title_request_check',
  'native_review_check',
  'youtube_apply_check',
  'requester_memo',
  'request_date',
  'predict_end_date',
  'end_date'
]

const reqDefaultColumns = [
  'detail',
  'end_type', // 작업완료
  'status', // 진행상태
  'work_no', // 작업번호
  'title', // 제목
  'duration', // 영상길이
  'original_language', // 원본언어
  'translate_languages', // 번역언어
  'work_price', // 번역금액
  'original_video', // 원본자막
  'translate_video', // 번역자막
  'emergency_request_check',
  'title_request_check',
  'native_review_check',
  'youtube_apply_check',
  'requester_memo',
  'request_date',
  'predict_end_date',
  'end_date'
]

const columnWidths = {
  detail: 75,
  end_type: 120,
  status: 120,
  work_no: 90,
  title: 300,
  duration: 120,
  original_language: 90,
  translate_languages: 90,
  work_price: 120,
  original_video: 90,
  translate_video: 90,
  emergency_request_check: 120,
  title_request_check: 120,
  native_review_check: 120,
  youtube_apply_check: 120,
  requester_memo: 200,
  requester: 120,
  request_date: 180,
  predict_end_date: 180,
  end_date: 180
}

export default {
  name: 'CaptionListForRequester',
  // middleware: ['auth', 'auth-comreq'],
  middleware: ['auth', 'stats'],
  mixins: [list],
  async asyncData ({ $axios, params, error }) {
    try {
      const response = await $axios.post('/basic/get-table-info', { list_type: 'caption_list' })
      const { errorCode, data } = response.data

      if (errorCode !== 0) {
        const resp = await $axios.post('/basic/set-table-property', { columns: defaultColumns, list_type: 'caption_list' })
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
      list_type: 'caption_list',
      currencySymbols,
      search: {
        date_type: 1, // 1: 작업요청일시, 2: 작업완료일시
        start_date: '',
        end_date: '',
        finish_work_type: 0, // 1: 작업전체완료, 2: 작업부분완료, 3: 작업미완료
        requesters: [], // 고객사인 경우
        status: [], // preset: 전체, ['preparing', 'tc_ings']: 준비중, TC작업중
        original_language: 0, // 0: 전체
        translate_language: 0, // 0: 전체
        keyword_type: 1, // 1: 제목, 2: 작업번호
        search_keyword: '',
        search_type: 1 // 1: 포함, 2: 일치
      },
      dateTypes: [
        { value: 1, label: this.$t('caption.work_require_time') },
        { value: 2, label: this.$t('caption.work_finish_time') }
      ],
      // columnWidths,
      serviceParams: [
        'emergency_request_check',
        'title_request_check',
        'native_review_check',
        'youtube_apply_check'
      ],
      finishStatus: [
        { value: 0, label: this.$t('caption.select') },
        { value: 1, label: this.$t('caption.work_all_finish') },
        { value: 2, label: this.$t('caption.work_part_finish') },
        { value: 3, label: this.$t('caption.work_no_finish') }
      ],
      progressList: [
        { value: 'preparing', label: this.$t('caption.prog_ready') },
        { value: 'tc_ing', label: this.$t('caption.prog_tc_do') },
        { value: 'tc_complete', label: this.$t('caption.prog_tc_finish') },
        { value: 'translating', label: this.$t('caption.prog_trans_do') },
        {
          value: 'translation_complete',
          label: this.$t('caption.prog_trans_finish')
        },
        { value: 'reviewing', label: this.$t('caption.prog_review_do') },
        {
          value: 'review_complete',
          label: this.$t('caption.prog_review_finish')
        },
        { value: 'subtitle_apply', label: this.$t('caption.prog_cation_apply') }
      ],
      requesterList: [],
      orglangs: [
        {
          id: 0,
          name: this.$t('common.select')
        }
      ],
      translangs: [
        {
          id: 0,
          name: this.$t('common.select')
        }
      ],
      searchFields: [
        { value: 1, label: this.$t('caption.title') },
        { value: 2, label: this.$t('caption.work_no') },
        { value: 3, label: this.$t('caption.requester_memo') }
      ],
      status: {
        preparing: this.$t('caption.prog_ready'), // 준비중
        tc_ing: this.$t('caption.prog_tc_do'), // TC중
        tc_complete: this.$t('caption.prog_tc_finish'), // TC완료
        translating: this.$t('caption.prog_trans_do'), // 번역중
        translation_complete: this.$t('caption.prog_trans_finish'), // 번역완료
        reviewing: this.$t('caption.prog_review_do'), // 검수중
        review_complete: this.$t('caption.prog_review_finish'), // 검수완료
        subtitle_apply: this.$t('caption.prog_cation_apply'), // 자막적용
        subtitle_apply_failed: this.$t('caption.subtitle_apply_failed') // 자막적용 실패
      }
    }
  },
  computed: {
    ...mapGetters({ rowExpand: 'app/rowExpand' })
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
    this.$store.dispatch('app/initRowExpand')
    // this.initTableColumnData()
    this.getList()
    this.getLangPairs()
    if (this.$auth.user.user_type === 2 || this.$auth.user.user_type === 7) {
      this.getRequesterList()
    }
  },
  methods: {
    initTableColumnData () {
      if (this.$auth.user.user_type === 2) {
        this.totalColumns = defaultColumns
        this.tableColumnOptions = defaultColumns
        this.columnCheckVal = defaultColumns
      } else {
        this.totalColumns = reqDefaultColumns
        this.tableColumnOptions = reqDefaultColumns
        this.columnCheckVal = reqDefaultColumns
      }
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
    async getLangPairs () {
      try {
        const response = await this.$axios.post('/company/get-language-pairs')
        const { errorCode, data } = response.data
        if (errorCode === 0) {
          data.map((item) => {
            const orgMatched = this.orglangs.filter(
              lang => lang.id === item.original_language.id
            )
            if (orgMatched.length === 0) {
              // console.log('item.original_language--', item.original_language)
              item.original_language.name = this.$t(
                'common.' + item.original_language.name
              )
              this.orglangs.push(item.original_language)
            }
            const transMatched = this.translangs.filter(
              lang => lang.id === item.translate_language.id
            )
            if (transMatched.length === 0) {
              item.translate_language.name = this.$t(
                'common.' + item.translate_language.name
              )
              this.translangs.push(item.translate_language)
            }
          })
        }
      } catch (err) {}
    },
    isExpanded (rowIndex) {
      const matched = this.rowExpand.filter(item => item.rowIndex === rowIndex)
      if (matched.length > 0) {
        return matched[0].isExpanded
      } else {
        return true
      }
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
    goToRequestPage () {
      this.$router.push('/caption/add')
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
      // filterVal.push('child') // for child data
      this.downloadLoading = true
      const data = await this.formatJson(filterVal)
      exportExcel.exportJsonToExcel({
        header: tHeader,
        data,
        filename: 'list_of_caption'
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
        const response = await this.$axios.post(
          '/subtitle-history/get-request-list',
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
          } else if (j === 'end_type') {
            if (v[j] === 1) {
              return this.$t('caption.work_completed')
            } else if (v[j] === 2) {
              return this.$t('caption.work_partial_completed')
            } else {
              return this.$t('caption.work_incomplete')
            }
          } else if (j === 'status') {
            return this.status[v[j]]
          } else if (j === 'duration') {
            return this.formatDuration(v[j])
          } else if (j === 'work_price') {
            return (
              this.currencySymbols[this.$auth.user.currency_type] +
              this.$options.filters.numberFormat(v[j])
            )
          } else if (j === 'requester') {
            return v.requester_user_name + '(' + v.requester_user_id + ')'
          } else if (j === 'request_date' || j === 'predict_end_date') {
            return this.$options.filters.date(v[j])
          } else if (j === 'end_date') {
            if (v.end_type !== 1) {
              return ''
            } else {
              return this.$options.filters.date(v[j])
            }
          } else {
            return v[j]
          }
        })
      )
    },
    minTransAmtChange (val) {
      this.search.start_work_price = val
    },
    maxTransAmtChange (val) {
      this.search.end_work_price = val
    },
    async getList () {
      this.$store.dispatch('app/initRowExpand')
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
      if (searchParams.finish_work_type === 0) {
        delete searchParams.finish_work_type
      }
      if (searchParams.requesters.length === 0) {
        delete searchParams.requesters
      }
      try {
        const response = await this.$axios.post(
          '/subtitle-history/get-request-list',
          {
            table: { page, page_length },
            search: searchParams
          }
        )
        this.list = response.data.data.list
        this.list.unshift({
          duration: response.data.data.duration_sum,
          work_price: response.data.data.work_price_sum
        })
        this.total = response.data.data.totalCount
      } catch (err) {
        this.list = []
        this.total = 0
        console.log(err)
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
      } else {
        return 'odd-row'
      }
    },
    childTableHeaderClassName ({ row, rowIndex }) {
      return 'child-table-header'
    },
    viewDetail (row) {
      const popupSize =
        'width=' +
        this.variables.popupWidth +
        ',height=' +
        this.variables.popupHeight
      window.open('/caption/detail/' + row.work_no, '_blank', popupSize)
    },
    toggleExpand (row, index) {
      this.$store.dispatch('app/toggleRowExpand', index)
      this.$refs.captionList.toggleRowExpansion(row)
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
    .work-finish-status {
      .el-select {
        width: 200px;
      }
    }
    .work-progress-status,
    .select-requester {
      .el-select {
        width: 200px;
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
    .original-language,
    .translate-language {
      .el-select {
        width: 100px;
      }
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
  .el-icon-circle-plus-outline {
    cursor: pointer;
  }
}
.scene-file-info {
  cursor: pointer;
}
.partial-completed.en {
  /* opacity: 0.4; */
  white-space: normal !important;
  height: auto !important;
  line-height: 20px !important;
}
.requester-memo {
  white-space: nowrap;
}

::v-deep {
  // hidden expand icon
  .table-card .expand-icon {
    div.cell {
      padding: 0px !important;
    }
  }
  .child-table-header {
    display: none;
  }
  td.el-table__expanded-cell {
    padding: 0px;
    .el-table__body-wrapper {
      overflow: hidden;
      .el-table__row {
        background: #f3f3f3;
      }
    }
  }
}
</style>
