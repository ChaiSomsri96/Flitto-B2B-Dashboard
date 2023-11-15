<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('caption.add') }}
    </div>
    <el-card v-loading="wholeLoading" class="form-container box-card">
      <el-form ref="captionReqform" :rules="rules" :model="form" label-width="165px" label-position="left">
        <el-row>
          <el-col :lg="16" class="left-container">
            <el-form-item :label="$t('caption.scene_type')">
              <div class="youtube-icon">
                <svg-icon icon-class="youtube" />&nbsp;&nbsp;&nbsp;YouTube
              </div>
            </el-form-item>
            <div class="id-item">
              <el-form-item :label="$t('caption.youtube_url')" prop="youtube_url">
                <el-input
                  v-model="form.youtube_url"
                  :placeholder="$t('placeholder.youtube_link')"
                />
              </el-form-item>
              <el-button type="primary" :disabled="form.youtube_url ? false : true" class="btn-youtube-info" @click="getYoutubeInfo">
                {{ $t('caption.get_info') }}
              </el-button>
            </div>
            <el-form-item v-loading="loading" :label="$t('caption.scene_info')">
              <div v-if="form.youtube_id" class="youtube-iframe">
                <iframe :src="youtubeEmbedUrl" frameBorder="0"></iframe>
              </div>
              <div v-else class="youtube-empty-div">
                <span>{{ $t('placeholder.youtube_info') }}</span>
              </div>
              <el-input
                v-model="youtubeInfo"
                disabled
                :placeholder="$t('placeholder.youtube_info')"
                type="textarea"
                :autosize="{ minRows: 4, maxRows: 5}"
                class="youtube-info"
              >
              </el-input>
              <div v-if="titleDescTransApplied">
                {{ $t('caption.title_desc_trans_require') }}&nbsp;
                <el-radio-group v-model="form.title_request_check">
                  <el-radio label="Y">
                    {{ $t('common.yes') }}
                  </el-radio>
                  <el-radio label="N">
                    {{ $t('common.no') }}
                  </el-radio>
                </el-radio-group>
              </div>
            </el-form-item>
            <el-form-item :label="$t('caption.select_lang')" required>
              <div class="trans-item-div">
                <el-button type="default" class="btn-org-lang" :plain="true" :disabled="form.requester_id || $auth.user.user_type == 3 ? false : true" @click="orgDialog = true">
                  <template v-if="selOrgLang">
                    {{ getLangName(selOrgLang) }}
                  </template>
                  <template v-else>
                    {{ $t('placeholder.orglang') }}
                  </template>
                </el-button>
                <div class="right-icon">
                  <i class="el-icon-caret-right"></i>
                </div>
                <el-button type="primary" class="btn-trans-lang" :plain="true" :disabled="!selOrgLang ? true : false" @click="transDialog = true">
                  <template v-if="selTransLangs.length > 0">
                    {{ transLangNames }}
                  </template>
                  <template v-else>
                    {{ $t('placeholder.translang') }}
                  </template>
                </el-button>
              </div>
            </el-form-item>
            <el-form-item :label="$t('caption.orgScene')">
              <div class="org_scene">
                <el-radio-group v-model="org_scene" @change="onOrgScene">
                  <el-radio-button label="N">
                    {{ $t('caption.no_orgscene') }}
                  </el-radio-button>
                  <el-radio-button label="Y">
                    {{ $t('caption.file_upload') }}
                  </el-radio-button>
                </el-radio-group>
                <el-upload
                  ref="orgfileUpload"
                  class="orgfile-upload"
                  :action="placeholderActionUrl"
                  :auto-upload="false"
                  :show-file-list="true"
                  :limit="1"
                  :on-change="onUploadOrgfile"
                  :on-remove="onRemoveOrgfile"
                >
                  <el-button v-if="org_scene === 'Y' && !orgfileName" slot="trigger" type="success" class="btn-upload-orgfile ml20">
                    {{ $t('caption.sel_scene_file') }}
                  </el-button>
                </el-upload>
              </div>
              <div class="org-scene-desc">
                {{ $t('caption.org_scene_desc') }}
              </div>
            </el-form-item>
            <el-form-item v-if="reviewApplied" :label="$t('caption.org_review_request')">
              <span>{{ $t('caption.org_review_request_desc') }}&nbsp;</span>
              <el-radio-group v-model="form.native_review_check">
                <el-radio label="Y">
                  {{ $t('common.yes') }}
                </el-radio>
                <el-radio label="N">
                  {{ $t('common.no') }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="youtubeAutoApplied" :label="$t('caption.youtube_auto_request')">
              <span>{{ $t('caption.youtube_auto_request_desc') }}&nbsp;</span>
              <el-radio-group v-model="form.youtube_apply_check" :disabled="youtube_connected == 'N' ? true : false">
                <el-radio label="Y">
                  {{ $t('common.yes') }}
                </el-radio>
                <el-radio label="N">
                  {{ $t('common.no') }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="$t('caption.translator_memo')" prop="translator_memo">
              <el-input v-model="form.translator_memo" :placeholder="$t('caption.memo_desc')" type="textarea" :autosize="{ minRows: 3, maxRows: 4}"></el-input>
            </el-form-item>
            <el-form-item :label="$t('caption.requester_memo')" prop="requester_memo">
              <el-input v-model="form.requester_memo" :placeholder="$t('caption.req_memo_desc')" type="textarea" :autosize="{ minRows: 3, maxRows: 4}"></el-input>
            </el-form-item>
          </el-col>
          <el-col :lg="8" class="right-container">
            <el-form-item v-if="$auth.user.user_type == 1" :label="$t('caption.choose_company')" prop="company_id" class="select-company">
              <el-select v-model="form.company_id" filterable :placeholder="$t('placeholder.sel_company')" @change="companyChanged">
                <el-option
                  v-for="item in companyList"
                  :key="item.id"
                  :label="item.company_name"
                  :value="item.id"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item v-if="$auth.user.user_type == 1 || $auth.user.user_type == 2 || $auth.user.user_type == 7" :label="$t('caption.choose_requester')" prop="requester_id" class="select-requester">
              <el-select v-model="form.requester_id" filterable :placeholder="$t('placeholder.choose_requster')" @change="requesterChanged">
                <el-option
                  v-for="item in requesterList"
                  :key="item.id"
                  :label="item.user_name"
                  :value="item.id"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <div class="summary-section">
              <div class="summary-section-title">
                <label>
                  {{ $t('caption.request_info_note') }}
                </label>
              </div>
              <div class="summary-section-content">
                <div class="detail-section">
                  <label>
                    {{ $t('caption.scene_info') }}
                  </label>
                  <div>
                    <div class="detail_section">
                      <span>{{ $t('caption.play_length') }}</span>
                      <span>{{ formatDuration }}</span>
                    </div>
                    <div class="detail_section">
                      <span>{{ $t('caption.title_desc') }}</span>
                      <span>{{ $t('caption.title_desc_length', { n: getTitleDescLength }) }}</span>
                    </div>
                  </div>
                </div>
                <div class="detail-section">
                  <label>
                    {{ $t('caption.lang_info') }}
                  </label>
                  <div>
                    <div class="detail_section">
                      <span>{{ $t('placeholder.orglang') }}</span>
                      <span>{{ selOrgLang ? getLangName(selOrgLang) : '-' }}</span>
                    </div>
                    <div class="detail_section">
                      <span>{{ $t('placeholder.translang') }}</span>
                      <span>{{ selTransLangs.length > 0 ? transLangNames : '-' }}</span>
                    </div>
                  </div>
                </div>
                <div class="detail-section">
                  <label>
                    {{ $t('caption.option_info') }}
                  </label>
                  <div>
                    <div class="detail_section">
                      <span>{{ $t('caption.orgScene') }}</span>
                      <span>{{ orgfileName ? orgfileName : $t('caption.scene_no') }}</span>
                    </div>
                    <div v-if="youtubeAutoApplied" class="detail_section">
                      <span>{{ $t('caption.apply_youtube') }}</span>
                      <span>{{ form.youtube_apply_check === 'Y' ? $t('common.yes') : $t('common.no') }}</span>
                    </div>
                    <div v-if="titleDescTransApplied" class="detail_section">
                      <span>{{ $t('caption.title_desc_trans') }}</span>
                      <span>{{ form.title_request_check === 'Y' ? $t('common.yes') : $t('common.no') }}</span>
                    </div>
                    <div v-if="reviewApplied" class="detail_section">
                      <span>{{ $t('caption.org_review') }}</span>
                      <span>{{ form.native_review_check === 'Y' ? $t('common.yes') : $t('common.no') }}</span>
                    </div>
                  </div>
                </div>
                <div class="detail-section">
                  <label>
                    {{ $t('caption.money_info') }}
                    <span v-if="discount && currencyType" class="discount-info">
                      ({{ $t('caption.trans_unit_price_discount', {currencyType: currencySymbol, discount: discount}) }})
                    </span>
                  </label>
                  <div>
                    <div class="detail_section">
                      <span>{{ $t('caption.trans_money') }}</span>
                      <template v-if="selOrgLang && selTransLangs.length > 0 && prices.length > 0">
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <span class="caption-lang-pair" v-html="transUnitPrice"></span>
                      </template>
                      <span v-else class="cost-info">-</span>
                    </div>
                    <div class="detail_section">
                      <span>{{ $t('caption.trans_cost') }}</span>
                      <span v-if="prices.length > 0 && duration > 0" class="cost-info">
                        {{ transAmount }}
                      </span>
                      <span v-else class="cost-info">-</span>
                    </div>
                    <div v-if="titleDescTransApplied" class="detail_section">
                      <span class="title-desc-label">{{ $t('caption.title_desc_money') }}</span>
                      <span v-if="titleCost && form.title_request_check == 'Y'" class="cost-info">
                        {{ titleDescCost }}
                      </span>
                      <span v-else class="cost-info">-</span>
                    </div>
                    <div v-if="reviewApplied" class="detail_section">
                      <span class="native-review-label">{{ $t('caption.review_money') }}</span>
                      <!-- eslint-disable-next-line vue/no-v-html -->
                      <span v-if="prices.length > 0 && duration > 0 && form.native_review_check == 'Y'" class="cost-info" v-html="nativeReviewCost">
                      </span>
                      <span v-else>-</span>
                    </div>
                  </div>
                </div>
                <div class="detail-section">
                  <label>
                    {{ $t('caption.total_money') }}
                  </label>
                  <div>
                    <div class="detail_section total-calc-cost">
                      <el-row type="flex" :justify="free_req_count > 0 ? &quot;space-between&quot; : &quot;flex-end&quot;">
                        <el-checkbox
                          v-if="free_req_count > 0"
                          v-model="free_require"
                          class="free-req-checkbox"
                          @change="freeReqCheck"
                        >
                          {{ $t('caption.free_require_cnt', {n: free_req_count}) }}
                        </el-checkbox>
                        <span v-if="currencyType && duration" class="final-cost">
                          {{ free_require ? 'Free' : currencySymbol + numberWithCommas(calcFinalCost) }}
                        </span>
                      </el-row>
                      <!--
                      <el-alert
                        v-if="free_req_count > 0 && free_req_count < selTransLangs.length"
                        :title="$t('caption.free_req_count_shortage')"
                        type="warning"
                        show-icon
                      >
                      </el-alert>
                      -->
                    </div>
                  </div>
                </div>
                <div class="detail-section">
                  <label>
                    {{ $t('caption.schedule_info') }}
                  </label>
                  <div>
                    <div class="detail_section">
                      <span>{{ $t('caption.finish_schedule') }}</span>
                      <span v-if="duration && endTimeSetting.length > 0" class="scheduled-time">{{ finishScheduledTime }}</span>
                    </div>
                    <div class="detail_section">
                      <!-- <el-checkbox v-model="urg_trans" class="urg-trans-checkbox" :disabled="!urgTransAvailable"> -->
                      <el-checkbox v-model="urg_trans" class="urg-trans-checkbox" @change="urgTransCheck">
                        {{ $t('caption.urg_trans_require', { premiumRate : premiumRate}) }}
                      </el-checkbox>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="summary-section">
              <el-button type="primary" class="btn-submit" :disabled="wholeLoading" @click="onSubmit('captionReqform')">
                {{ $t('caption.require_trans') }}
              </el-button>
            </div>
            <input id="btnPayReturn" type="button" hidden @click="paymentReturn()" />
            <div class="summary-section safe_section">
              <div class="mt15">
                <img class="privacy" src="https://cdn2.iconfinder.com/data/icons/privacy-policy/512/privacy-data-policy-security-12-512.png" />
              </div>
              <div>
                <label>{{ $t('caption.use_safe') }}</label>
                <br />
                <div class="mt5">
                  {{ $t('caption.use_safe1') }}
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-dialog
      :title="$t('placeholder.orglang')"
      :visible.sync="orgDialog"
      width="40%"
      @open="openOrgDialog"
    >
      <div>
        <template v-if="availableOrgLangs.length > 0">
          <el-radio
            v-for="lang in availableOrgLangs"
            :key="lang.id"
            v-model="orglang"
            :label="lang.id"
            class="lang-options"
          >
            {{ $t('common.' + lang.name) }}
          </el-radio>
        </template>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="closeOrgDialog">{{ $t('requester.select_complete') }}</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :title="$t('placeholder.translang')"
      :visible.sync="transDialog"
      width="40%"
      @open="openTransDialog"
    >
      <el-checkbox-group v-model="transLangCheckList" @change="handleCheckedLang">
        <template v-if="availableTransLangs.length > 0">
          <el-checkbox
            v-for="lang in availableTransLangs"
            :key="lang.id"
            :value="lang.id"
            :label="$t('common.' + lang.name)"
            class="lang-options"
          >
          </el-checkbox>
        </template>
      </el-checkbox-group>
      <span slot="footer" class="trans-dialog-footer">
        <label>
          {{ $t('requester.selected_lang_count', { n: checkedCount}) }}
        </label>
        <div>
          <el-button @click="formatSelectTransLang">{{ $t('requester.format_select') }}</el-button>
          <el-button type="primary" @click="closeTransDialog">{{ $t('requester.select_complete') }}</el-button>
        </div>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import global from '@/mixin/global'
import langPairs from '@/mixin/langPairs'
import variables from '@/assets/styles/variables.scss'

const reviewService = 2 // 검수작업
const titleDescTransService = 3 // 제목/설명 번역
const youtubeAutoService = 4 // YouTube자동적용 요청

export default {
  // middleware: ['auth', 'auth-client'],
  middleware: ['auth', 'stats'],
  layout: 'default',
  components: {
  },
  mixins: [global, langPairs],
  data () {
    return {
      variables,
      wholeLoading: false,
      loading: false,
      form: {
        youtube_url: '', // 영상 youtube link
        youtube_id: '', // 영상 youtube id
        company_id: '', // 선택된 고객사 id
        requester_id: '', // 선택된 요청자 id
        title_request_check: 'Y', // 제목/설명번역 요청여부
        native_review_check: 'Y', // 원어민 검수여부
        youtube_apply_check: 'Y', // youtube자동적용 요청여부
        translator_memo: '', // 번역가에게 메모
        requester_memo: '' // 요청자에게 메모
      },
      org_scene: 'N', // 원본자막 업로드여부

      // youtube screen info
      title: '', // 영상제목
      title_length: '', // 영상제목길이
      description: '', // 영상설명
      description_length: '', // 영상설명길이
      duration: '', // 영상시간

      free_require: false, // 무료요청회수사용여부
      urg_trans: false, // 긴급번역요청여부

      rules: { // validation
        youtube_url: [
          { required: true, message: this.$t('validation.youtube_link'), trigger: 'blur' }
        ],
        company_id: [
          { required: true, message: this.$t('validation.company_required'), trigger: 'change' }
        ],
        requester_id: [
          { required: true, message: this.$t('validation.requester_required'), trigger: 'change' }
        ],
        memo: [
          { min: 0, max: 300, message: this.$t('validation.memo_exceed_maxleng'), trigger: 'blur' }
        ]
      },
      companyList: [],
      requesterList: [],
      orgfileUploaded: false, // 원본자막화일 업로드여부
      orgfileName: '', // 원본자막화일이름
      orgfile: null, // 원본자막화일
      discount: 0, // 요청자 할인금액
      free_req_count: 0, // 요청자 무료요청가능횟수,
      youtube_connected: true, // 요청자 youtube연동 여부
      reviewApplied: true, // 고객사 검수신청여부
      titleDescTransApplied: true, // 고객사 제목/설명번역신청여부
      youtubeAutoApplied: true, // 고객사 youtube자동적용신청여부
      currencyType: '', // 고객사 기준화페
      prices: [], // 고객사 언어쌍에 따르는 번역금액정보
      titleCost: 0, // 고객사 제목/설명 금액
      premiumRate: 0, // 고객사 긴급번역할증율
      screenTimeLimit: { // 영상시간 제한길이정보
        enable_trans_length_for48: 0,
        extra_trans_time_for48: 0,
        urgent_trans_length_for24: 0,
        free_trans_length: 0
      },
      endTimeSetting: [],
      paymentCheck: 'N',
      requesterEmail: ''
    }
  },
  computed: {
    youtubeInfo () {
      const titleInfo = this.$t('caption.title') + ': ' +
      this.title + '(' + this.title_length + ')' + '\n'
      const descInfo = this.$t('caption.description') + ': ' +
      this.description + '(' + this.description_length + ')' + '\n'
      return titleInfo + descInfo
    },
    youtubeEmbedUrl () {
      return 'https://www.youtube.com/embed/' + this.form.youtube_id
    },
    formatDuration () {
      if (!this.duration) {
        return '00:00:00'
      }
      const secNum = parseInt(this.duration, 10) // don't forget the second param
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
    getTitleDescLength () {
      if (this.title_length) {
        return this.title_length + this.description_length
      } else {
        return 0
      }
    },
    urgTransAvailable () {
      if (this.free_require) {
        return false
      }
      const screenLength = this.getScreenMinDuration()
      if (this.screenTimeLimit.urgent_trans_length_for24 && screenLength > parseInt(this.screenTimeLimit.urgent_trans_length_for24)) {
        return false
      } else {
        return true
      }
    },
    freeReqAvailable () {
      if (this.free_req_count < this.selTransLangs.length) {
        return false
      }
      return true
      /* const screenLength = Math.floor(this.duration / 60)
      if (screenLength > parseInt(this.screenTimeLimit.free_trans_length)) {
        return false
      } else {
        return true
      } */
    },
    currencySymbol () {
      return this.currencyList.filter(currency => currency.value === this.currencyType)[0].label
    },
    calcFinalCost () {
      let finalCost = 0
      let transCost = 0
      let titleDescCost = 0
      let reviewCost = 0
      if (this.selTransLangs.length === 0) {
        return 0
      }
      for (let i = 0; i < this.prices.length; i++) {
        const priceInfo = this.prices[i]
        if (this.selOrgLang === priceInfo.original_language.id && this.selTransLangs.includes(this.$t('common.' + priceInfo.translate_language.name))) {
          if (this.discount) {
            let calcPrice = parseInt(priceInfo.price) - parseInt(this.discount)
            if (calcPrice < 0) {
              calcPrice = 0
            }
            transCost += calcPrice
          } else {
            transCost += parseInt(priceInfo.price)
          }
          if (priceInfo.native_review_price) {
            reviewCost += parseInt(priceInfo.native_review_price)
          }
        }
      }
      const minDuration = this.getScreenMinDuration()
      if (this.form.title_request_check === 'Y') {
        titleDescCost = parseInt(this.titleCost) * this.selTransLangs.length
      } else {
        titleDescCost = 0
      }
      if (this.form.native_review_check === 'Y') {
        finalCost += transCost * minDuration + titleDescCost + reviewCost * minDuration
      } else {
        finalCost += transCost * minDuration + titleDescCost
      }
      if (this.urg_trans) {
        return Math.floor(finalCost * (this.premiumRate + 100) / 100)
      } else {
        return finalCost
      }
    },
    transUnitPrice () {
      let content = ''
      for (let i = 0; i < this.selTransLangs.length; i++) {
        const lang = this.selTransLangs[i]
        const result = this.prices.filter(item => item.original_language.id === this.selOrgLang && this.$t('common.' + item.translate_language.name) === lang)[0]
        if (result) {
          const orgFirstChar = this.$t('common.' + result.original_language.name + '1')
          const transFirstChar = this.$t('common.' + result.translate_language.name + '1')
          const transId = result.translate_language.id
          let price = '0'
          if (this.discount) {
            let calcPrice = parseInt(result.price) - parseInt(this.discount)
            if (calcPrice < 0) { calcPrice = 0 }
            price = this.currencySymbol + calcPrice + '/1min'
          } else {
            price = this.currencySymbol + result.price + '/1min'
          }
          content += '<span class="unit-price"><span class="lang-pair lang-id-' + transId + '">' + orgFirstChar + '-' + transFirstChar + '</span> ' + price + '</span>'
        }
      }
      return content
    },
    transAmount () {
      let content = '('
      let value = 0
      if (this.selTransLangs.length === 0) {
        return '-'
      }
      for (let i = 0; i < this.prices.length; i++) {
        const priceInfo = this.prices[i]
        if (this.selOrgLang === priceInfo.original_language.id && this.selTransLangs.includes(this.$t('common.' + priceInfo.translate_language.name))) {
          if (this.discount) {
            let calcPrice = parseInt(priceInfo.price) - parseInt(this.discount)
            if (calcPrice < 0) {
              calcPrice = 0
            }
            value += calcPrice
            content += this.currencySymbol + calcPrice.toString() + '+'
          } else {
            value += parseInt(priceInfo.price)
            content += this.currencySymbol + priceInfo.price + '+'
          }
        }
      }
      content = content.slice(0, -1) + ')'
      const minDuration = this.getScreenMinDuration()
      const totalTransAmount = value * minDuration
      content += '*' + minDuration + 'min = ' + this.currencySymbol + this.numberWithCommas(totalTransAmount)
      return content
    },
    titleDescCost () {
      const transCount = this.selTransLangs.length
      const totalTitleCost = parseInt(this.titleCost) * transCount
      const content = this.currencySymbol + this.titleCost + '*' + transCount + '=' + this.currencySymbol + totalTitleCost
      return content
    },
    nativeReviewCost () {
      let content = '('
      let value = 0
      if (this.selTransLangs.length === 0) {
        return '-'
      }
      for (let i = 0; i < this.selTransLangs.length; i++) {
        const lang = this.selTransLangs[i]
        const result = this.prices.filter(item =>
          item.original_language.id === this.selOrgLang && this.$t('common.' + item.translate_language.name) === lang
        )[0]
        if (result) {
          const calcPrice = parseInt(result.native_review_price)
          const transId = result.translate_language.id
          const transFirstChar = this.$t('common.' + result.translate_language.name + '1')
          value += calcPrice
          content += '<span class="lang-id lang-id-' + transId + '">' + transFirstChar +
          '</span>' + this.currencySymbol + calcPrice.toString() + '+'
        }
      }
      if (content === '(') {
        return '-'
      }
      content = content.slice(0, -1) + ')'
      const minDuration = this.getScreenMinDuration()
      const totalReviewCost = value * minDuration
      content += '*' + minDuration + 'min = ' + this.currencySymbol + this.numberWithCommas(totalReviewCost)
      return content
    },
    finishScheduledTime () {
      if (this.urg_trans) {
        return this.$t('caption.scheduled_time_24')
      }
      const totalCalcTime = this.getTotalScheduledTime()
      if (!totalCalcTime) {
        return this.$t('caption.scheduled_time_48')
      } else {
        // this.screenTimeLimit.extra_trans_time_for48
        /* const exceedTime48 = this.getScreenMinDuration() - this.screenTimeLimit.enable_trans_length_for48
        const normalTime48 = this.screenTimeLimit.enable_trans_length_for48
        let totalCalcTime = 0 // min
        for (let i = 0; i < this.endTimeSetting.length; i++) {
          totalCalcTime += this.endTimeSetting[i].minute_trans_time_for48 * normalTime48 + this.endTimeSetting[i].trans_add_time_for48 +
          this.endTimeSetting[i].minute_excess_time_for48 * exceedTime48 + this.endTimeSetting[i].excess_add_time_for48
        } */
        const hours = Math.floor(totalCalcTime / 60)
        const minutes = totalCalcTime - hours * 60
        if (hours === 0) {
          return this.$t('caption.calc_scheduled_min_time', { min: minutes })
        }
        if (minutes === 0) {
          return this.$t('caption.calc_scheduled_hour_time', { hour: hours })
        }
        return this.$t('caption.calc_scheduled_time', { hour: hours, min: minutes })
      }
    }
  },
  watch: {
    duration (newVal) {
      if (newVal) {
        this.urg_trans = false
      }
    }
  },
  created () {
    if (this.$auth.user.user_type === 1) { // admin case, call company list api before mounted
      this.getCompanyList()
    }
    if (this.$auth.user.user_type === 2 || this.$auth.user.user_type === 7) { // company case
      this.getCompanyInfo()
      this.getRequesterList()
    }
    if (this.$auth.user.user_type === 3) { // requester case
      this.getCompanyInfo()
      this.getRequesterInfo()
      this.paymentCheck = this.$auth.user.payment
      this.requesterEmail = this.$auth.user.email
    }
  },
  methods: {
    freeReqCheck (updateValue, event) {
      /* const screenLength = Math.floor(this.duration / 60)
      if (screenLength > parseInt(this.screenTimeLimit.free_trans_length)) {
        return false
      } else {
        return true
      } */
      if (this.getScreenMinDuration() > parseInt(this.screenTimeLimit.free_trans_length)) {
        this.free_require = false
        this.$message.error(this.$t('caption.free_limit_msg', { n: parseInt(this.screenTimeLimit.free_trans_length) }))
        return
      }
      // eslint-disable-next-line camelcase
      if (this.free_req_count > 0 && this.free_req_count < this.selTransLangs.length) {
        this.free_require = false
        this.$message.error(this.$t('caption.free_req_count_shortage'))
      }
      // console.log('clicked,----', updateValue)
    },
    urgTransCheck (updateValue, event) {
      if (this.getScreenMinDuration() > parseInt(this.screenTimeLimit.urgent_trans_length_for24)) {
        this.urg_trans = false
        this.$message.error(this.$t('caption.urg_limit_msg', { n: parseInt(this.screenTimeLimit.urgent_trans_length_for24) }))
      }
    },
    getScreenMinDuration () {
      let minutes = Math.floor(parseInt(this.duration) / 60)
      const seconds = parseInt(this.duration) % 60
      if (seconds >= 30) {
        minutes += 1
      } else if (seconds < 30 && minutes < 1) { minutes += 1 }
      return minutes
    },
    getTotalScheduledTime () {
      if (this.getScreenMinDuration() < this.screenTimeLimit.enable_trans_length_for48) {
        return 0
      }
      let totalCalcTime = 0 // min
      for (let i = 0; i < this.endTimeSetting.length; i++) {
        totalCalcTime += this.endTimeSetting[i].minute_excess_time_for48 * this.getScreenMinDuration() + this.endTimeSetting[i].excess_add_time_for48
      }
      totalCalcTime += this.screenTimeLimit.extra_trans_time_for48
      return totalCalcTime
    },
    async getCompanyList () {
      try {
        const resp = await this.$axios.post('/company/get-company-list')
        const { errorCode, data } = resp.data
        if (errorCode === 0) {
          this.companyList = data.list
        } else {
          this.companyList = []
        }
      } catch (err) {
        this.companyList = []
      }
    },
    async getRequesterList () {
      try {
        if (this.$auth.user.user_type === 7) { this.form.company_id = this.$auth.user.company_id }
        const resp = await this.$axios.post('/requester/get-requester-list', {
          search: { company_ids: [this.form.company_id] }
        })
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
    async getRequesterInfo () {
      try {
        const param = {}
        if (this.$auth.user.user_type < 3 || this.$auth.user.user_type === 7) {
          param.requester_id = this.form.requester_id
        }
        const resp = await this.$axios.post('/requester/get-requester-info', param)
        const { data } = resp.data
        if (data.original_language) {
          this.selOrgLang = data.original_language.id
          this.orglang = this.selOrgLang
          this.setAvailableTransLangs()
          if (data.working_languages && data.working_languages.length > 0) {
            for (let i = 0; i < data.working_languages.length; i++) {
              this.transLangCheckList.push(this.$t('common.' + data.working_languages[i].name))
              this.selTransLangs.push(this.$t('common.' + data.working_languages[i].name))
            }
          }
        } else {
          this.orglang = ''
          this.selOrgLang = ''
          this.transLangCheckList = []
          this.selTransLangs = []
        }
        this.checkedCount = this.selTransLangs.length
        this.free_req_count = data.free_request_count
        this.discount = data.discount
        this.youtube_connected = data.youtube_connected
        this.paymentCheck = data.payment
        this.requesterEmail = data.email
        if (data.youtube_connected === 'N') {
          this.form.youtube_apply_check = 'N'
        } else {
          this.form.youtube_apply_check = 'Y'
        }
      } catch (err) {
      }
    },
    async getCompanyInfo () {
      const param = {}
      if (this.$auth.user.user_type === 1) {
        param.company_id = this.form.company_id
      }
      const resp = await this.$axios.post('/company/get-company-info', param)
      const { data } = resp.data
      const services = data.services
      this.checkServiceAvailability(services)
      this.prices = data.prices
      this.currencyType = data.currency_type
      this.titleCost = data.title_cost
      this.premiumRate = data.premium_rate
      this.langPairs = data.language_pairs
      this.screenTimeLimit = data.screen_time_limit
      this.endTimeSetting = data.end_time_settings
      for (let i = 0; i < this.langPairs.length; i++) {
        const matched = this.availableOrgLangs.filter(lang => lang.id === this.langPairs[i].original_language.id)
        if (matched.length === 0) {
          this.availableOrgLangs.push(this.langPairs[i].original_language)
        }
      }
    },
    checkServiceAvailability (services) {
      if (!services.includes(reviewService)) {
        this.reviewApplied = false
        this.form.native_review_check = 'N'
      } else {
        this.reviewApplied = true
        this.form.native_review_check = 'Y'
      }
      if (!services.includes(titleDescTransService)) {
        this.titleDescTransApplied = false
        this.form.title_request_check = 'N'
      } else {
        this.form.title_request_check = 'Y'
        this.titleDescTransApplied = true
      }

      if (!services.includes(youtubeAutoService)) {
        this.youtubeAutoApplied = false
        this.form.youtube_apply_check = 'N'
      } else {
        this.form.youtube_apply_check = 'Y'
        this.youtubeAutoApplied = true
      }
    },
    onUploadOrgfile (file, filelist) {
      this.orgfileUploaded = true
      this.orgfileName = file.name
      this.orgfile = file.raw
    },
    onRemoveOrgfile (file, filelist) {
      this.orgfileName = ''
      this.orgfileUploaded = false
      this.orgfile = null
    },
    paymentRequest (captionId) {
      const popupSize = 'width=600' + ',height=' + this.variables.popupHeight
      window.open('/payment?amount=' + this.calcFinalCost + '&email=' + this.requesterEmail + '&captionId=' + captionId + '&currency=' + this.currencyType, 'payment', popupSize)
    },
    paymentReturn () {
      if (this.$auth.user.user_type === 1) {
        this.$router.push('/caption/list/admin')
      } else {
        this.$router.push('/caption/list/company')
      }
    },
    onSubmit (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          if (!this.selOrgLang || this.selTransLangs.length === 0) {
            this.$notify({
              title: this.$t('common.fail'),
              message: this.$t('validation.lang_pair_required'),
              type: 'error'
            })
            return false
          }
          this.wholeLoading = true
          const formData = new FormData()
          if (this.orgfile != null) {
            formData.append('file', this.orgfile)
          }
          if (this.$auth.user.user_type === 2) {
            delete this.form.company_id
          }
          if (this.$auth.user.user_type === 3) {
            delete this.form.company_id
            delete this.form.requester_id
          }
          for (const key in this.form) {
            formData.append(key, this.form[key])
          }
          formData.append('original_language', this.selOrgLang)
          for (let i = 0; i < this.selTransLangs.length; i++) {
            formData.append('translate_languages[]', this.getTransLangId(this.selTransLangs[i]))
          }
          if (this.free_require) {
            formData.append('free_request_check', 'Y')
            formData.append('work_price', 0)
          } else {
            formData.append('work_price', this.calcFinalCost)
          }
          if (this.urg_trans) {
            formData.append('emergency_request_check', 'Y')
            formData.append('predict_time', 0)
          } else {
            formData.append('predict_time', this.getTotalScheduledTime())
          }
          this.$axios.post('/subtitle-translation/request-translate', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }).then((resp) => {
            this.wholeLoading = false
            const { errorCode, data } = resp.data
            if (errorCode === 0) {
              /* this.$notify({
                title: this.$t('common.success'),
                message: this.$t('common.register_success'),
                type: 'success'
              }) */
              if (this.paymentCheck === 'Y' && this.calcFinalCost > 0 && !this.free_require) {
                this.paymentRequest(data.caption_id)
              } else {
                this.paymentReturn()
              }
            } else {
              this.$notify({
                title: this.$t('common.fail'),
                message: this.$t('common.invalid_param'),
                type: 'error'
              })
            }
          })
        } else {
          return false
        }
      })
    },
    async getYoutubeInfo () {
      this.loading = true
      this.free_require = false
      try {
        const resp = await this.$axios.post('/requester/check-valid-youtube-url', {
          video_url: this.form.youtube_url
        })
        const { errorCode, data } = resp.data
        if (errorCode === 0) {
          this.form.youtube_id = data.youtube_id
          this.title = data.title
          this.description = data.description
          this.title_length = data.title_length
          this.description_length = data.description_length
          this.duration = data.duration
        } else {
          this.form.youtube_id = ''
          this.title = ''
          this.description = ''
          this.title_length = ''
          this.description_length = ''
          this.duration = ''
          this.$message.error(this.$t('caption.invalid_youtube_url'))
        }
      } catch (err) {
        this.$message.error(this.$t('caption.invalid_youtube_url'))
      } finally {
        this.loading = false
      }
    },
    onOrgScene () {
      if (this.org_scene === 'N') {
        this.$refs.orgfileUpload.clearFiles()
        this.orgfileUploaded = false
        this.orgfileName = ''
      }
    },
    companyChanged () {
      /** v-model value */
      this.orglang = ''
      this.transLangCheckList = []
      /** final selected value */
      this.selOrgLang = ''
      this.selTransLangs = []
      this.availableOrgLangs = []
      this.availableTransLangs = []
      this.getRequesterList()
      this.form.requester_id = ''
      this.getCompanyInfo()
    },
    requesterChanged () {
      if (this.form.requester_id) {
        this.orglang = ''
        this.selOrgLang = ''
        this.transLangCheckList = []
        this.selTransLangs = []
        this.availableTransLangs = []
        this.getRequesterInfo()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.el-row--flex.is-justify-flex-end {
  justify-content: flex-end;
}

.left-container {
  border-right: 1px solid $gray30;
  padding: 10px;
  .youtube-icon {
    display: flex;
    align-items: center;
  }
  .youtube-icon .svg-icon {
    width: $svgSize;
    height: $svgSize;
  }
  .youtube-iframe {
    text-align: center;
    iframe {
      width: 80%;
      height: 300px;
    }
  }
  .youtube-empty-div {
    width: 90%;
    height: 300px;
    background: grey;
    margin: auto;
    margin-bottom: 20px;
    color: white;
    justify-content: center;
    display: flex;
  }
  .youtube-empty-div span{
    align-self: center;
    margin: 0 20px;
    text-align: center;
    line-height: 2;
  }
  .youtube-info {
    color: #81848a
  }
  .btn-youtube-info {
    margin-bottom: 20px;
    margin-left: 20px;
  }
  .trans-item-div {
    display: flex;
    align-items: center;
    .btn-org-lang {
      flex: 2;
    }
    .right-icon {
      flex: 1;
      text-align: center;
      border: 1px solid $gray30;
      margin-left: 20px;
      margin-right: 20px;
      border-radius: 5px;
    }
    .btn-trans-lang {
      margin-left: 0px;
      flex: 2;
    }
  }
}

.el-checkbox {
  flex: 1;
  margin-right: 0px;
}

.lang-options {
  margin: 10px 0;
  width: 32%;
}

.trans-dialog-footer{
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.org_scene {
  display: flex;
  align-items: center;
}
.org-scene-desc {
  margin-top: 5px;
  line-height: 25px;
}

.right-container {
  padding: 15px 15px 15px 20px;
  .summary-section-title {
    padding: 8px 0;
  }
  .summary-section {
    margin-bottom: 15px;
  }
  .summary-section-content {
    margin: 5px;
  }
  .detail-section {
    margin-bottom: 20px;
  }
  .detail_section {
    font-size: 14px;
    margin: 10px 0 10px 5px;
    display: flex;
    justify-content: space-between;
    & > span {
      min-width: 60px;
    }
    span:nth-child(2) {
      text-align: right;
    }
  }
  .discount-info {
    font-size: 14px;
    color: red;
  }
  .btn-submit {
    width: 100%
  }
  .privacy {
    width: 30px;
    margin-right: 10px;
  }
  .safe_section {
    display: flex;
    align-items: center;
  }
  .native-review-label {
    min-width: 100px !important;
  }
  .cost-info {
    font-weight: bold;
    text-align: right;
  }
  .title-desc-label {
    min-width: 120px !important;
  }
  .final-cost {
    color:blue;
    font-weight: bold;
    font-size: 16px;
  }
  .scheduled-time {
    font-weight: bold;
  }
  .urg-trans-checkbox {
    display: flex;
  }
}
.total-calc-cost {
  flex-direction: column;
  .free-req-checkbox {
    display: flex;
    max-width: 70%;
    white-space: normal;
    margin-bottom: 5px;
    span:first-child {
      margin-top: 3px;
    }
  }
}
::v-deep {
  .urg-trans-checkbox {
    display: flex;
    .el-checkbox__input {
      margin-top: 3px;
    }
    .el-checkbox__label {
      width: 100%;
      white-space: normal;
    }
  }
  .el-input__inner {
    height: $inputBoxHeight;
  }
  .el-dialog__body {
    border-top: 1px solid #dcdcdc;
    border-bottom: 1px solid #dcdcdc;
  }
  .select-company, .select-requester {
    .el-form-item__label {
      width: 180px !important;
    }
    .el-form-item__content {
      margin-left: 180px !important;
      text-align: right !important;
      .el-select {
        width: 100%;
      }
    }
  }
  .orgfile-upload {
    .el-upload {
      display: block;
    }
  }
  @media screen and (max-width: 1400px) {
    .select-company, .select-requester {
      .el-form-item__label {
        width: 100px !important;
      }
      .el-form-item__content {
        margin-left: 100px !important;
        text-align: right !important;
        .el-select {
          width: 100%;
        }
      }
    }
  }
  @media screen and (max-width: 1200px) {
    .select-company, .select-requester {
      .el-form-item__label {
        width: 180px !important;
      }
      .el-form-item__content {
        margin-left: 180px !important;
        text-align: right !important;
        .el-select {
          width: 100%;
        }
      }
    }
  }
}
</style>
