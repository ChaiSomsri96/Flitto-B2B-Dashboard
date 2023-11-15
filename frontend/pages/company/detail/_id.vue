<template>
  <div class="detail-container">
    <div class="page-title">
      {{ $t('company.detail') }}
    </div>
    <el-card class="box-card">
      <el-form ref="companyDetailForm" :model="form" label-width="150px" label-position="left">
        <el-row>
          <el-col :md="18" :lg="18" class="left-container">
            <el-form-item :label="$t('label.account_type')">
              <span class="account-type">{{ $t('user_type.company') }}</span>
            </el-form-item>
            <el-form-item :label="$t('label.userid')">
              <input-with-icon
                :input-value="form.user_id"
                :icon-name="'contact-24'"
                :disabled="true"
              />
            </el-form-item>
            <el-form-item :label="$t('label.password')">
              <input-with-icon
                :input-value="'-'"
                :icon-name="'lock-24'"
                :disabled="true"
              />
            </el-form-item>
            <el-form-item :label="$t('label.company_name')">
              <input-with-icon
                :input-value="form.company_name"
                :icon-name="'person-24'"
                :disabled="true"
              />
            </el-form-item>
            <el-form-item :label="$t('label.contact_name')">
              <input-with-icon
                :input-value="form.user_name"
                :icon-name="'person-24'"
                :disabled="true"
              />
            </el-form-item>
            <el-form-item :label="$t('label.phone')">
              <input-with-icon
                :input-value="form.country_code + form.phone_number"
                :icon-name="'call-24'"
                :disabled="true"
              />
            </el-form-item>
            <el-form-item :label="$t('label.email')">
              <input-with-icon
                :input-value="form.email"
                :icon-name="'mail-24'"
                :disabled="true"
                :placeholder="$t('placeholder.email')"
              />
            </el-form-item>
            <el-form-item :label="$t('label.syslang')">
              <input-with-icon
                :input-value="getSyslangName"
                :icon-name="'global'"
                :disabled="true"
              />
            </el-form-item>
          </el-col>
          <el-col :md="6" :lg="6" class="avatar-container">
            <div class="profile-avatar">
              <img :src="form.avatar ? form.avatar : defaultAvatar" class="avatar" />
              <p>{{ $t('company.profile_avatar') }}</p>
            </div>
            <div class="company-logo">
              <img :src="form.company_logo ? form.company_logo : defaultLogo" />
              <p>{{ $t('company.company_logo') }}</p>
            </div>
          </el-col>
        </el-row>
        <el-row>
          <el-col :lg="24" class="bottom-container">
            <el-form-item :label="$t('company.support_service')">
              <div class="tag-group">
                <el-tag type="primary" effect="dark">
                  {{ mainService }}
                </el-tag>
                <!-- Default support service -->
                <el-tag type="info" effect="dark">
                  {{ supportServices[0] }}
                </el-tag>
                <el-tag
                  v-for="item in form.services"
                  :key="item"
                  type="info"
                  effect="dark"
                >
                  {{ supportServices[item] }}
                </el-tag>
              </div>
            </el-form-item>
            <el-form-item :label="$t('company.trans_lang_pair')" class="trans-lang-pair">
              <div class="trans-item-div">
                <el-tag type="primary" effect="dark" class="mr20">
                  {{ mainService }}
                </el-tag>
                <div v-for="(item, i) in form.working_languages" :key="i">
                  <span>{{ $t('common.' + item.original.name) }}</span>&nbsp;
                  <i class="el-icon-right"></i>
                  <span>{{ $t('common.' + item.translate.name) }}</span>
                </div>
              </div>
            </el-form-item>
            <el-form-item :label="$t('company.trans_work_amount')" class="trans-work-amount ">
              <el-row>
                <el-tag type="primary" effect="dark">
                  {{ mainService }}
                </el-tag>
                <div v-if="form.is_base_price_set == 'N'">
                  <el-table
                    border
                    header-row-class-name="company-end-table"
                    :data="basicPayStandard1"
                    row-class-name="trans-amount-body"
                  >
                    <el-table-column :label="$t('company.base_currency')">
                      <template slot-scope="scope">
                        <span>{{ scope.row.currencyType }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.trans_cost')">
                      <template slot-scope="scope">
                        <div>{{ scope.row.currencyType + scope.row.titleCost }}</div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.urg_trans_rate')">
                      <template slot-scope="scope">
                        <div>{{ scope.row.premiumRate }}%</div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.trans_cost_per_min')">
                      <template slot-scope="scope">
                        <div>{{ scope.row.currencyType }}{{ scope.row.workPrice }}</div>
                      </template>
                    </el-table-column>
                  </el-table>
                  <el-table
                    border
                    header-row-class-name="company-end-table"
                    :data="basicPayStandard2"
                    row-class-name="trans-amount-body"
                  >
                    <el-table-column :label="$t('company.review_cost_per_min')">
                      <template slot-scope="scope">
                        <div>{{ scope.row.currencyType }}{{ scope.row.reviewPrice }}</div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.work_cost_tc_per_min')">
                      <template slot-scope="scope">
                        <div>${{ scope.row.tcPrice }}</div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.work_cost_trans_per_min')">
                      <template slot-scope="scope">
                        <div>${{ scope.row.transPrice }}</div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.work_cost_review_per_min')">
                      <template slot-scope="scope">
                        <div>${{ scope.row.testPrice }}</div>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <div v-else>
                  <el-table border header-row-class-name="company-end-table" :data="basicPayStandard1" row-class-name="trans-amount-body">
                    <el-table-column :label="$t('company.base_currency')" width="120">
                      <template slot-scope="scope">
                        <span>{{ scope.row.currencyType }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.trans_cost')">
                      <template slot-scope="scope">
                        <div>{{ scope.row.currencyType + scope.row.titleCost }}</div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.urg_trans_rate')">
                      <template slot-scope="scope">
                        <div>{{ scope.row.premiumRate }}%</div>
                      </template>
                    </el-table-column>
                  </el-table>
                  <div class="amount-set-question">
                    <label>{{ $t('company.trans_work_question') }}</label>
                    <span>{{ $t('common.yes') }}</span>
                  </div>
                  <el-table border header-row-class-name="company-end-table" :data="form.prices">
                    <el-table-column :label="'From'" width="100" align="center">
                      <template slot-scope="scope">
                        <span>{{ scope.row.original.name }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="'To'" width="100" align="center">
                      <template slot-scope="scope">
                        <span>{{ scope.row.translate.name }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.trans_amount')" align="center">
                      <template slot-scope="scope">
                        <span>{{ basicPayStandard1[0].currencyType + scope.row.work_price }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.review_amount')" align="center">
                      <template slot-scope="scope">
                        <span>{{ basicPayStandard1[0].currencyType + scope.row.native_review_price }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.work_amount') + '(TC)'" align="center">
                      <template slot-scope="scope">
                        <span>${{ scope.row.tc_price }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.work_amount') + '(번역)'" align="center">
                      <template slot-scope="scope">
                        <span>${{ scope.row.trans_price }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.work_amount') + '(검수)'" align="center">
                      <template slot-scope="scope">
                        <span>${{ scope.row.test_price }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-row>
            </el-form-item>
            <el-form-item :label="$t('company.time_limit_set')" class="time-limit-set">
              <div>
                <el-row>
                  <label>
                    {{ "-" + $t('company.normal_trans') }}
                  </label>
                  <div>
                    {{ $t('company.general_screen_limit') }}
                    {{ form.general_screen_limit }}
                    {{ $t('company.min_or_less') }},
                    {{ $t('company.general_end_time') }}
                    {{ form.general_end_time }}
                    {{ $t('company.general_end_time_suffix') }}
                  </div>
                </el-row>
                <el-row>
                  <label>
                    {{ "-" + $t('company.urgent_trans') }}
                  </label>
                  <div>
                    {{ $t('company.emergency_screen_limit') }}
                    {{ form.emergency_screen_limit }}
                    {{ $t('company.min_or_less') }},
                    {{ $t('company.emg_exceed_impossible') }}
                  </div>
                </el-row>
                <el-row>
                  <label>
                    {{ "-" + $t('company.free_trans') }}
                  </label>
                  <div>
                    {{ $t('company.free_screen_limit') }}
                    {{ form.free_screen_limit }}
                    {{ $t('company.free_screen_limit_prefix') }}
                  </div>
                </el-row>
              </div>
            </el-form-item>
            <el-form-item :label="$t('company.worker_assign_set')" class="worker-assign-set">
              <el-row>
                <el-table
                  border
                  header-row-class-name="company-end-table"
                  :data="assignList"
                  row-class-name="trans-amount-body"
                >
                  <el-table-column :label="$t('company.worker_type')" width="100">
                    <template slot-scope="scope">
                      <span>{{ scope.row.worker_type }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('company.shipping_method')" width="150">
                    <template slot-scope="scope">
                      <span>{{ assignTypes[scope.row.assign_type] }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('company.tag')">
                    <template slot-scope="scope">
                      <span v-if="scope.row.assign_type==2">-</span>
                      <span v-else-if="scope.row.tag_type==2">{{ $t('common.all') }}</span>
                      <span v-else>
                        <el-tag
                          v-for="(item, i) in scope.row.tags"
                          :key="i"
                          type="info"
                          effect="dark"
                          class="mr5 mb5"
                        >
                          {{ item }}
                        </el-tag>
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('company.target')" width="210">
                    <template slot-scope="scope">
                      <span v-if="scope.row.assign_type==2">
                        -
                      </span>
                      <span v-else>
                        {{ $t('company.worker_assign_num', { workerType: scope.row.worker_type, num: scope.row.numbers }) }}
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-row>
            </el-form-item>
            <el-form-item :label="$t('company.worker_endtime_set')" class="last-time-setting">
              <template>
                <el-tag type="primary" effect="dark">
                  {{ mainService }}
                </el-tag>
                <el-row>
                  <label>{{ "-  " + $t('company.normal_trans_48') }}</label>
                </el-row>
                <el-row>
                  <el-table border header-row-class-name="company-end-table" :data="generalTransTimeSettings">
                    <el-table-column width="120">
                      <template slot-scope="scope">
                        <span>{{ scope.row.title }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.tc')">
                      <template slot-scope="scope">
                        <div>{{ $t('caption.scene_length') }} * {{ scope.row.tc }}{{ $t('caption.min') }} + {{ scope.row.tc_add }}{{ $t('caption.min') }}</div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.trans')">
                      <template slot-scope="scope">
                        <div>{{ $t('caption.scene_length') }} * {{ scope.row.trans }}{{ $t('caption.min') }} + {{ scope.row.trans_add }}{{ $t('caption.min') }}</div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.review')">
                      <template slot-scope="scope">
                        <div>{{ $t('caption.scene_length') }} * {{ scope.row.review }}{{ $t('caption.min') }} + {{ scope.row.review_add }}{{ $t('caption.min') }}</div>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-row>
                <el-row>
                  <label>{{ "-  " + $t('company.urg_trans_24') }}</label>
                </el-row>
                <el-row>
                  <el-table border header-row-class-name="company-end-table" :data="emgTransTimeSettings">
                    <el-table-column width="120">
                      <template slot-scope="scope">
                        <span>{{ scope.row.title }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.tc')">
                      <template slot-scope="scope">
                        <div>{{ $t('caption.scene_length') }} * {{ scope.row.tc }}{{ $t('caption.min') }} + {{ scope.row.tc_add }}{{ $t('caption.min') }}</div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.trans')">
                      <template slot-scope="scope">
                        <div>{{ $t('caption.scene_length') }} * {{ scope.row.trans }}{{ $t('caption.min') }} + {{ scope.row.trans_add }}{{ $t('caption.min') }}</div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.review')">
                      <template slot-scope="scope">
                        <div>{{ $t('caption.scene_length') }} * {{ scope.row.review }}{{ $t('caption.min') }} + {{ scope.row.review_add }}{{ $t('caption.min') }}</div>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-row>
              </template>
            </el-form-item>
            <el-form-item :label="$t('company.req_pay_flag')" class="payment-request">
              <div class="auto-notify-setting" style="width: calc(50% - 5px);">
                <custom-check-box
                  :is-checked="form.payment_check === 'Y' ? true : false"
                  :label="$t('company.require_card_pay')"
                  :border="true"
                  :disabled="true"
                >
                </custom-check-box>
              </div>
            </el-form-item>
            <el-form-item :label="$t('label.auto_notify')" class="auto-notify">
              <div class="auto-notify-setting">
                <custom-check-box
                  :is-checked="form.sms_notice_check === 'Y' ? true : false"
                  :label="$t('common.sms_notify')"
                  :border="true"
                  :disabled="true"
                >
                </custom-check-box>
                <custom-check-box
                  :is-checked="form.email_notice_check === 'Y' ? true : false"
                  :label="$t('common.email_notify')"
                  :border="true"
                  :disabled="true"
                >
                </custom-check-box>
              </div>
            </el-form-item>
            <el-form-item :label="$t('label.use_terms')" class="use-terms-agree">
              <custom-check-box
                :is-checked="form.use_terms === 'Y' ? true : false"
                :label="$t('company.use_terms_agree')"
                :border="true"
                :disabled="true"
              >
              </custom-check-box>
            </el-form-item>
            <el-form-item :label="$t('label.admin_memo')">
              <el-input
                v-model="form.memo"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 4}"
                :disabled="true"
                maxlength="300"
              >
              </el-input>
            </el-form-item>
            <el-form-item label-width="0px">
              <el-button type="primary" class="btn-modify" @click="onModify">
                <span>{{ $t('common.update') }}</span>
                <i class="el-icon-right"></i>
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import global from '@/mixin/global'
import InputWithIcon from '@/components/common/InputWithIcon.vue'
import CustomCheckBox from '@/components/common/CustomCheckBox.vue'

const currencyTypes = {
  JPY: '¥',
  KRW: '₩',
  USD: '$'
}

export default {
  // middleware: ['auth', 'auth-admin'],
  middleware: ['auth', 'stats'],
  layout: 'detail',
  components: {
    InputWithIcon,
    CustomCheckBox
  },
  mixins: [global],
  async asyncData ({ $axios, params, error }) {
    const companyId = params.id
    try {
      const response = await $axios.post('/company/detail', { id: companyId })
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
      mainService: this.$t('company.caption_trans'),
      supportServices: [
        this.$t('company.trans_work'),
        this.$t('company.tc_work'),
        this.$t('company.review_work'),
        this.$t('company.title_desc_trans'),
        this.$t('company.youtube_auto_apply')
      ],
      basicPayStandard1: [],
      basicPayStandard2: [],
      generalTransTimeSettings: [],
      emgTransTimeSettings: [],
      assignList: [],
      assignTypes: {
        1: this.$t('company.push_notification'),
        2: this.$t('company.manual_assign')
      },
      general_trans_list: [],
      excess_trans_list: [],
      emergency_trans_list: []
    }
  },
  computed: {
    getSyslangName () {
      return this.sysLangList.filter(lang => lang.value === this.form.system_lang)[0].label
    }
  },
  mounted () {
    if (this.form.is_base_price_set === 'N') {
      this.basicPayStandard1 = [{
        currencyType: currencyTypes[this.form.currency_type],
        titleCost: this.form.title_cost,
        premiumRate: this.form.premium_rate,
        workPrice: this.form.prices[0].work_price
      }]
      this.basicPayStandard2 = [{
        currencyType: currencyTypes[this.form.currency_type],
        reviewPrice: this.form.prices[0].native_review_price,
        tcPrice: this.form.prices[0].tc_price,
        transPrice: this.form.prices[0].trans_price,
        testPrice: this.form.prices[0].test_price
      }]
    } else {
      this.basicPayStandard1 = [{
        currencyType: currencyTypes[this.form.currency_type],
        titleCost: this.form.title_cost,
        premiumRate: this.form.premium_rate
      }]
    }
    this.generalTransTimeSettings = [
      {
        title: this.$t('company.trans_48'),
        tc: this.form.end_time_settings.tc.general_trans_time,
        tc_add: this.form.end_time_settings.tc.general_trans_add_time,
        trans: this.form.end_time_settings.translator.general_trans_time,
        trans_add: this.form.end_time_settings.translator.general_trans_add_time,
        review: this.form.end_time_settings.reviewer.general_trans_time,
        review_add: this.form.end_time_settings.reviewer.general_trans_add_time
      },
      {
        title: this.$t('company.over_trans'),
        tc: this.form.end_time_settings.tc.general_excess_time,
        tc_add: this.form.end_time_settings.tc.general_excess_add_time,
        trans: this.form.end_time_settings.translator.general_excess_time,
        trans_add: this.form.end_time_settings.translator.general_excess_add_time,
        review: this.form.end_time_settings.reviewer.general_excess_time,
        review_add: this.form.end_time_settings.reviewer.general_excess_add_time
      }
    ]
    this.emgTransTimeSettings = [{
      title: this.$t('company.last_time'),
      tc: this.form.end_time_settings.tc.emergency_trans_time,
      tc_add: this.form.end_time_settings.tc.emergency_add_time,
      trans: this.form.end_time_settings.translator.emergency_trans_time,
      trans_add: this.form.end_time_settings.translator.emergency_add_time,
      review: this.form.end_time_settings.reviewer.emergency_trans_time,
      review_add: this.form.end_time_settings.reviewer.emergency_add_time
    }]
    this.assignList = [
      {
        worker_type: this.$t('user_type.tc'),
        assign_type: this.form.assigns.tc.assign_type,
        tag_type: this.form.assigns.tc.tag_type,
        tags: this.form.assigns.tc.tags_name,
        numbers: this.form.assigns.tc.numbers
      },
      {
        worker_type: this.$t('user_type.translator'),
        assign_type: this.form.assigns.translator.assign_type,
        tag_type: this.form.assigns.translator.tag_type,
        tags: this.form.assigns.translator.tags_name,
        numbers: this.form.assigns.translator.numbers
      },
      {
        worker_type: this.$t('user_type.reviewer'),
        assign_type: this.form.assigns.reviewer.assign_type,
        tag_type: this.form.assigns.reviewer.tag_type,
        tags: this.form.assigns.reviewer.tags_name,
        numbers: this.form.assigns.reviewer.numbers
      }
    ]

    this.general_trans_list = [{
      title: this.$t('company.trans_48'),
      tc_gen_trans_time: this.form.end_time_settings.tc.general_trans_time,
      tc_gen_add_time: this.form.end_time_settings.tc.general_trans_add_time,
      tr_gen_trans_time: this.form.end_time_settings.translator.general_trans_time,
      tr_gen_add_time: this.form.end_time_settings.translator.general_trans_add_time,
      re_gen_trans_time: this.form.end_time_settings.reviewer.general_trans_time,
      re_gen_add_time: this.form.end_time_settings.reviewer.general_trans_add_time
    }]
    this.excess_trans_list = [{
      title: this.$t('company.over_trans'),
      tc_gen_excess_time: this.form.end_time_settings.tc.general_excess_time,
      tc_gen_excess_add_time: this.form.end_time_settings.tc.general_excess_add_time,
      tr_gen_excess_time: this.form.end_time_settings.translator.general_excess_time,
      tr_gen_excess_add_time: this.form.end_time_settings.translator.general_excess_add_time,
      re_gen_excess_time: this.form.end_time_settings.reviewer.general_excess_time,
      re_gen_excess_add_time: this.form.end_time_settings.reviewer.general_excess_add_time
    }]
    this.emergency_trans_list = [{
      title: this.$t('company.last_time'),
      tc_emg_trans_time: this.form.end_time_settings.tc.emergency_trans_time,
      tc_emg_add_time: this.form.end_time_settings.tc.emergency_add_time,
      tr_emg_trans_time: this.form.end_time_settings.translator.emergency_trans_time,
      tr_emg_add_time: this.form.end_time_settings.translator.emergency_add_time,
      re_emg_trans_time: this.form.end_time_settings.reviewer.emergency_trans_time,
      re_emg_add_time: this.form.end_time_settings.reviewer.emergency_add_time
    }]
  },
  methods: {
    /** change to modify status */
    onModify () {
      this.$router.push('/company/edit/' + this.$route.params.id)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.bottom-container {
  .trans-item-div {
    display: flex;
    & > div {
      margin-right: 15px;
    }
    .icon-caret-right {
      margin-left: 5px;
      margin-right: 5px;
      i {
        font-size: 1.5em;
        position: relative;
        vertical-align: middle;
      }
    }
  }
  .tag-group {
    .el-tag {
      margin-right: 5px;
    }
  }
  .trans-work-amount {
    .title-desc-fee {
      .el-input {
        display: block;
        padding-right: 30px;
      }
    }
    .pay-std-cur {
      .el-select {
        display: block;
        padding-right: 30px;
      }
    }
    .urg-trans-extra {
      .el-input {
        display: block;
        padding-right: 30px;
      }
    }
    .el-row {
      margin-bottom: 10px;
    }
    .trans-work-question label {
      margin-right: 10px;
    }
    .amount-batch-set {
      .el-col {
        padding-left: 20px;
      }
      label {
        display: block;
      }
    }
    .el-input, .el-select{
      width: 120px;
      input {
        height: 60px;
      }
    }
  }
  .time-limit-set {
    .el-input {
      width: 60px;
      input {
        height: 40px;
      }
    }
  }
  .last-time-setting {
    table td span, table td div {
      word-break: break-word;
    }
    .el-input{
      width: 50px !important;
      input {
        height: 30px;
      }
    }
  }
}
.avatar-container {
  .profile-avatar p, .company-logo p {
    font-size: 16px;
    font-weight: bold;
  }
}
::v-deep {
  .company-end-table th {
    background: #f5f7fa;
    text-align: center;
  }
  .trans-amount-body td {
    text-align: center;
  }
  .payment-request,
  .use-terms-agree,
  .worker-assign-set,
  .trans-lang-pair,
  .trans-work-amount,
  .time-limit-set {
    .el-form-item__label {
      line-height: $formLabelLineHeight !important;
      margin-top: $formLabelMgTop !important;
    }
  }
  .trans-work-amount {
    table div {
      word-break: break-word;
    }
  }
}
</style>
