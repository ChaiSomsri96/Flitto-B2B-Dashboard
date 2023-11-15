<template>
  <div class="detail-container">
    <div class="page-title">
      {{ $t('caption.detail') }}
    </div>
    <el-card v-loading="btnLoading" class="box-card">
      <el-form ref="detailForm" :model="form" label-width="200px" label-position="left">
        <el-row>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('caption.prog_status')">
              <el-tag class="progress-status" :class="form.status">
                {{ status[form.status] }}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('caption.work_no')">
              <span class="work-number">{{ form.work_number }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('caption.work_require_time')">
              <span class="request-time">{{ form.request_time | date }}</span>
            </el-form-item>
          </el-col>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('caption.work_finish_predict_date')">
              <span class="end-predict-date">{{ form.predict_end_date | date }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('caption.urg_trans_24_require')">
              <span>{{ form.emergency_request_check == 'Y' ? $t('common.yes') : $t('common.no') }}</span>
            </el-form-item>
          </el-col>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('caption.work_finish')">
              <span>{{ workFinish }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-form-item :label="$t('caption.prog_note')">
            <el-input
              v-model="workLogs"
              type="textarea"
              :disabled="true"
              :autosize="{ minRows: 5, maxRows: 6}"
            >
            </el-input>
          </el-form-item>
        </el-row>
        <el-row>
          <el-form-item :label="$t('caption.youtube_url')">
            <div class="youtube-icon">
              <a :href="form.youtube_url" target="_blank"><svg-icon icon-class="youtube" /></a>
              <span class="youtube-url">{{ form.youtube_url }}</span>
            </div>
          </el-form-item>
        </el-row>
        <el-row>
          <el-form-item :label="$t('caption.title')">
            <span class="youtube-title">{{ form.title }}</span>
          </el-form-item>
        </el-row>
        <el-row>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('label.translang')">
              <div v-if="form.working_language" class="trans-item-div">
                <span class="original-lang">
                  {{ $t('common.' + form.working_language.original_language) }}
                </span>
                <i class="el-icon-caret-right"></i>
                <span class="translate-lang">
                  {{ $t('common.' + form.working_language.translate_language) }}
                </span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('caption.play_length')">
              <span>{{ formatDuration }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="$auth.user.user_type == 1">
          <el-form-item :label="$t('company.work_amount')">
            {{ workAmount }}
          </el-form-item>
        </el-row>
        <el-row>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('company.trans_amount')">
              <span class="company-info">{{ currencySymbol + transAmount }} {{ form.card_payment === 'Y' ? ( '(' + $t('caption.payment_finish') + ')' ) : '' }} </span>
            </el-form-item>
          </el-col>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('caption.org_review_request')">
              <span>{{ form.native_review_check == 'Y' ? $t('common.yes') : $t('common.no') }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('caption.title_desc_trans_req')">
              <span>{{ form.title_request_check == 'Y' ? $t('common.yes') : $t('common.no') }}</span>
            </el-form-item>
          </el-col>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('caption.apply_youtube1')">
              <span>{{ form.youtube_apply_check == 'Y' ? $t('common.yes') : $t('common.no') }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-form-item :label="$t('caption.title_desc_org')">
            <el-input
              v-model="orgTitleDesc"
              type="textarea"
              :disabled="true"
              :autosize="{ minRows: 5, maxRows: 6}"
            >
            </el-input>
          </el-form-item>
        </el-row>
        <el-row>
          <el-form-item :label="$t('caption.title_desc_trans')">
            <el-input
              v-model="transTitleDesc"
              type="textarea"
              :disabled="true"
              :autosize="{ minRows: 5, maxRows: 6}"
            >
            </el-input>
          </el-form-item>
        </el-row>
        <el-row v-if="$auth.user.user_type == 1">
          <el-form-item :label="$t('caption.title_desc_review')">
            <el-input
              v-model="reviewTitleDesc"
              type="textarea"
              :disabled="true"
              :autosize="{ minRows: 5, maxRows: 6}"
            >
            </el-input>
          </el-form-item>
        </el-row>
        <el-row>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('caption.org_scene')">
              <span v-if="form.original_video_name" class="scene-file-info" @click="downloadFile(form.original_video_name)">
                <i class="el-icon-document mr5"></i>{{ form.original_video_name }}
              </span>
              <span v-else>-</span>
            </el-form-item>
          </el-col>
          <el-col v-if="$auth.user.user_type == 1" :md="12" :lg="12">
            <el-form-item :label="$t('caption.tc_scene')">
              <span v-if="tcCaptionAvailable" class="scene-file-info" @click="downloadFile(form.tc_video_name)">
                <i class="el-icon-document mr5"></i>{{ form.tc_video_name }}
              </span>
              <span v-else>-</span>
            </el-form-item>
          </el-col>

          <!-- 관리자인 경우 번역가 -->
          <el-col v-if="$auth.user.user_type == 1" :md="12" :lg="12">
            <el-form-item :label="$t('caption.trans_scene')">
              <span v-if="form.status === 'preparing' || form.status === 'tc_ing' || form.status === 'tc_complete' || form.status === 'translating'">-</span>
              <div v-else>
                <template v-if="form.translate_video_link">
                  <span class="scene-file-info mr5" @click="downloadFile(form.translate_video_name)">
                    <i class="el-icon-document mr5"></i>{{ form.translate_video_name }}
                  </span>
                  <!--
                  <span v-if="form.youtube_apply_check == 'Y' && form.native_review_check === 'N' && form.youtube_applying === 'Y'">
                    {{ $t('caption.youtube_applying') }}
                  </span>
                  -->
                  <!--
                  <el-button v-if="form.youtube_apply_check == 'N' && form.native_review_check === 'N' && form.status !== 'subtitle_apply' && form.status !== 'subtitle_apply_failed'" type="primary" @click="youtubeApply(form.work_number)">
                    Youtube {{ $t('common.apply') }}
                  </el-button>
                  <span v-else-if="form.native_review_check === 'N' && form.status === 'subtitle_apply'">
                    {{ $t('caption.youtube_apply_finish') }}
                  </span>
                  <el-button v-else-if="form.native_review_check === 'N' && form.status === 'subtitle_apply_failed'" type="primary" @click="youtubeApply(form.work_number)">
                    Youtube {{ $t('common.apply') }}
                  </el-button>
                  -->
                  <el-button v-if="(form.native_review_check === 'N' && form.status == 'translation_complete') || (form.native_review_check === 'N' && form.status == 'subtitle_apply_failed')" type="primary" @click="youtubeApply(form.work_number)">
                    Youtube {{ $t('common.apply') }}
                  </el-button>
                  <span v-else-if="form.native_review_check === 'N' && form.status === 'subtitle_apply'">
                    {{ $t('caption.youtube_apply_finish') }}
                  </span>
                </template>
                <template v-else>
                  -
                </template>
              </div>
            </el-form-item>
          </el-col>

          <!-- 요청자 or 고객사 경우 번역가 -->
          <el-col v-if="$auth.user.user_type != 1" :md="12" :lg="12">
            <el-form-item :label="$t('caption.trans_scene')">
              <span v-if="(form.status === 'preparing' || form.status === 'tc_ing' || form.status === 'tc_complete' || form.status === 'translating') && form.native_review_check === 'N'">-</span>
              <span v-else-if="(form.status === 'preparing' || form.status === 'tc_ing' || form.status === 'tc_complete' || form.status === 'translating' || form.status === 'translation_complete' || form.status === 'reviewing') && form.native_review_check === 'Y'">-</span>
              <div v-else>
                <template v-if="form.translate_video_link">
                  <span class="scene-file-info mr5" @click="downloadFile(form.translate_video_name)">
                    <i class="el-icon-document mr5"></i>{{ form.translate_video_name }}
                  </span>
                  <!--
                  <span v-if="form.youtube_apply_check == 'Y' && form.youtube_applying === 'Y'">
                    {{ $t('caption.youtube_applying') }}
                  </span>
                  -->
                  <!--
                  <el-button v-if="form.youtube_apply_check == 'N' && form.status !== 'subtitle_apply' && form.status !== 'subtitle_apply_failed'" type="primary" @click="youtubeApply(form.work_number)">
                    Youtube {{ $t('common.apply') }}
                  </el-button>
                  <span v-else-if="form.status === 'subtitle_apply'">
                    {{ $t('caption.youtube_apply_finish') }}
                  </span>
                  <el-button v-else-if="form.status === 'subtitle_apply_failed'" type="primary" @click="youtubeApply(form.work_number)">
                    Youtube {{ $t('common.apply') }}
                  </el-button>
                  -->
                  <el-button v-if="(form.native_review_check === 'N' && form.status == 'translation_complete') || (form.native_review_check === 'Y' && form.status == 'review_complete') || form.status == 'subtitle_apply_failed'" type="primary" @click="youtubeApply(form.work_number)">
                    Youtube {{ $t('common.apply') }}
                  </el-button>
                  <span v-else-if="form.status === 'subtitle_apply'">
                    {{ $t('caption.youtube_apply_finish') }}
                  </span>
                </template>
                <template v-else>
                  -
                </template>
              </div>
            </el-form-item>
          </el-col>

          <!-- 관리자인 경우 검수자  -->
          <el-col v-if="$auth.user.user_type == 1" :md="12" :lg="12">
            <el-form-item :label="$t('caption.review_scene')">
              <span v-if="form.native_review_check === 'N'">-</span>
              <span v-else-if="form.status === 'preparing' || form.status === 'tc_ing' || form.status === 'tc_complete' || form.status === 'translating' || form.status === 'translation_complete' || form.status === 'reviewing'">-</span>
              <div v-else>
                <template v-if="form.reviewer_video_link">
                  <span class="scene-file-info mr5" @click="downloadFile(form.reviewer_video_name)">
                    <i class="el-icon-document mr5"></i>{{ form.reviewer_video_name }}
                  </span>
                  <!--
                  <span v-if="form.youtube_apply_check == 'Y' && form.native_review_check === 'Y' && form.youtube_applying === 'Y'">
                    {{ $t('caption.youtube_applying') }}
                  </span>
                  -->
                  <!--
                  <el-button v-if="form.youtube_apply_check == 'N' && form.native_review_check === 'Y' && form.status !== 'subtitle_apply' && form.status !== 'subtitle_apply_failed'" type="primary" @click="youtubeApply(form.work_number)">
                    Youtube {{ $t('common.apply') }}
                  </el-button>
                  -->
                  <el-button v-if="(form.native_review_check === 'N' && form.status == 'translation_complete') || (form.native_review_check === 'Y' && form.status == 'review_complete') || form.status == 'subtitle_apply_failed'" type="primary" @click="youtubeApply(form.work_number)">
                    Youtube {{ $t('common.apply') }}
                  </el-button>
                  <span v-else-if="form.status === 'subtitle_apply'">
                    {{ $t('caption.youtube_apply_finish') }}
                  </span>
                  <!--
                  <el-button v-else-if="form.status === 'subtitle_apply_failed'" type="primary" @click="youtubeApply(form.work_number)">
                    Youtube {{ $t('common.apply') }}
                  </el-button>
                  -->
                </template>
                <template v-else>
                  -
                </template>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-form-item :label="$t('caption.translator_memo')">
            <el-input
              v-model="form.translator_memo"
              type="textarea"
              :disabled="true"
              :autosize="{ minRows: 3, maxRows: 4}"
            >
            </el-input>
          </el-form-item>
        </el-row>
        <el-row>
          <el-form-item :label="$t('caption.requester_memo')">
            <el-input
              v-model="form.requester_memo"
              type="textarea"
              :disabled="true"
              :autosize="{ minRows: 3, maxRows: 4}"
            >
            </el-input>
          </el-form-item>
        </el-row>
        <el-form-item label-width="0px" style="text-align: center;">
          <el-button type="primary" class="btn-save" @click="onClose">
            <span>{{ $t('caption.close') }}</span>
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import global from '@/mixin/global'

const statusGroup1 = ['preparing', 'tc_ing', 'tc_complete', 'translating']

export default {
  // middleware: ['auth', 'auth-client'],
  middleware: ['auth', 'stats'],
  layout: 'detail',
  name: 'CaptionDetail',
  mixins: [global],
  async asyncData ({ $axios, params, error }) {
    const captionId = params.id
    try {
      const response = await $axios.post('/subtitle-translation/detail', { id: captionId })

      const { errorCode, data } = response.data

      if (errorCode === 0) {
        return {
          form: data
        }
      } else {
        error({ statusCode: 500, message: 'Post not found' })
      }
    } catch (err) {
      error({ statusCode: 404, message: 'Post not found' })
    }
  },
  data () {
    return {
      btnLoading: false,
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
      },
      logSuffixCase: {
        preparing: this.$t('')
      }
    }
  },
  computed: {
    workFinish () {
      if (this.form.is_finish === 'Y') {
        return this.$t('caption.finish')
      }
      let workFinish = ''
      switch (this.form.work_finish) {
        case 'subtitle_apply':
          workFinish = this.$t('caption.subtitle_complete')
          break
        case 'review_complete':
          workFinish = this.$t('caption.review_complete')
          break
        case 'translation_complete':
          workFinish = this.$t('caption.translation_complete')
          break
        default:
          break
      }
      return workFinish
    },
    workLogs () {
      let content = ''
      if (this.form.logs.length === 0) {
        return ''
      }
      for (let i = 0; i < this.form.logs.length; i++) {
        const log = this.form.logs[i]
        /*
        if (log.status === 'preparing') {
          content += this.$options.filters.date(log.log_date) + ' ' +
          this.$t('caption.preparing_log', { userName: log.user_name, userId: log.user_id }) + '\n'
        } else {
          content += this.$options.filters.date(log.log_date) + ' ' +
          this.$t('caption.' + log.status + '_log', { userName: log.user_name, userId: log.user_id }) + '\n'
        } */
        if (this.$auth.user.user_type === 2 || this.$auth.user.user_type === 3 || this.$auth.user.user_type === 7) {
          if (log.status === 'preparing') {
            content += this.$options.filters.date(log.log_date) + ' ' +
            this.$t('caption.preparing_log', { userName: log.user_name, userId: log.user_id }) + '\n'
          } else if (log.status === 'subtitle_apply_failed') {
            content += this.$options.filters.date(log.log_date) + ' ' +
            this.$t('caption.' + log.status + '_user_log') + '(' + this.$t('caption.youtube_apply_fail_log' + log.error_type) + ')' + '\n'
          } else {
            content += this.$options.filters.date(log.log_date) + ' ' +
            this.$t('caption.' + log.status + '_user_log') + '\n'
          }
        } else if (log.status === 'subtitle_apply_failed') {
          content += this.$options.filters.date(log.log_date) + ' ' +
            this.$t('caption.' + log.status + '_log', { userName: log.user_name, userId: log.user_id }) + '(' + this.$t('caption.youtube_apply_fail_log' + log.error_type) + ')' + '\n'
        } else {
          content += this.$options.filters.date(log.log_date) + ' ' +
            this.$t('caption.' + log.status + '_log', { userName: log.user_name, userId: log.user_id }) + '\n'
        }
      }
      return content
    },
    formatDuration () {
      if (!this.form.duration) {
        return '00:00:00'
      }
      const secNum = parseInt(this.form.duration, 10) // don't forget the second param
      let hours = Math.floor(secNum / 3600)
      let minutes = Math.floor((secNum - (hours * 3600)) / 60)
      let seconds = secNum - (hours * 3600) - (minutes * 60)

      if (hours < 10) {
        hours = '0' + hours
      }
      if (minutes < 10) {
        minutes = '0' + minutes
      }
      if (seconds < 10) {
        seconds = '0' + seconds
      }
      return hours + ':' + minutes + ':' + seconds
    },
    workAmount () {
      /** curreny: fixed dollar $ */
      let totalWorkPrice = 0
      let expression = ''
      if (this.form.tc_work_price !== undefined) {
        totalWorkPrice += parseFloat(this.form.tc_work_price)
        expression += '$' + this.form.tc_work_price + '(TC) + '
      }
      if (this.form.translate_work_price !== undefined) {
        totalWorkPrice += parseFloat(this.form.translate_work_price)
        expression += '$' + this.form.translate_work_price + '(번역)'
      }
      if (this.form.review_work_price !== undefined) {
        totalWorkPrice += parseFloat(this.form.review_work_price)
        expression += ' + $' + this.form.review_work_price + '(검수)'
      }
      return '$' + totalWorkPrice.toFixed(3) + ' = ' + expression
    },
    currencySymbol () {
      return this.currencyList.filter(
        currency => currency.value === this.form.currency_type
      )[0].label
    },
    transAmount () {
      return this.numberWithCommas(this.form.work_price)
    },
    orgTitleDesc () {
      return this.$t('caption.title') + ':\n' + this.form.title + '\n' +
      this.$t('caption.description') + ':\n' + this.form.description
    },
    transTitleDesc () {
      if (this.form.title_request_check === 'N') {
        return this.$t('caption.no_title_desc_trans')
      }
      if (statusGroup1.includes(this.form.status)) {
        return this.$t('caption.unfinished_title_desc_trans')
      }
      return this.$t('caption.title') + ':\n' + this.form.translate_title + '\n' +
        this.$t('caption.description') + ':\n' + this.form.translate_description
    },
    reviewTitleDesc () {
      if (this.form.title_request_check === 'N' || this.form.native_review_check === 'N') {
        return this.$t('caption.no_title_desc_review')
      }
      if (statusGroup1.includes(this.form.status)) {
        return this.$t('caption.unfinished_title_desc_trans')
      }
      const statusGroup2 = ['translation_complete', 'reviewing']
      if (statusGroup2.includes(this.form.status)) {
        return this.$t('caption.unfinished_title_desc_review')
      }
      return this.$t('caption.title') + ':\n' + this.form.review_title + '\n' +
        this.$t('caption.description') + ':\n' + this.form.review_description
    },
    tcCaptionAvailable () {
      // 원본자막 업로드한 경우
      if (this.form.original_video_name) {
        return false
      }
      // 원본자막 업로드하지 않은 경우 준비중, TC중 상태일때
      if (['preparing', 'tc_ing'].includes(this.form.status)) {
        return false
      }
      return true
    },
    transCaptionAvailable () {
      /*
      // 준비중, TC중, TC완료, 번역중 상태
      if (statusGroup1.includes(this.form.status)) {
        return 0
      }
      // 번역완료, 검수중, 검수완료, 자막적용 상태
      // // 원어민 검수 요청하지 않은 경우
      if (this.form.native_review_check === 'N') {
        // // // 번역완료 상태
        if (this.form.status === 'translation_complete') {
          return 1
        }
        // // // 자막적용 상태
        if (this.form.status === 'subtitle_apply') {
          return 2
        }
      }
      // // 원어민 검수 요청한 경우
      return 3 */
      // 준비중, TC중, TC완료, 번역중 상태
      if (statusGroup1.includes(this.form.status)) {
        return 0
      }
      // 자막적용 상태
      if (this.form.status === 'subtitle_apply') {
        return 1
      }
      // 자막적용 실패
      if (this.form.status === 'subtitle_apply_failed') {
        return 2
      }
      if (this.form.native_review_check === 'N') { return 3 }
      return 4
    },
    reviewCaptionAvailable () {
      // 원어민 검수 요청하지 않은 경우
      if (this.form.native_review_check === 'N') {
        return 0
      }
      // 검수완료상태
      if (this.form.status === 'review_complete') {
        return 1
      }
      // 자막적용상태
      if (this.form.status === 'subtitle_apply') {
        return 2
      }
      // 준비중, TC중, TC완료, 번역중, 번역완료, 검수중 상태
      return 0
    }
  },
  methods: {
    /* forceDownload (url, fileName) {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.responseType = 'blob'
      xhr.onload = function () {
        const urlCreator = window.URL || window.webkitURL
        const imageUrl = urlCreator.createObjectURL(this.response)
        const tag = document.createElement('a')
        tag.href = imageUrl
        tag.download = fileName
        document.body.appendChild(tag)
        tag.click()
        document.body.removeChild(tag)
      }
      xhr.send()
    }, */
    downloadFile (fileName) {
      const https = process.env.HTTP
      const host = process.env.API_HOST
      const port = process.env.API_PORT
      location.href = https + '://' + host + ':' + port + '/basic/file-download?file_name=' + fileName + '&type=translate'
    },
    onClose () {
      window.close()
    },
    async youtubeApply (workNumber) {
      try {
        this.btnLoading = true
        const response = await this.$axios.post('/requester/youtube-apply', { work_no: workNumber })
        const { errorCode } = response.data
        if (errorCode === 0) {
          this.$message.success(this.$t('caption.youtube_apply_success_message'))
        } else if (errorCode === 101) {
          this.btnLoading = false
          this.$message.error(this.$t('caption.youtube_account_not_connected'))
        } else if (errorCode === 400) {
          // badRequest   contentRequired
          this.$message.error(this.$t('caption.youtube_apply_fail_bad_request'))
        } else if (errorCode === 409) {
          // conflict   captionExists
          this.$message.error(this.$t('caption.youtube_apply_fail_conflict'))
        } else if (errorCode === 403) {
          // forbidden forbidden
          this.$message.error(this.$t('caption.youtube_apply_fail_forbidden'))
        } else if (errorCode === 400) {
          // invalidValue invalidMetadata
          this.$message.error(this.$t('caption.youtube_apply_fail_invalidValue'))
        } else if (errorCode === 404) {
          // notFound videoNotFound
          this.$message.error(this.$t('caption.youtube_apply_fail_notFound'))
        }
        if (errorCode !== 101) {
          const _self = this
          setTimeout(() => {
            _self.btnLoading = false
            location.reload()
          }, 2000)
        }
      } catch (error) {
        console.log(error)
      }
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
.youtube-icon .svg-icon {
  width: $svgSize;
  height: $svgSize;
  margin-right: 5px;
  vertical-align: middle;
}
.youtube-url {
  display: inline-block;
}
.trans-item-div {
  display: flex;
  align-items: center;
  line-height: 20px;
  margin-top: 5px;
  .original-lang {
    background: #67c23a;
    padding: 5px;
    border-radius: 4px;
    color: white;
  }
  .translate-lang {
    background: #f56c6c;
    padding: 5px;
    border-radius: 4px;
    color: white;
    margin-right: 10px;
  }
}
.scene-file-info {
  cursor: pointer;
}
</style>
