import draggable from 'vuedraggable'
import Pagination from '@/components/Pagination'
import SearchFilterItem from '@/components/common/SearchFilterItem.vue'
import InputFilterRange from '@/components/common/InputFilterRange.vue'
import variables from '@/assets/styles/variables.scss'

const currencySymbols = {
  JPY: '¥',
  KRW: '₩',
  USD: '$'
}

export default {
  components: { SearchFilterItem, InputFilterRange, Pagination, draggable },
  data () {
    return {
      table: {
        page: 1,
        page_length: 10
      },
      /** for table columns' availability and order */
      checkAllColumns: false,
      isIndeterminate: true,
      dragging: false,
      totalColumns: [],
      tableColumnOptions: [],
      columnCheckVal: [],
      /** for multi-selection table rows */
      multipleSelection: [],
      /** for table variables */
      tableKey: 0, // table index
      list: null, // list data
      total: 0, // total number
      listLoading: false,
      /** for excel export */
      excelList: null,
      downloadLoading: false,

      /** for period change in caption list */
      period: 2, // default 30일
      periods: [
        this.$t('caption.today'),
        this.$t('caption.day_7'),
        this.$t('caption.day_30'),
        this.$t('caption.day_60'),
        this.$t('caption.day_90'),
        this.$t('caption.year_1'),
        this.$t('caption.all')
      ],
      dateRange: [], // start date ~ end date
      /** constant */
      currencySymbols,
      variables
    }
  },
  watch: {
    async columnCheckVal (valArr) {
      console.log('changed', valArr)
      this.tableColumnOptions = this.totalColumns.filter(i => valArr.includes(i))
      this.tableKey = this.tableKey + 1 // 为了保证table 每次都会重渲 In order to ensure the table will be re-rendered each time
      const resp = await this.$axios.post('/basic/set-table-property', { columns: valArr, list_type: this.list_type })
      const { errorCode } = resp.data
      console.log(errorCode)
    },
    totalColumns (newVal) {
      this.tableColumnOptions = newVal.filter(i => this.columnCheckVal.includes(i))
      this.tableKey = this.tableKey + 1
    }
  },
  methods: {
    async headerwidthChange (newWidth, oldWidth, column, event) {
      let _property = ''
      if (isNaN(parseInt(column.property))) { _property = column.property } else { _property = this.tableColumnOptions[column.property - 1] }
      // console.log(_property)
      const resp = await this.$axios.post('/basic/set-table-width', { width: newWidth, column: _property, list_type: this.list_type })
      const { errorCode } = resp.data
      console.log(errorCode)
    },
    setRouteParams () {
      const routeParams = this.$route.params
      if (routeParams.dateType) {
        this.search.date_type = routeParams.dateType
      }
      if (routeParams.period !== undefined) {
        this.period = parseInt(routeParams.period)
        this.onPeriodChange()
      }
      if (routeParams.finishWorkType) {
        this.search.finish_work_type = routeParams.finishWorkType
      }
      if (routeParams.status) {
        this.search.status.push(routeParams.status)
      }
      if (routeParams.company) {
        this.search.companies.push(routeParams.company)
      }
      if (routeParams.requester) {
        this.search.requesters.push(routeParams.requester)
      }
      if (routeParams.startDate) {
        this.search.start_date = routeParams.startDate
        this.dateRange.push(routeParams.startDate)
      }
      if (routeParams.endDate) {
        this.search.end_date = routeParams.endDate
        this.dateRange.push(routeParams.endDate)
      }
    },
    setRouteQuery () {
      const routeQuery = this.$route.query
      if (routeQuery.dateType) {
        this.search.date_type = parseInt(routeQuery.dateType)
      }
      if (routeQuery.finishWorkType) {
        this.search.finish_work_type = parseInt(routeQuery.finishWorkType)
      }
      if (routeQuery.companies) { // 월별통합에서 요청자검색대상
        this.search.companies = JSON.parse(routeQuery.companies)
      }
      if (routeQuery.requesters) { // 월별통합에서 요청자검색대상
        this.search.requesters = JSON.parse(routeQuery.requesters)
      }
      if (routeQuery.startDate) {
        this.dateRange.push(routeQuery.startDate, routeQuery.endDate)
      }
      if (routeQuery.status) { // 작업자별 진행상태 완료기준
        if (Array.isArray(routeQuery.status)) {
          for (let i = 0; i < routeQuery.status.length; i++) { this.search.status.push(routeQuery.status[i]) }
        } else { this.search.status.push(routeQuery.status) }
      }
      if (routeQuery.company) { // 고객사별 통합
        this.search.companies.push(parseInt(routeQuery.company))
      }
      if (routeQuery.requester) { // 요청자별 통합
        this.search.requesters.push(parseInt(routeQuery.requester))
      }
      if (routeQuery.tc) { // TC작업자별 통합
        this.search.tc_users.push(parseInt(routeQuery.tc))
      }
      if (routeQuery.translator) { // 번역가별 통합
        this.search.translate_users.push(parseInt(routeQuery.translator))
      }
      if (routeQuery.reviewer) { // 검수자별 통합
        this.search.review_users.push(parseInt(routeQuery.reviewer))
      }
    },
    initDateRange () {
      this.dateRange = []
      const curDate = new Date()
      const endDate = curDate.getTime()
      const startDate = curDate.setMonth(curDate.getMonth() - 1)
      this.dateRange.push(startDate, endDate)
    },
    setDateFormat (date) {
      const year = date.getFullYear()
      let mm = date.getMonth() + 1
      let dd = date.getDate()
      if (mm < 10) { mm = '0' + mm }
      if (dd < 10) { dd = '0' + dd }
      return year + '-' + mm + '-' + dd
    },
    handleCheckAllColumnChange (val) {
      this.columnCheckVal = val ? this.totalColumns : []
      this.isIndeterminate = false
    },
    handleCheckedColumnChange (value) {
      const checkedCount = value.length
      this.checkAllColumns = checkedCount === this.totalColumns.length
      this.isIndeterminate = checkedCount > 0 && checkedCount < this.totalColumns.length
    },
    handleSelectionChange (val) {
      this.multipleSelection = val
    },
    indexMethod (index) {
      // descending order
      return this.total - ((this.table.page - 1) * this.table.page_length + index)
    },
    formatDuration (duration) {
      if (!duration) {
        return '0h 0m 0s'
      }
      const secNum = parseInt(duration, 10) // don't forget the second param
      const hours = Math.floor(secNum / 3600)
      const minutes = Math.floor((secNum - (hours * 3600)) / 60)
      const seconds = secNum - (hours * 3600) - (minutes * 60)
      return hours + 'h ' + minutes + 'm ' + seconds + 's'
    },
    onPeriodChange () {
      this.dateRange = []
      if (this.period === 6) {
        return
      }
      const curDate = new Date()
      const endDate = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate(), 23, 59, 59).getTime()
      let startDate
      switch (this.period) {
        case 0: // today
          startDate = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate(), 0, 0, 0).getTime()
          break
        case 1:
          startDate = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate() - 7, 0, 0, 0) // week ago
          break
        case 2:
          startDate = new Date(curDate.getFullYear(), curDate.getMonth() - 1, curDate.getDate(), 0, 0, 0) // one month ago
          break
        case 3:
          startDate = new Date(curDate.getFullYear(), curDate.getMonth() - 2, curDate.getDate(), 0, 0, 0) // two months ago
          break
        case 4:
          startDate = new Date(curDate.getFullYear(), curDate.getMonth() - 3, curDate.getDate(), 0, 0, 0) // threee months ago
          break
        case 5:
          startDate = new Date(curDate.getFullYear() - 1, curDate.getMonth(), curDate.getDate(), 0, 0, 0) // one year ago
          break
        default:
          break
      }
      this.dateRange.push(startDate, endDate)
    },
    downloadFile (fileName) {
      const https = process.env.HTTP
      const host = process.env.API_HOST
      const port = process.env.API_PORT
      location.href = https + '://' + host + ':' + port + '/basic/file-download?file_name=' + fileName + '&type=translate'
    }
  }
}
