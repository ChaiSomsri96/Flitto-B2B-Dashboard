<template>
  <el-card>
    <div
      class="container"
      :class="{ 'other-task-assigned': noticeData.other }"
      @click="viewDetail(noticeData.id)"
    >
      <div class="left-items">
        <div class="youtube-icon">
          <svg-icon icon-class="youtube" />
        </div>
        <div class="content">
          {{ noticeTitle }}
        </div>
      </div>
      <div class="right-items">
        <div
          v-if="
            $auth.user.user_type == 1 &&
              (noticeData.type == 'admin_a01' ||
                noticeData.type == 'admin_a02' ||
                noticeData.type == 'admin_a04' ||
                noticeData.type == 'admin_a06' ||
                noticeData.type == 'admin_a08' ||
                noticeData.type == 'admin_a09' ||
                noticeData.type == 'admin_a10')
          "
          class="company-info"
        >
          {{ $t("user_type.company") }} {{ noticeData.companyname }}
        </div>
        <div v-if="($auth.user.user_type == 2 || $auth.user.user_type == 7) && noticeData.type != 'client_a03' && noticeData.type != 'client_a04'" class="requester-info">
          {{ $t("user_type.requester") }} {{ noticeData.requester }}
        </div>
        <div
          v-if="
            $auth.user.user_type == 1 &&
              noticeData.type != 'admin_a03' &&
              noticeData.type != 'admin_a05' &&
              noticeData.type != 'admin_a07' &&
              noticeData.type != 'admin_a11' &&
              noticeData.type != 'admin_a12' &&
              noticeData.type != 'admin_a13'
          "
          class="requester-info"
        >
          {{ $t("user_type.requester") }} {{ noticeData.username }}
        </div>
        <div
          v-if="$auth.user.user_type == 1 && noticeData.type == 'admin_a03'"
          class="requester-info"
        >
          {{ $t("user_type.tc") }} {{ noticeData.username }}
        </div>
        <div
          v-if="$auth.user.user_type == 1 && noticeData.type == 'admin_a05'"
          class="requester-info"
        >
          {{ $t("user_type.translator") }} {{ noticeData.username }}
        </div>
        <div
          v-if="$auth.user.user_type == 1 && noticeData.type == 'admin_a07'"
          class="requester-info"
        >
          {{ $t("user_type.reviewer") }} {{ noticeData.username }}
        </div>
        <div v-if="noticeData.type == 'requestor_a02' || noticeData.type == 'client_a03' || noticeData.type == 'tc_a05' || noticeData.type == 'translator_a05' || noticeData.type == 'reviewer_a05' || noticeData.type == 'admin_a12'" class="requester-info">
          {{ $t('notice.notice_reply_user') }} {{ noticeData.username }}
        </div>
        <div v-if="noticeData.type == 'requestor_a03' || noticeData.type == 'client_a04' || noticeData.type == 'tc_a06' || noticeData.type == 'translator_a06' || noticeData.type == 'reviewer_a06' || noticeData.type == 'admin_a13'" class="requester-info">
          {{ $t('notice.notice_comment_user') }} {{ noticeData.username }}
        </div>
        <div v-if="noticeData.type == 'admin_a11'" class="requester-info">
          {{ $t('notice.inquiry_user') }} {{ noticeData.username }}
        </div>
        <div class="datetime">
          {{ noticeData.end_date | date }}
        </div>
      </div>
    </div>
  </el-card>
</template>

<script>
export default {
  name: 'NotifyBoardItem',
  props: {
    noticeData: {
      type: Object,
      default: null
    }
  },
  data () {
    return {}
  },
  computed: {
    noticeTitle () {
      if (this.noticeData.type === 'client_a01' || this.noticeData.type === 'requestor_a01') {
        let langPairs = this.$t('common.' + this.noticeData.original_language) + '->' + this.$t('common.' + this.noticeData.translate_language[0])
        for (let i = 1; i < this.noticeData.translate_language.length; i++) { langPairs += ', ' + this.$t('common.' + this.noticeData.translate_language[i]) }
        return this.$t('notice.' + this.noticeData.type, { title: this.noticeData.title, lang: langPairs })
      } else if (this.noticeData.type === 'tc_a01' || this.noticeData.type === 'tc_a02' || this.noticeData.type === 'tc_a03') {
        return this.$t('notice.' + this.noticeData.type, { title: this.noticeData.title, org_lang: this.$t('common.' + this.noticeData.original_language) })
      } else if (this.noticeData.type === 'translator_a01' || this.noticeData.type === 'translator_a02' || this.noticeData.type === 'translator_a03') {
        return this.$t('notice.' + this.noticeData.type, { title: this.noticeData.title, org_lang: this.$t('common.' + this.noticeData.original_language), dst_lang: this.$t('common.' + this.noticeData.translate_language) })
      } else if (this.noticeData.type === 'reviewer_a01' || this.noticeData.type === 'reviewer_a02' || this.noticeData.type === 'reviewer_a03') {
        return this.$t('notice.' + this.noticeData.type, { title: this.noticeData.title, dst_lang: this.$t('common.' + this.noticeData.translate_language) })
      } else if (this.noticeData.type === 'admin_a01' || this.noticeData.type === 'admin_a10' || this.noticeData.type === 'admin_a08' || this.noticeData.type === 'admin_a09') {
        let langPairs = this.$t('common.' + this.noticeData.original_language) + '->' + this.$t('common.' + this.noticeData.translate_language[0])
        for (let i = 1; i < this.noticeData.translate_language.length; i++) { langPairs += ', ' + this.$t('common.' + this.noticeData.translate_language[i]) }
        return this.$t('notice.' + this.noticeData.type, { title: this.noticeData.title, lang: langPairs })
      } else if (this.noticeData.type === 'admin_a03' || this.noticeData.type === 'admin_a02') {
        return this.$t('notice.' + this.noticeData.type, { title: this.noticeData.title, org_lang: this.$t('common.' + this.noticeData.original_language) })
      } else if (this.noticeData.type === 'admin_a04' || this.noticeData.type === 'admin_a05') {
        return this.$t('notice.' + this.noticeData.type, { title: this.noticeData.title, org_lang: this.$t('common.' + this.noticeData.original_language), dst_lang: this.$t('common.' + this.noticeData.translate_language) })
      } else if (this.noticeData.type === 'requestor_a02' || this.noticeData.type === 'requestor_a03' ||
            this.noticeData.type === 'client_a03' || this.noticeData.type === 'client_a04' ||
            this.noticeData.type === 'tc_a05' || this.noticeData.type === 'tc_a06' ||
            this.noticeData.type === 'translator_a05' || this.noticeData.type === 'translator_a06' ||
            this.noticeData.type === 'reviewer_a05' || this.noticeData.type === 'reviewer_a06' ||
            this.noticeData.type === 'admin_a11' || this.noticeData.type === 'admin_a12' || this.noticeData.type === 'admin_a13') {
        return this.$t('notice.' + this.noticeData.type, { title: this.noticeData.title })
      } else {
        return this.$t('notice.' + this.noticeData.type, {
          title: this.noticeData.title,
          dst_lang: this.$t('common.' + this.noticeData.translate_language)
        })
      }
    }
  },
  methods: {
    async viewDetail (id) {
      try {
        if (this.noticeData.notice_category === 1) {
          if (this.noticeData.other) {
            if (this.$auth.user.user_type === 4) {
              this.$message.error(this.$t('notice.worker_tc_not_able_assigned'))
            } else if (this.$auth.user.user_type === 5) {
              this.$message.error(
                this.$t('notice.worker_translator_not_able_assigned')
              )
            } else if (this.$auth.user.user_type === 6) {
              this.$message.error(
                this.$t('notice.worker_reviewer_not_able_assigned')
              )
            }
            return
          }
          if (
            this.$auth.user.user_type === 1 ||
              this.$auth.user.user_type === 2 ||
              this.$auth.user.user_type === 3 ||
              this.$auth.user.user_type === 7
          ) {
            window.open(
              '/caption/detail/' + id,
              '_blank',
              'width=1200,height=700'
            )
          } else if (
            this.$auth.user.user_type === 4 ||
              this.$auth.user.user_type === 5 ||
              this.$auth.user.user_type === 6
          ) {
            if (this.$auth.user.user_type === 4) {
              const resp = await this.$axios.post(
                '/subtitle-worker/tc-detail-check',
                {
                  id
                }
              )
              const { errorCode } = resp.data
              if (errorCode === 0) {
                window.open(
                  '/caption/detail/worker/' + id,
                  '_blank',
                  'width=1200,height=700'
                )
              } else {
                this.$message.error(
                  this.$t('notice.worker_tc_not_able_assigned')
                )
              }
            } else {
              const resp = await this.$axios.post(
                '/subtitle-worker/detail-check',
                {
                  work_no: id
                }
              )
              const { errorCode } = resp.data
              if (errorCode === 0) {
                window.open(
                  '/caption/detail/worker/' + id,
                  '_blank',
                  'width=1200,height=700'
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
          }
        } else {
          // location.href = '/inquiry/detail/' + this.noticeData.id
          window.open('/inquiry/detail/' + id, '_blank')
        }
      } catch (err) {}
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/assets/styles/variables.scss";
.el-card {
  margin-bottom: 20px;
  border-radius: $cardBoxRadius;
}
.other-task-assigned {
  opacity: 0.5;
  cursor: default !important;
}
.container {
  border-radius: $cardBoxRadius;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  .left-items {
    flex: 1;
    display: flex;
    align-items: center;
  }
  .youtube-icon .svg-icon {
    width: $svgSize;
    height: $svgSize;
  }
  .content {
    font-size: 14px;
    font-weight: bold;
    margin-left: 3%;
    /* Required for text-overflow to do anything */
    white-space: wrap;
  }
  .right-items {
    .company-info,
    .requester-info {
      font-size: 13px;
      margin-bottom: 3px;
    }
    .datetime {
      font-size: 12px;
      color: $gray90;
    }
  }
}

::v-deep {
  .el-card__body {
    padding: 15px;
  }
}
</style>
