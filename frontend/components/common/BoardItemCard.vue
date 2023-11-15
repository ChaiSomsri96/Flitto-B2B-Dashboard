<template>
  <el-card>
    <div class="container" @click="viewCaptionDetail">
      <div class="left-items">
        <a :href="youtubeUrl" target="_blank" class="youtube-icon">
          <svg-icon icon-class="youtube" />
        </a>
        <el-tag class="progress-status" :class="status + ' ' + $i18n.locale">
          {{ statusText[status] }}
        </el-tag>
        <div class="title mr5">
          {{ title }}
        </div>
      </div>
      <div class="timestamp">
        <div class="label">
          <svg-icon icon-class="calendar" />{{ dateLabel }}
        </div>
        <div class="datetime">
          {{ dateTime | date }}
        </div>
      </div>
    </div>
  </el-card>
</template>

<script>
export default {
  name: 'BoardItemCard',
  props: {
    title: {
      type: String,
      default: ''
    },
    youtubeUrl: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      default: ''
    },
    dateLabel: {
      type: String,
      default: ''
    },
    dateTime: {
      type: [String, Number],
      default: ''
    },
    workNo: {
      type: Number,
      default: 0
    },
    isRequester: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      statusText: {
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
  methods: {
    viewCaptionDetail () {
      if (this.isRequester) { window.open('/caption/detail/' + this.workNo, '_blank', 'width=1200,height=700') } else { window.open('/caption/detail/worker/' + this.workNo, '_blank', 'width=1200,height=700') }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
.el-card {
  margin-bottom: $listCardMgBottom;
}

.container {
  border-radius: $cardBoxRadius;
  display: flex;
  flex-direction: row;
  // justify-content: space-between;
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
  .el-tag {
    margin-left: 3%;
  }
  .title {
    font-size: 13px;
    font-weight: bold;
    margin-left: 3%;
    /* Required for text-overflow to do anything */
    /* text-overflow: ellipsis;
    overflow: hidden; */
  }
  .timestamp .svg-icon {
    margin-right: 5px;
  }
  .timestamp {
    .label {
      font-size: 12px;
      margin-bottom: 3px;
      max-width: 130px;
    }
    .datetime {
      font-size: 12px;
      color: $gray90;
    }
  }
}
</style>
