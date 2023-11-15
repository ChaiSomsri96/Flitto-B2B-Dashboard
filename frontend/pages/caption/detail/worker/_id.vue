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
                {{ status[form.status - 1] }}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('caption.work_no')">
              <span v-if="$auth.user.user_type == 4" class="work-number">{{ form.work_no.join() }}</span>
              <span v-else class="work-number">{{ form.work_no }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :md="24" :lg="24">
            <el-form-item :label="endDateLabel">
              <span class="end-predict-date">{{ formatPredictDate }}</span>
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
            <!--TC작업자-->
            <el-form-item v-if="$auth.user.user_type == 4" :label="$t('caption.orglang')">
              <span class="original-lang">
                {{ $t('common.' + form.original_language) }}
              </span>
            </el-form-item>
            <!--번역가-->
            <el-form-item v-if="$auth.user.user_type == 5" :label="$t('label.translang')">
              <div class="trans-item-div">
                <span class="original-lang">
                  {{ $t('common.' + form.original_language) }}
                </span>
                <i class="el-icon-caret-right"></i>
                <span class="translate-lang">
                  {{ $t('common.' + form.translate_language) }}
                </span>
              </div>
            </el-form-item>
            <!--검수자-->
            <el-form-item v-if="$auth.user.user_type == 6" :label="$t('caption.translang')">
              <span class="translate-lang">
                {{ $t('common.' + form.translate_language) }}
              </span>
            </el-form-item>
          </el-col>
          <el-col :md="12" :lg="12">
            <el-form-item :label="$t('caption.play_length')">
              <span>{{ formatDuration }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-form-item :label="workPriceLabel">
            ${{ form.price }}
          </el-form-item>
        </el-row>
        <el-row>
          <el-col v-if="$auth.user.user_type == 4" :md="24" :lg="24">
            <el-form-item :label="$t('table.tc_video')">
              <span v-if="form.status == 1">
                -
              </span>
              <el-upload
                v-else-if="form.status == 2"
                ref="uploadTCVideo"
                action="https://b2b.ku-min.com"
                :limit="1"
                :auto-upload="false"
                :on-change="uploadTCVideo"
              >
                <el-button slot="trigger" size="small" type="primary">
                  {{ this.$t('caption.sel_scene_file') }}
                </el-button>
              </el-upload>
              <span v-else class="scene-file-info" @click="downloadFile(form.video)">
                <i class="el-icon-document mr5"></i>{{ form.video }}
              </span>
            </el-form-item>
          </el-col>
          <template v-if="$auth.user.user_type == 5 || $auth.user.user_type == 6">
            <el-col :md="12" :lg="12">
              <el-form-item :label="prevVideoLabel">
                <span v-if="!(form.prev_video === null || form.prev_video === undefined || form.prev_video === '')" class="scene-file-info" @click="downloadFile(form.prev_video)">
                  <i class="el-icon-document mr5"></i>{{ form.prev_video }}
                </span>
                <span v-else>
                  -
                </span>
              </el-form-item>
            </el-col>
            <el-col :md="12" :lg="12">
              <el-form-item :label="videoLabel">
                <!-- 1상태 (번역대기, 검수대기) -->
                <span v-if="form.status == 1">
                  -
                </span>
                <!-- 2상태 (번역중, 검수중) -->
                <el-upload
                  v-else-if="form.status == 2"
                  ref="uploadTrReVideo"
                  action="https://b2b.ku-min.com"
                  style="display: flex; flex-direction: column; align-items: flex-start;"
                  :auto-upload="false"
                  :limit="1"
                  :on-change="uploadTrReVideo"
                >
                  <el-button slot="trigger" size="small" type="primary">
                    {{ this.$t('caption.sel_scene_file') }}
                  </el-button>
                </el-upload>
                <!-- 3상태 (번역완료, 검수완료) -->
                <span v-else class="scene-file-info" @click="downloadFile(form.video)">
                  <i class="el-icon-document mr5"></i>{{ form.video }}
                </span>
              </el-form-item>
            </el-col>
          </template>
        </el-row>
        <el-row v-if="$auth.user.user_type == 5 || $auth.user.user_type == 6">
          <el-col :md="24" :lg="24">
            <el-form-item :label="titleDescCheckLabel">
              <span>{{ form.has_title_translate == 'Y' ? $t('common.yes') : $t('common.no') }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 제목 원본 -->
        <el-row v-if="$auth.user.user_type == 5 || $auth.user.user_type == 6">
          <el-col :md="24" :lg="24">
            <el-form-item :label="titlePrevLabel">
              <el-input
                v-model="orgTitle"
                type="textarea"
                :disabled="true"
                :autosize="{ minRows: 1, maxRows: 2}"
              >
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 제목 번역 -->
        <el-row v-if="$auth.user.user_type == 5 || $auth.user.user_type == 6">
          <el-col :md="24" :lg="24">
            <el-form-item :label="titleLabel">
              <el-input
                v-model="workTitle"
                type="textarea"
                :placeholder="titleWorkLabel"
                :disabled="form.status == 2 && form.has_title_translate == 'Y' ? false : true"
                :autosize="{ minRows: 1, maxRows: 2}"
              >
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 설명 원본 -->
        <el-row v-if="$auth.user.user_type == 5 || $auth.user.user_type == 6">
          <el-col :md="24" :lg="24">
            <el-form-item :label="descPrevLabel">
              <el-input
                v-model="orgDesc"
                type="textarea"
                :disabled="true"
                :autosize="{ minRows: 5, maxRows: 6}"
              >
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 설명 번역 -->
        <el-row v-if="$auth.user.user_type == 5 || $auth.user.user_type == 6">
          <el-col :md="24" :lg="24">
            <el-form-item :label="descLabel">
              <el-input
                v-model="workDescription"
                type="textarea"
                :placeholder="descWorkLabel"
                :disabled="form.status == 2 && form.has_title_translate == 'Y' ? false : true"
                :autosize="{ minRows: 5, maxRows: 6}"
              >
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="$auth.user.user_type == 5">
          <el-form-item :label="$t('caption.translator_memo')">
            <el-input
              v-model="form.memo"
              type="textarea"
              :disabled="true"
              :autosize="{ minRows: 3, maxRows: 4}"
            >
            </el-input>
          </el-form-item>
        </el-row>
        <el-row>
          <el-form-item label-width="0px" style="text-align: center;">
            <!-- <el-button :loading="btnLoading" type="primary" class="btn-save" :disabled="form.status == 1 && !form.can_work" @click="onSubmit"> -->
            <el-button type="primary" class="btn-save" @click="onSubmit">
              <!-- 1상태일때(TC대기, 번역대기, 검수대기) -->
              <span v-if="form.status == 1">{{ $t('caption.accept_work') }}</span>
              <!-- 2상태일때(TC중, 번역중, 검수중) -->
              <span v-if="form.status == 2">{{ btnRegisterTxt }}</span>
              <!-- 3상태일때(TC완료, 번역완료, 검수완료 -->
              <span v-if="form.status == 3">{{ $t('caption.close') }}</span>
            </el-button>
          </el-form-item>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script>
export default {
  // middleware: ['auth', 'auth-worker'],
  middleware: ['auth', 'stats'],
  layout: 'detail',
  name: 'WorkerCaptionDetail',
  async asyncData ({ $axios, $auth, params, error }) {
    const workNo = params.id
    try {
      let response = null
      if ($auth.user.user_type === 4) {
        response = await $axios.post('/subtitle-worker/tc-detail', { id: workNo })
      } else {
        response = await $axios.post('/subtitle-worker/detail', { work_no: workNo })
      }
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
      status: [],
      endDateLabel: '',
      workPriceLabel: '',
      prevVideoLabel: '',
      videoLabel: '',
      titleDescCheckLabel: '',
      titleDescPrevLabel: '',

      titlePrevLabel: '',
      descPrevLabel: '',

      titleDescWorkLabel: '',

      titleWorkLabel: '',
      descWorkLabel: '',

      titleDescLabel: '',

      titleLabel: '',
      descLabel: '',

      tcVideoUploaded: false,
      tcVideoFilename: '',
      tcFile: null,

      trVideoUploaded: false,
      trVideoFilename: '',
      trFile: null,

      reVideoUploaded: false,
      reVideoFilename: '',
      reFile: null,

      workDescription: '',
      workTitle: ''
    }
  },
  computed: {
    formatPredictDate () {
      if (!this.form.end_date) {
        return '-'
      }
      if (this.form.status === 1) {
        const secNum = parseInt(this.form.end_date, 10)
        const hour = Math.floor(secNum / 3600)
        const minute = Math.floor((secNum - (hour * 3600)) / 60)
        if (hour === 0 && minute !== 0) {
          return this.$t('caption.wait_min_pred_date', { minute })
        }
        if (hour !== 0 && minute === 0) {
          return this.$t('caption.wait_hour_pred_date', { hour })
        }
        return this.$t('caption.wait_pred_date', { hour, minute })
      } else {
        return this.$options.filters.date(this.form.end_date)
      }
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
    // ToDo
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
        if (this.$auth.user.user_type === 4) {
          if (log.status === 'tc_ing' || log.status === 'tc_complete') {
            content += this.$options.filters.date(log.log_date) + ' ' +
            this.$t('caption.' + log.status + '_log', { userName: log.user_name, userId: log.user_id }) + '\n'
          } else {
            content += this.$options.filters.date(log.log_date) + ' ' +
            this.$t('caption.' + log.status + '_user_log') + '\n'
          }
        } else if (this.$auth.user.user_type === 5) {
          if (log.status === 'translating' || log.status === 'translation_complete') {
            content += this.$options.filters.date(log.log_date) + ' ' +
            this.$t('caption.' + log.status + '_log', { userName: log.user_name, userId: log.user_id }) + '\n'
          } else {
            content += this.$options.filters.date(log.log_date) + ' ' +
            this.$t('caption.' + log.status + '_user_log') + '\n'
          }
        } else if (this.$auth.user.user_type === 6) {
          if (log.status === 'reviewing' || log.status === 'review_complete') {
            content += this.$options.filters.date(log.log_date) + ' ' +
            this.$t('caption.' + log.status + '_log', { userName: log.user_name, userId: log.user_id }) + '\n'
          } else {
            content += this.$options.filters.date(log.log_date) + ' ' +
            this.$t('caption.' + log.status + '_user_log') + '\n'
          }
        }
      }
      return content
    },
    orgTitleDesc () {
      if (this.$auth.user.user_type === 5) {
        return this.$t('caption.title') + ':\n' + this.form.original_title + '\n' +
        this.$t('caption.description') + ':\n' + this.form.original_description
      } else {
        // 검수자인 경우
        return this.form.translate_description
      }
    },
    orgTitle () {
      if (this.$auth.user.user_type === 5) {
        return this.form.original_title
      } else {
        return this.form.translate_title
      }
    },
    orgDesc () {
      if (this.$auth.user.user_type === 5) {
        return this.form.original_description
      } else {
        return this.form.translate_description
      }
    },
    transTitleDesc () {
      if (this.$auth.user.user_type === 5) {
        if (this.form.has_title_translate === 'N') {
          return this.$t('caption.no_title_desc_trans')
        }
        if (this.form.status === 1) { // TC완료, 번역대기
          return this.$t('caption.unfinished_title_desc_trans')
        }
        if (this.form.status === 3) { // 번역완료
          return this.form.translate_description
        }
        return ''
      } else {
        if (this.form.has_title_translate === 'N') {
          return this.$t('caption.no_title_desc_review')
        }
        if (this.form.status === 1) { // 번역완료, 검수대기
          return this.$t('caption.unfinished_title_desc_review')
        }
        if (this.form.status === 3) { // 검수완료
          return this.form.review_description
        }
        return ''
      }
    },
    transTitle () {
      if (this.$auth.user.user_type === 5) {
        if (this.form.has_title_translate === 'N') {
          return this.$t('caption.no_title_trans')
        }
        if (this.form.status === 1) { // TC완료, 번역대기
          return this.$t('caption.unfinished_title_trans')
        }
        if (this.form.status === 3) { // 번역완료
          return this.form.translate_title
        }
        return ''
      } else {
        if (this.form.has_title_translate === 'N') {
          return this.$t('caption.no_title_review')
        }
        if (this.form.status === 1) { // 번역완료, 검수대기
          return this.$t('caption.unfinished_title_review')
        }
        if (this.form.status === 3) { // 검수완료
          return this.form.review_title
        }
        return ''
      }
    },
    transDesc () {
      if (this.$auth.user.user_type === 5) {
        if (this.form.has_title_translate === 'N') {
          return this.$t('caption.no_desc_trans')
        }
        if (this.form.status === 1) { // TC완료, 번역대기
          return this.$t('caption.unfinished_desc_trans')
        }
        if (this.form.status === 3) { // 번역완료
          return this.form.translate_description
        }
        return ''
      } else {
        if (this.form.has_title_translate === 'N') {
          return this.$t('caption.no_desc_review')
        }
        if (this.form.status === 1) { // 번역완료, 검수대기
          return this.$t('caption.unfinished_desc_review')
        }
        if (this.form.status === 3) { // 검수완료
          return this.form.review_description
        }
        return ''
      }
    },
    btnRegisterTxt () {
      let btnTxt = ''
      const userType = this.$auth.user.user_type
      switch (userType) {
        case 4:
          btnTxt = this.$t('caption.tc_register')
          break
        case 5:
          btnTxt = this.$t('caption.tr_register')
          break
        case 6:
          btnTxt = this.$t('caption.re_register')
          break
      }
      return btnTxt
    }
  },
  created () {
    this.initVariables()
  },
  methods: {
    uploadTCVideo (file, fileList) {
      this.tcVideoUploaded = true
      this.tcVideoFilename = file.name
      this.tcFile = file.raw
    },
    uploadTrReVideo (file, fileList) {
      if (this.$auth.user.user_type === 5) {
        this.trVideoUploaded = true
        this.trVideoFilename = file.name
        this.trFile = file.raw
      } else {
        this.reVideoUploaded = true
        this.reVideoFilename = file.name
        this.reFile = file.raw
      }
    },
    initVariables () {
      if (this.$auth.user.user_type === 4) {
        this.status = [
          this.$t('table.tc_wait'), this.$t('table.tc_progress'), this.$t('table.tc_finish')
        ]
        this.endDateLabel = this.$t('table.tc_predict_date')
        this.workPriceLabel = this.$t('table.tc_work_price')
      } else if (this.$auth.user.user_type === 5) {
        this.status = [
          this.$t('table.tr_wait'), this.$t('table.tr_progress'), this.$t('table.tr_finish')
        ]
        this.endDateLabel = this.$t('table.tr_predict_date')
        this.workPriceLabel = this.$t('table.translate_work_price')
        this.prevVideoLabel = this.$t('table.tc_video')
        this.videoLabel = this.$t('table.tr_video')
        this.titleDescCheckLabel = this.$t('caption.title_desc_trans_req')

        this.titleDescPrevLabel = this.$t('caption.title_desc_org')
        this.titlePrevLabel = this.$t('caption.title_org')
        this.descPrevLabel = this.$t('caption.desc_org')

        this.titleDescLabel = this.$t('caption.title_desc_trans')
        this.titleLabel = this.$t('caption.title_trans')
        this.descLabel = this.$t('caption.desc_trans')

        this.titleDescWorkLabel = this.$t('caption.title_desc_trans_placeholder')
        this.titleWorkLabel = this.$t('caption.title_trans_placeholder')
        this.descWorkLabel = this.$t('caption.desc_trans_placeholder')

        this.workDescription = this.transDesc
        this.workTitle = this.transTitle
      } else {
        this.status = [
          this.$t('table.re_wait'), this.$t('table.re_progress'), this.$t('table.re_finish')
        ]
        this.endDateLabel = this.$t('table.re_predict_date')
        this.workPriceLabel = this.$t('table.review_work_price')
        this.prevVideoLabel = this.$t('table.tr_video')
        this.videoLabel = this.$t('table.re_video')
        this.titleDescCheckLabel = this.$t('caption.title_desc_review_req')

        this.titleDescPrevLabel = this.$t('caption.title_desc_trans')
        this.titlePrevLabel = this.$t('caption.title_trans')
        this.descPrevLabel = this.$t('caption.desc_trans')

        this.titleDescLabel = this.$t('caption.title_desc_review')
        this.titleLabel = this.$t('caption.title_review')
        this.descLabel = this.$t('caption.desc_review')

        this.titleDescWorkLabel = this.$t('caption.title_desc_review_placeholder')
        this.titleWorkLabel = this.$t('caption.title_review_placeholder')
        this.descWorkLabel = this.$t('caption.desc_review_placeholder')
        this.workDescription = this.transDesc
        this.workTitle = this.transTitle
      }
    },
    onSubmit () {
      if (this.form.status === 1) { // 작업수락
        if (!this.form.can_work) {
          if (parseInt(this.form.can_work_count) === 0) { this.$message.error(this.$t('caption.zero_can_work_err_msg')) } else { this.$message.error(this.$t('caption.not_allowed_accept_work', { N: parseInt(this.form.can_work_count) })) }
          return
        }
        this.$confirm(this.$t('caption.confirm_accept_work'), {
          confirmButtonText: this.$t('common.ok'),
          cancelButtonText: this.$t('common.no')
        }).then(async () => {
          this.btnLoading = true
          let response = null
          if (this.$auth.user.user_type === 4) { // tc작업자
            response = await this.$axios.post('/subtitle-worker/tc-assign-work', { work_no: this.form.id })
          } else {
            response = await this.$axios.post('/subtitle-worker/assign-work', { work_no: this.form.work_no })
          }
          const { errorCode } = response.data
          if (errorCode === 0) {
            this.$message({
              type: 'success',
              message: this.$t('caption.success_accept_work')
            })
            // location.reload()
            const _self = this
            setTimeout(() => {
              _self.btnLoading = false
              location.reload()
            }, 2000)
          } else {
            this.$message({
              type: 'error',
              message: '작업수락이 실패하였습니다.'
            })
            this.btnLoading = false
          }
        })
      } else if (this.form.status === 2) {
        if (this.$auth.user.user_type === 4) {
          this.$confirm(this.$t('caption.confirm_tc_register'), {
            confirmButtonText: this.$t('common.ok'),
            cancelButtonText: this.$t('common.no')
          }).then(async () => {
            if (!this.tcFile) {
              this.$message({
                type: 'error',
                message: this.$t('caption.video_file_required')
              })
              return
            }
            this.btnLoading = true
            const formData = new FormData()
            formData.append('work_no', this.form.id)
            formData.append('file', this.tcFile)
            const response = await this.$axios.post('/subtitle-worker/tc-complete-work', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            })
            const { errorCode } = response.data
            if (errorCode === 0) {
              this.$message({
                type: 'success',
                message: this.$t('caption.success_tc_register')
              })
              // location.reload()
              const _self = this
              setTimeout(() => {
                _self.btnLoading = false
                location.reload()
              }, 2000)
            } else {
              this.$message({
                type: 'error',
                message: 'TC등록이 실패하였습니다.'
              })
              this.btnLoading = false
            }
          })
        } else if (this.$auth.user.user_type === 5) {
          this.$confirm(this.$t('caption.confirm_trans_register'), {
            confirmButtonText: this.$t('common.ok'),
            cancelButtonText: this.$t('common.no')
          }).then(async () => {
            if (!this.trFile) {
              this.$message({
                type: 'error',
                message: this.$t('caption.video_file_required')
              })
              return
            }
            if (this.form.has_title_translate === 'Y' && !this.workTitle) {
              this.$message({
                type: 'error',
                message: this.$t('caption.title_trans_required')
              })
              return
            }
            if (this.form.has_title_translate === 'Y' && !this.workDescription) {
              this.$message({
                type: 'error',
                message: this.$t('caption.desc_trans_required')
              })
              return
            }
            this.btnLoading = true
            const formData = new FormData()
            formData.append('work_no', this.form.work_no)
            formData.append('file', this.trFile)
            formData.append('work_title', this.workTitle)
            formData.append('work_description', this.workDescription)
            const response = await this.$axios.post('/subtitle-worker/complete-work', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            })
            const { errorCode, complete } = response.data

            if (errorCode === 0 || !(complete === undefined || complete === null || complete === '')) {
              this.$message({
                type: 'success',
                message: this.$t('caption.success_trans_register')
              })
              // location.reload()
              const _self = this
              setTimeout(() => {
                _self.btnLoading = false
                location.reload()
              }, 2000)
            } else {
              this.$message({
                type: 'error',
                message: '번역등록이 실패하였습니다.'
              })
              this.btnLoading = false
            }
          })
        } else {
          this.$confirm(this.$t('caption.confirm_review_register'), {
            confirmButtonText: this.$t('common.ok'),
            cancelButtonText: this.$t('common.no')
          }).then(async () => {
            if (!this.reFile) {
              this.$message({
                type: 'error',
                message: this.$t('caption.video_file_required')
              })
              return
            }
            if (this.form.has_title_translate === 'Y' && !this.workTitle) {
              this.$message({
                type: 'error',
                message: this.$t('caption.title_review_required')
              })
              return
            }
            if (this.form.has_title_translate === 'Y' && !this.workDescription) {
              this.$message({
                type: 'error',
                message: this.$t('caption.desc_review_required')
              })
              return
            }
            this.btnLoading = true
            const formData = new FormData()
            formData.append('work_no', this.form.work_no)
            formData.append('file', this.reFile)
            formData.append('work_title', this.workTitle)
            formData.append('work_description', this.workDescription)

            const response = await this.$axios.post('/subtitle-worker/complete-work', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            })

            const { errorCode, complete } = response.data

            if (errorCode === 0 || !(complete === undefined || complete === null || complete === '')) {
              this.$message({
                type: 'success',
                message: this.$t('caption.success_review_register')
              })
              const _self = this
              setTimeout(() => {
                _self.btnLoading = false
                location.reload()
              }, 2000)
            } else {
              this.$message({
                type: 'error',
                message: '검수등록이 실패하였습니다.'
              })
              this.btnLoading = false
            }
          })
        }
      } else {
        window.close()
      }
    },
    downloadFile (fileName) {
      const https = process.env.HTTP
      const host = process.env.API_HOST
      const port = process.env.API_PORT
      location.href = https + '://' + host + ':' + port + '/basic/file-download?file_name=' + fileName + '&type=translate'
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
::v-deep {
  .el-upload-list {
    width: 180px !important;
  }
}
</style>
