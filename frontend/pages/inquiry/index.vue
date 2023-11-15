<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('inquiry.list') }}
    </div>
    <el-card class="box-card search-box">
      <div class="top-filter-container">
        <div class="period">
          <label>{{ $t('inquiry.period') }}</label>
          <el-select v-model="period" @change="onPeriodChange">
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
        <search-filter-item
          v-if="$auth.user.user_type == 1 || $auth.user.user_type == 2 || $auth.user.user_type == 7"
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
        <div v-else class="title-input-box mr10">
          <label class="title">{{ $t('inquiry.title') }}</label>
          <el-input
            v-model="search.search_keyword"
            @keyup.enter.native="handleFilter"
          ></el-input>
        </div>
        <el-button
          v-if="$auth.user.user_type > 1"
          class="btn-search"
          type="primary"
          icon="el-icon-search"
          @click="handleFilter"
        >
          {{ $t('common.search') }}
        </el-button>
      </div>
      <div v-if="$auth.user.user_type == 1" class="bottom-filter-container">
        <div class="creator-type">
          <label>{{ $t('inquiry.user_type') }}</label>
          <el-select
            v-model="search.user_type"
            multiple
            :placeholder="$t('common.select')"
          >
            <el-option
              v-for="(item, i) in userTypeArray"
              :key="i"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
        <custom-check-box
          :is-checked="search.notice_check === 'Y' ? true : false"
          :label="$t('inquiry.view_only_announce')"
          :border="true"
          class="announce-checkbox"
          @checkChanged="announceCheckChange"
        >
        </custom-check-box>
        <el-button
          class="btn-search"
          type="primary"
          icon="el-icon-search"
          @click="handleFilter"
        >
          {{ $t('common.search') }}
        </el-button>
      </div>
    </el-card>
    <el-card class="box-card table-card">
      <label class="total-count">
        {{ $t('table.total_count', { total: total }) }}
      </label>
      <div class="table-header">
        <i
          v-if="$auth.user.user_type == 1"
          class="el-icon-delete"
          @click="delInquiry"
        ></i>
        <div class="table-header-actions">
          <el-button
            class="filter-item btn-add"
            type="primary"
            icon="el-icon-plus"
            @click="handleCreate"
          >
            {{ $t('inquiry.register') }}
          </el-button>
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
        header-cell-class-name="inquiry-header-cell"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          v-if="$auth.user.user_type == 1"
          type="selection"
          width="55"
          align="center"
        ></el-table-column>
        <el-table-column
          :label="$t('table.no')"
          type="index"
          :width="$i18n.locale == 'en' ? 130 : 80"
          align="center"
          :index="indexMethod"
        >
          <template slot-scope="scope">
            <el-tag v-if="scope.row['type'] == 2" type="danger" effect="dark">
              {{ $t('inquiry.announce') }}
            </el-tag>
            <span v-else>{{ indexMethod(scope.$index) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-for="item in getColumns"
          :key="item"
          :label="$t('inquiry.' + item)"
          :width="columnWidths[item]"
          :align="item == 'title' ? 'left' : 'center'"
        >
          <template slot-scope="scope">
            <!-- <div class="column-container" :style="'text-align: ' + (item=='creator' && scope.row['depth'] == 0 ? 'center' : (item=='title' ? 'center' : 'center')) + ';'"> -->
            <div class="column-container">
              <span v-if="item == 'reg_date'">{{
                scope.row[item] | date
              }}</span>
              <template v-else-if="item == 'title'">
                <span v-if="scope.row['delete'] == 'Y'">{{
                  $t('inquiry.deleted_inquiry')
                }}</span>
                <nuxt-link
                  v-else
                  :to="'/inquiry/detail/' + scope.row['id']"
                  class="detail-link-inquiry"
                >
                  <span v-if="scope.row['depth'] > 0">ㄴ▶</span>
                  {{ scope.row['title'] }}&nbsp;
                  <span
                    v-if="scope.row['comment_count'] > 0"
                    class="comment-count"
                  >{{ '[' + scope.row['comment_count'] + ']' }}</span>&nbsp;
                  <span v-if="scope.row['is_new'] == 'Y'" class="new-tag">
                    N
                  </span>
                  <i v-if="scope.row['attach_count'] > 0" class="el-icon-link"></i>
                </nuxt-link>
              </template>
              <span v-else-if="item == 'user_type'">{{
                userTypes[scope.row[item]]
              }}</span>
              <span v-else-if="item == 'creator'">{{
                scope.row['creator_user_name'] +
                  '(' +
                  scope.row['creator_user_id'] +
                  ')'
              }}</span>
              <span v-else>{{ scope.row[item] }}</span>
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

const userTypeArray = [
  { value: 'requester', label: '요청자' },
  { value: 'company', label: '고객사' },
  { value: 'tc', label: 'TC작업자' },
  { value: 'translator', label: '번역가' },
  { value: 'reviewer', label: '검수자' },
  { value: 'admin', label: '관리자' }
]

const defaultColumns = ['title', 'user_type', 'creator', 'reg_date']

const columnWidths = {
  title: '',
  user_type: 150,
  creator: 180,
  reg_date: 180
}

export default {
  name: 'InquiryList',
  middleware: ['auth', 'stats'],
  mixins: [list],
  data () {
    return {
      userTypes: {
        1: this.$t('user_type.admin'),
        2: this.$t('user_type.company'),
        3: this.$t('user_type.requester'),
        4: this.$t('user_type.tc'),
        5: this.$t('user_type.translator'),
        6: this.$t('user_type.reviewer'),
        7: this.$t('user_type.manager')
      },
      userTypeArray,
      period: 4,
      dateRange: [],
      searchFields: [
        { value: 1, label: this.$t('inquiry.title') },
        { value: 2, label: this.$t('inquiry.author_name') },
        { value: 3, label: this.$t('inquiry.author_id') }
      ],
      // table data
      tableColumnOptions: defaultColumns,
      columnWidths,
      search: {
        start_date: '',
        end_date: '',
        keyword_type: 1, // 1: 제목, 2: 작성자명, 3: 작성자ID
        search_keyword: '', // 검색어
        search_type: 1, // 1: 포함, 2: 일치
        notice_check: 'N',
        user_type: []
      },
      creators: []
    }
  },
  computed: {
    getColumns () {
      if (this.$auth.user.user_type === 1) {
        return defaultColumns
      } else {
        return defaultColumns.filter(column => column !== 'user_type')
      }
    }
  },
  created () {
    this.getList()
  },
  methods: {
    async getList () {
      this.listLoading = true
      // eslint-disable-next-line camelcase
      const { page, page_length } = this.table
      // const searchParams = Object.assign({}, this.search)
      if (this.$auth.user.user_type === 2 || this.$auth.user.user_type === 7) {
        // company case
        delete this.search.user_type
        delete this.search.notice_check
      }
      if (this.$auth.user.user_type > 2 && this.$auth.user.user_type < 7) {
        delete this.search.user_type
        delete this.search.notice_check
        delete this.search.keyword_type
        delete this.search.search_type
      }
      if (this.dateRange.length === 2) {
        const startDate = this.setDateFormat((isNaN(parseInt(this.dateRange[0])) ? this.dateRange[0] : new Date(parseInt(this.dateRange[0]))))
        const endDate = this.setDateFormat((isNaN(parseInt(this.dateRange[1])) ? this.dateRange[1] : new Date(parseInt(this.dateRange[1]))))
        this.search.start_date = Math.floor(new Date(startDate).getTime() / 1000) + (new Date()).getTimezoneOffset() * 60
        this.search.end_date = Math.floor(new Date(endDate).getTime() / 1000) + 86399 + (new Date()).getTimezoneOffset() * 60
      }
      try {
        const response = await this.$axios.post('/inquiry/get-inquiry-list', {
          table: { page, page_length },
          search: this.search
        })
        this.list = response.data.data.list
        this.total = response.data.data.totalCount
      } catch (err) {
        console.log(err)
      } finally {
        this.listLoading = false
      }
      // eslint-disable-next-line camelcase
      /* const { page, page_length } = this.table
      const searchParams = Object.assign({}, this.search) */
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
    announceCheckChange (announce) {
      if (announce) {
        this.search.notice_check = 'Y'
      } else {
        this.search.notice_check = 'N'
      }
    },
    handleFilter () {
      this.table.page = 1
      this.getList()
    },
    delInquiry () {
      if (this.multipleSelection.length === 0) {
        this.$alert(
          this.$t('validation.select_del_inquiry'),
          this.$t('validation.delete'),
          {
            confirmButtonText: this.$t('common.ok')
          }
        )
      } else {
        this.$confirm(
          this.$t('validation.confirm_del_inquiry'),
          this.$t('validation.delete'),
          {
            confirmButtonText: this.$t('common.ok'),
            cancelButtonText: this.$t('common.no')
          }
        )
          .then(async () => {
            this.listLoading = true
            const idList = []
            this.multipleSelection.map((select) => {
              idList.push(select.id)
            })
            const response = await this.$axios.post('/inquiry/delete-inquiry', {
              inquiry_ids: idList
            })
            if (response.data.errorCode === 0) {
              this.$message({
                type: 'success',
                message: this.$t('inquiry.del_success')
              })
              this.getList()
            } else {
              this.$message({
                type: 'warning',
                message: this.$t('validation.delete_fail')
              })
              this.listLoading = false
            }
          })
          .catch(() => {})
      }
    },
    handleCreate () {
      this.$router.push('/inquiry/add')
    },
    // For custom class names
    tableRowClassName ({ row, rowIndex }) {
      if (this.list[rowIndex].type === 2) {
        return 'announce-row'
      } else {
        return ''
      }
    },
    handleSelectionChange (val) {
      this.multipleSelection = val
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.top-filter-container {
  .period {
    display: inline-flex;
    align-items: center;
    .el-select {
      width: 100px;
      margin-right: 5px;
    }
    .el-date-editor {
      width: 260px;
      margin-right: 20px;
    }
  }
  .title-input-box {
    display: inline-flex;
    align-items: center;
    label.title {
      width: 90px;
    }
  }
}

.bottom-filter-container {
  .announce-checkbox {
    height: 40px;
    margin-left: 20px;
    margin-right: 10px;
  }
  .creator-type {
    display: inline-flex;
    align-items: center;
    .el-select {
      width: 300px;
      margin-right: 10px;
    }
  }
}
.table-card {
  .table-header {
    .btn-add {
      margin-right: 0px;
    }
  }
  .comment-count {
    font-weight: bold;
    color: $inquiryNewTagColor;
  }
  .new-tag {
    background-color: red;
    display: flex;
    border-radius: 50%;
    color: white;
    font-size: 10px;
    width: 14px;
    height: 14px;
    align-items: center;
    justify-content: center;
    margin-right: 5px;
    // padding: 0px 6px;
  }
}

.detail-link-inquiry {
  display: flex;
  align-items: center;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.table-card .table-header {
  justify-content: space-between;
}

.el-icon-link {
  font-size: 18px;
}

::v-deep {
  .search-item {
    .search-field {
      width: 150px;
    }
    .search-input {
      width: 250px;
    }
  }
  .el-checkbox__label {
    line-height: 19px !important;
  }
}
</style>
