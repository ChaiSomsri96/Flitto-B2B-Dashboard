<template>
  <div class="app-container">
    <el-row type="flex" justify="space-between" align="middle">
      <div class="page-title">
        {{ $t('notification.list') }}
      </div>
      <div class="note">
        {{ $t('notification.note') }}
      </div>
    </el-row>
    <el-card v-loading="loading" class="box-card">
      <el-timeline>
        <div v-if="noticeList.length == 0">
          {{ $t('notice.no_list') }}
        </div>
        <el-timeline-item
          v-for="(item, i) in noticeList"
          v-else
          :key="i"
          :timestamp="item.base_date | notice_date($i18n.locale)"
          placement="top"
          :type="i == 0? 'primary' : 'success'"
          :size="'large'"
        >
          <notify-board-item
            v-for="(item_detail, index) in item.details"
            :key="index"
            :notice-data="item_detail"
          />
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>
<script>
import NotifyBoardItem from '@/components/common/NotifyBoardItem'

export default {
  name: 'NotificationList',
  components: { NotifyBoardItem },
  layout: 'default',
  middleware: ['auth', 'stats'],
  async fetch () {
    this.loading = true
    try {
      const noticeRes = await this.$axios.post('/notice/get-notice-list')
      this.noticeList = noticeRes.data.data
    } catch (err) {
    }
    this.loading = false
  },
  data () {
    return {
      loading: false,
      noticeList: [],
      color: '#358BFA',
      text: '"장인정신을 보여드리겠습니다."의 한글->영어, 일본어 번역이 요청되었습니다.'
    }
  },
  created () {
    this.updateNoiceRead()
  },
  methods: {
    async updateNoiceRead () {
      try {
        const response = await this.$axios.post('/notice/update-notice-unread')
        const { errorCode } = response.data
        if (errorCode === 0) {
          const response1 = await this.$axios.post('/notice/get-notice-count')
          await this.$store.dispatch('app/setNoticeCount', response1.data.data)
        }
      } catch {
      }
    }
  }
}
</script>
<style lang="scss" scoped>
::v-deep {
  .el-timeline {
    padding-left: 20px;
  }
  .el-timeline-item__timestamp {
    font-size: 14px;
    font-weight: bold;
    color: black;
    margin-bottom: 18px;
  }
}
</style>
