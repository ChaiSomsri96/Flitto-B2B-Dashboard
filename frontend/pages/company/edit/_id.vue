<template>
  <div class="edit-container">
    <div class="page-title">
      {{ $t('company.detail') }}
    </div>
    <el-card v-loading="loading" class="box-card">
      <el-form ref="companyEditForm" :model="form" :rules="rules" label-width="150px" label-position="left">
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
                :placeholder="$t('placeholder.password')"
                :type="'password'"
                :icon-name="'lock-24'"
                @inputChanged="onPassChange"
              />
            </el-form-item>
            <el-form-item :label="$t('label.company_name')">
              <input-with-icon
                :input-value="form.company_name"
                :icon-name="'person-24'"
                @inputChanged="onCompanyNameChange"
              />
            </el-form-item>
            <el-form-item :label="$t('label.contact_name')">
              <input-with-icon
                :input-value="form.user_name"
                :icon-name="'person-24'"
                @inputChanged="onContactNameChange"
              />
            </el-form-item>
            <el-form-item :label="$t('label.phone')">
              <div class="country-phone">
                <el-select v-model="form.country_code" filterable :placeholder="$t('placeholder.country_code')">
                  <el-option
                    v-for="(item, i) in countryPhoneList"
                    :key="i"
                    :label="item.label"
                    :value="item.value"
                  >
                  </el-option>
                </el-select>
                <input-with-icon
                  :input-value="form.phone_number"
                  :placeholder="$t('placeholder.phone')"
                  :icon-name="'call-24'"
                  @inputChanged="onPhoneChange"
                />
              </div>
            </el-form-item>
            <el-form-item :label="$t('label.email')">
              <input-with-icon
                :type="'email'"
                :input-value="form.email"
                :icon-name="'mail-24'"
                :placeholder="$t('placeholder.email')"
                @inputChanged="onEmailChange"
              />
            </el-form-item>
            <el-form-item :label="$t('label.syslang')">
              <el-select v-model="form.system_lang" clearable :placeholder="$t('placeholder.syslang')">
                <el-option
                  v-for="item in sysLangList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :md="6" :lg="6" class="avatar-container">
            <image-upload-item :image-url="form.avatar" @avatarChanged="changeAvatarUrl" />
            <image-upload-item :company-logo="true" :image-url="form.company_logo" @avatarChanged="changeLogoUrl" />
          </el-col>
        </el-row>
        <el-row>
          <el-col :lg="24" class="bottom-container">
            <el-form-item :label="$t('company.support_service')">
              <div>
                <el-tag type="primary" effect="dark">
                  {{ mainService }}
                </el-tag>
                <div style="margin: 15px 0;"></div>
                <el-checkbox v-model="checkAll" :indeterminate="isIndeterminate" class="check-all" @change="handleCheckAllChange">
                  {{ $t('common.all') }}
                </el-checkbox>
                <el-checkbox-group v-model="checkedServices" @change="handleCheckedServicesChange">
                  <el-checkbox v-for="service in services" :key="service" :label="service">
                    {{ service }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </el-form-item>
            <el-form-item :label="$t('company.trans_lang_pair')" class="trans-lang-pair" required>
              <div class="trans-item-div">
                <el-tag type="primary" effect="dark" class="mr20">
                  {{ mainService }}
                </el-tag>
                <el-select v-model="selOrgLang" clearable :placeholder="$t('company.org_lang')">
                  <el-option
                    v-for="item in workLangs"
                    :key="item.id"
                    :label="$t('common.' + item.name)"
                    :value="item.id"
                  >
                  </el-option>
                </el-select>
                <div class="icon-caret-right">
                  <i class="el-icon-caret-right"></i>
                </div>
                <el-select v-model="selTransLang" clearable :placeholder="$t('company.trans_lang')">
                  <el-option
                    v-for="item in workLangs"
                    :key="item.id"
                    :label="$t('common.' + item.name)"
                    :value="item.id"
                  >
                  </el-option>
                </el-select>
                <el-button type="primary" class="add-lang-pair" @click="addLangPair">
                  {{ $t('company.add_lang_pair') }}
                </el-button>
              </div>
              <lang-tag-pair
                v-for="(item, i) in langPairs"
                :key="i"
                :orglang="item.orglang"
                :translang="item.translang"
                :index="i"
                @removeLangPair="langPairRemoved"
              >
              </lang-tag-pair>
            </el-form-item>
            <el-form-item :label="$t('company.trans_work_amount')" class="trans-work-amount" required>
              <el-row>
                <el-col :span="8" class="pay-std-cur">
                  <label>{{ $t('company.pay_std_cur') }}</label>
                  <el-select v-model="form.currency_type">
                    <el-option
                      v-for="item in currencyList"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    >
                    </el-option>
                  </el-select>
                </el-col>
                <el-col :span="8" class="title-desc-fee">
                  <label>{{ $t('company.title_desc_fee') + '(' + standardCurrency + ')' }}</label>
                  <el-input v-model="form.title_cost" type="number" :class="{ 'error': validTitleCost == true }" @blur="handleTitleCost"></el-input>
                </el-col>
                <el-col :span="8" class="urg-trans-extra">
                  <label>{{ $t('company.urg_trans_extra') + '(%)' }}</label>
                  <el-input v-model="form.premium_rate" type="number" :class="{ 'error': validPremiumRate == true }" @blur="handlePremiumRate"></el-input>
                </el-col>
              </el-row>
              <el-row class="trans-work-question">
                <label>{{ $t('company.trans_work_question') }}</label>
                <el-radio v-model="form.is_base_price_set" label="N">
                  {{ $t('common.no') }}
                </el-radio>
                <el-radio v-model="form.is_base_price_set" label="Y" @change="onBasePriceSettingChangeY">
                  {{ $t('common.yes') }}
                </el-radio>
              </el-row>
              <el-row>
                <div v-if="form.is_base_price_set == 'N'" class="amount-batch-set">
                  <label class="batch-set-label">{{ $t('company.amount_batch_set') }}</label>
                  <el-col :span="4" class="trans-amount" :class="$i18n.locale">
                    <label>{{ $t('company.trans_amount') + '(' + standardCurrency + ')' }}</label>
                    <el-input v-model="transAmount" :class="{ 'error': validTransAmount == true }" @blur="handleTransAmount"></el-input>
                  </el-col>
                  <el-col :span="4">
                    <label>{{ $t('company.review_amount') + '(' + standardCurrency + ')' }}</label>
                    <el-input v-model="reviewAmount" :class="{ 'error': validReviewAmount == true }" @blur="handleReviewAmount"></el-input>
                  </el-col>
                  <el-col :span="4" class="tc-work-amount" :class="$i18n.locale">
                    <label>{{ $t('company.work_amount') + '(TC)' }}</label>
                    <el-input v-model="tcWorkAmount" :class="{ 'error': validTcWorkAmount == true }" @blur="handleTcWorkAmount"></el-input>
                  </el-col>
                  <el-col :span="4">
                    <label>{{ $t('company.work_amount') + ' (' + $t('company.trans') + ')' }}</label>
                    <el-input v-model="transWorkAmount" :class="{ 'error': validTransWorkAmount == true }" @blur="handleTransWorkAmount"></el-input>
                  </el-col>
                  <el-col :span="4">
                    <label>{{ $t('company.work_amount') + ' (' + $t('company.review') + ')' }}</label>
                    <el-input v-model="reviewWorkAmount" :class="{ 'error': validReviewWorkAmount == true }" @blur="handleReviewWorkAmount"></el-input>
                  </el-col>
                </div>
                <div v-else class="set-per-pairs">
                  <div class="mb5">
                    <label>{{ $t('company.amount_pair_set') }}</label>
                    <el-tag
                      type="success"
                      effect="dark"
                      class="btn-std-amount"
                      @click="stdAmtDialog = true"
                    >
                      {{ $t('company.std_amount_set') }}
                    </el-tag>
                  </div>
                  <el-table
                    border
                    header-row-class-name="company-end-table"
                    :data="transworkAmountList"
                  >
                    <el-table-column :label="'From'" width="90" align="center">
                      <template slot-scope="scope">
                        <span>{{ scope.row.from }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="'To'" width="90" align="center">
                      <template slot-scope="scope">
                        <span>{{ scope.row.to }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.trans_amount')" align="center">
                      <template slot-scope="scope">
                        <div style="display: inline-flex; align-items: center">
                          {{ standardCurrency }}&nbsp;<el-input v-model="scope.row.work_price" type="number"></el-input>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.review_amount')" align="center">
                      <template slot-scope="scope">
                        <div style="display: inline-flex; align-items: center">
                          {{ standardCurrency }}&nbsp;<el-input v-model="scope.row.review_price" type="number"></el-input>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.work_amount') + '(TC)'" align="center">
                      <template slot-scope="scope">
                        <div style="display: inline-flex; align-items: center">
                          $&nbsp;<el-input v-model="scope.row.tc_price" type="number"></el-input>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.work_amount') + ' (' + $t('company.trans') + ')'" align="center">
                      <template slot-scope="scope">
                        <div style="display: inline-flex; align-items: center">
                          $&nbsp;<el-input v-model="scope.row.trans_price" type="number"></el-input>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('company.work_amount') + ' (' + $t('company.review') + ')'" align="center">
                      <template slot-scope="scope">
                        <div style="display: inline-flex; align-items: center">
                          $&nbsp;<el-input v-model="scope.row.test_price" type="number"></el-input>
                        </div>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-row>
            </el-form-item>
            <el-form-item :label="$t('company.time_limit_set')" class="time-limit-set" required>
              <el-row>
                <label>
                  {{ "-" + $t('company.normal_trans') }}
                </label>
                <div>
                  {{ $t('company.general_screen_limit') }}
                  <el-input
                    v-model="form.general_screen_limit"
                    type="number"
                    :class="{ 'error': validGeneralScreenLimit == true }"
                    @blur="handleGeneralScreenLimit"
                  >
                  </el-input>
                  &nbsp;{{ $t('company.min_or_less') }}, {{ $t('company.general_end_time') }}
                  <el-input
                    v-model="form.general_end_time"
                    type="number"
                    :class="{ 'error': validGeneralEndTime == true }"
                    @blur="handleGeneralEndTime"
                  ></el-input>
                  &nbsp;{{ $t('company.general_end_time_suffix') }}
                </div>
              </el-row>
              <el-row>
                <label>
                  {{ "-" + $t('company.urgent_trans') }}
                </label>
                <div>
                  {{ $t('company.emergency_screen_limit') }}
                  <el-input
                    v-model="form.emergency_screen_limit"
                    type="number"
                    :class="{ 'error': validEmergencyScreenLimit == true }"
                    @blur="handelEmergencyScreenLimit"
                  ></el-input>
                  {{ $t('company.min_or_less') }}, {{ $t('company.emg_exceed_impossible') }}
                </div>
              </el-row>
              <el-row>
                <label>
                  {{ "-" + $t('company.free_trans') }}
                </label>
                <div>
                  {{ $t('company.free_screen_limit') }}
                  <el-input
                    v-model="form.free_screen_limit"
                    type="number"
                    :class="{ 'error': validFreeScreenLimit == true }"
                    @blur="handleFreeScreenLimit"
                  ></el-input>
                  {{ $t('company.free_screen_limit_prefix') }}
                </div>
              </el-row>
            </el-form-item>
            <el-form-item :label="$t('company.worker_assign_set')" class="worker-assign-set" required>
              <worker-assign-item
                :worker-type="'tc'"
                :default-assign-option="tc_assign_type"
                :tag-options="tagOptions"
                :default-tag-options="tcTags"
                :assign-numbers="tc_numbers"
                @assignTypeChanged="assignTypeChange"
                @tagOptionChanged="tagsChanged"
              />
              <worker-assign-item
                :worker-type="'translator'"
                :default-assign-option="translator_assign_type"
                :tag-options="tagOptions"
                :default-tag-options="trTags"
                :assign-numbers="translator_numbers"
                @assignTypeChanged="assignTypeChange"
                @tagOptionChanged="tagsChanged"
              />
              <worker-assign-item
                :worker-type="'reviewer'"
                :default-assign-option="reviewer_assign_type"
                :tag-options="tagOptions"
                :default-tag-options="reTags"
                :assign-numbers="reviewer_numbers"
                @assignTypeChanged="assignTypeChange"
                @tagOptionChanged="tagsChanged"
              />
            </el-form-item>
            <el-form-item :label="$t('company.worker_endtime_set')" class="last-time-setting" required>
              <el-row>
                <label>{{ "-  " + $t('company.normal_trans_48') }}</label>
              </el-row>
              <el-row>
                <el-table border header-row-class-name="company-end-table" :data="general_trans_list">
                  <el-table-column width="120">
                    <template slot-scope="scope">
                      <span>{{ scope.row.title }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('company.tc')">
                    <template slot-scope="scope">
                      <div>
                        {{ $t('caption.scene_length') }} *
                        <el-input
                          v-model="scope.row.tc_gen_trans_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[0] == true }"
                          @blur="handleLastTimeSetting($event, 0, 'tc_gen_trans_time')"
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.tc_gen_add_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[1] == true }"
                          @blur="handleLastTimeSetting($event, 1, 'tc_gen_add_time')"
                        ></el-input>
                        {{ $t('caption.min') }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('company.trans')">
                    <template slot-scope="scope">
                      <div>
                        {{ $t('caption.scene_length') }} *
                        <el-input
                          v-model="scope.row.tr_gen_trans_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[2] == true }"
                          @blur="handleLastTimeSetting($event, 2, 'tr_gen_trans_time')"
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.tr_gen_add_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[3] == true }"
                          @blur="handleLastTimeSetting($event, 3, 'tr_gen_add_time')"
                        ></el-input>
                        {{ $t('caption.min') }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('company.review')">
                    <template slot-scope="scope">
                      <div>
                        {{ $t('caption.scene_length') }} *
                        <el-input
                          v-model="scope.row.re_gen_trans_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[4] == true }"
                          @blur="handleLastTimeSetting($event, 4, 're_gen_trans_time')"
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.re_gen_add_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[5] == true }"
                          @blur="handleLastTimeSetting($event, 5, 're_gen_add_time')"
                        ></el-input>
                        {{ $t('caption.min') }}
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
                <el-table border header-row-class-name="company-end-table" :data="excess_trans_list" :show-header="false">
                  <el-table-column width="120">
                    <template slot-scope="scope">
                      <span>{{ scope.row.title }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('company.tc')">
                    <template slot-scope="scope">
                      <div>
                        {{ $t('caption.scene_length') }} *
                        <el-input
                          v-model="scope.row.tc_gen_excess_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[6] == true }"
                          @blur="handleLastTimeSetting($event, 6, 'tc_gen_excess_time')"
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.tc_gen_excess_add_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[7] == true }"
                          @blur="handleLastTimeSetting($event, 7, 'tc_gen_excess_add_time')"
                        ></el-input>
                        {{ $t('caption.min') }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('company.trans')">
                    <template slot-scope="scope">
                      <div>
                        {{ $t('caption.scene_length') }} *
                        <el-input
                          v-model="scope.row.tr_gen_excess_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[8] == true }"
                          @blur="handleLastTimeSetting($event, 8, 'tr_gen_excess_time')"
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.tr_gen_excess_add_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[9] == true }"
                          @blur="handleLastTimeSetting($event, 9, 'tr_gen_excess_add_time')"
                        ></el-input>
                        {{ $t('caption.min') }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('company.review')">
                    <template slot-scope="scope">
                      <div>
                        {{ $t('caption.scene_length') }} *
                        <el-input
                          v-model="scope.row.re_gen_excess_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[10] == true }"
                          @blur="handleLastTimeSetting($event, 10, 're_gen_excess_time')"
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.re_gen_excess_add_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[11] == true }"
                          @blur="handleLastTimeSetting($event, 11, 're_gen_excess_add_time')"
                        ></el-input>
                        {{ $t('caption.min') }}
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </el-row>
              <el-row>
                <label>{{ "-  " + $t('company.urg_trans_24') }}</label>
              </el-row>
              <el-row>
                <el-table border header-row-class-name="company-end-table" :data="emergency_trans_list">
                  <el-table-column width="120">
                    <template slot-scope="scope">
                      <span>{{ scope.row.title }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('company.tc')">
                    <template slot-scope="scope">
                      <div>
                        {{ $t('caption.scene_length') }} *
                        <el-input
                          v-model="scope.row.tc_emg_trans_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[12] == true }"
                          @blur="handleLastTimeSetting($event, 12, 'tc_emg_trans_time')"
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.tc_emg_add_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[13] == true }"
                          @blur="handleLastTimeSetting($event, 13, 'tc_emg_add_time')"
                        ></el-input>
                        {{ $t('caption.min') }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('company.trans')">
                    <template slot-scope="scope">
                      <div>
                        {{ $t('caption.scene_length') }} *
                        <el-input
                          v-model="scope.row.tr_emg_trans_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[14] == true }"
                          @blur="handleLastTimeSetting($event, 14, 'tr_emg_trans_time')"
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.tr_emg_add_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[15] == true }"
                          @blur="handleLastTimeSetting($event, 15, 'tr_emg_add_time')"
                        ></el-input>
                        {{ $t('caption.min') }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('company.review')">
                    <template slot-scope="scope">
                      <div>
                        {{ $t('caption.scene_length') }} *
                        <el-input
                          v-model="scope.row.re_emg_trans_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[16] == true }"
                          @blur="handleLastTimeSetting($event, 16, 're_emg_trans_time')"
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.re_emg_add_time"
                          type="number"
                          :class="{ 'error': validLastTimeSetting[17] == true }"
                          @blur="handleLastTimeSetting($event, 17, 're_emg_add_time')"
                        ></el-input>
                        {{ $t('caption.min') }}
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </el-row>
            </el-form-item>
            <el-form-item :label="$t('company.req_pay_flag')" class="payment-request">
              <div class="auto-notify-setting" style="width: calc(50% - 5px);">
                <custom-check-box
                  :is-checked="form.payment_check === 'Y' ? true : false"
                  :label="$t('company.require_card_pay')"
                  :border="true"
                  @checkChanged="payCheckChange"
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
                  :disabled="smsDisabled"
                  @checkChanged="smsCheckChange"
                >
                </custom-check-box>
                <custom-check-box
                  :is-checked="form.email_notice_check === 'Y' ? true : false"
                  :label="$t('common.email_notify')"
                  :border="true"
                  @checkChanged="emailCheckChange"
                >
                </custom-check-box>
              </div>
            </el-form-item>
            <el-form-item :label="$t('label.use_terms')" class="use-terms-agree">
              <custom-check-box
                :is-checked="form.use_terms === 'Y' ? true : false"
                :label="$t('company.use_terms_agree')"
                :border="true"
                @checkChanged="onUseTermsChange"
              >
              </custom-check-box>
            </el-form-item>
            <el-form-item :label="$t('label.admin_memo')">
              <el-input
                v-model="form.memo"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 4}"
                maxlength="300"
              >
              </el-input>
            </el-form-item>
            <el-form-item label-width="0px">
              <el-button type="primary" class="btn-save" :disabled="loading" @click="onSubmit('companyEditForm')">
                <span>{{ $t('common.save') }}</span>
                <i class="el-icon-right"></i>
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
    <el-dialog
      :title="$t('company.std_amount_set')"
      :visible.sync="stdAmtDialog"
      width="80%"
      @open="initStdAmtDialog"
    >
      <el-row class="std-amount-dialog">
        <el-col :span="4">
          <label>{{ $t('company.std_trans_amount') }}</label><br />
          <el-input v-model="stdTransAmount"></el-input>
        </el-col>
        <el-col :span="4">
          <label>{{ $t('company.std_review_amount') }}</label><br />
          <el-input v-model="stdReviewAmount"></el-input>
        </el-col>
        <el-col :span="5">
          <label>{{ $t('company.std_tc_work_amount') }}</label><br />
          <el-input v-model="stdTcWorkAmount"></el-input>
        </el-col>
        <el-col :span="5">
          <label>{{ $t('company.std_tr_work_amount') }}</label><br />
          <el-input v-model="stdTrWorkAmount"></el-input>
        </el-col>
        <el-col :span="5">
          <label>{{ $t('company.std_re_work_amount') }}</label><br />
          <el-input v-model="stdReWorkAmount"></el-input>
        </el-col>
      </el-row>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="apply()">{{ $t('common.apply') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import global from '@/mixin/global'
import InputWithIcon from '@/components/common/InputWithIcon.vue'
import CustomCheckBox from '@/components/common/CustomCheckBox.vue'
import LangTagPair from '@/components/common/LangTagPair'
import ImageUploadItem from '@/components/common/ImageUploadItem.vue'
import WorkerAssignItem from '@/components/common/WorkerAssignItem.vue'

export default {
  // middleware: ['auth', 'auth-admin'],
  middleware: ['auth', 'stats'],
  layout: 'detail',
  components: {
    InputWithIcon,
    CustomCheckBox,
    LangTagPair,
    ImageUploadItem,
    WorkerAssignItem
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
    const validatePhone = (rule, value, callback) => {
      if (value !== '' && !this.phoneRegEx.test(value)) {
        callback(new Error(this.$t('validation.invalid_phone_num')))
      } else {
        callback()
      }
    }
    return {
      mainService: this.$t('company.caption_trans'),
      supportServices: [
        this.$t('company.trans_work'),
        this.$t('company.tc_work'),
        this.$t('company.review_work'),
        this.$t('company.title_desc_trans'),
        this.$t('company.youtube_auto_apply')
      ],
      loading: false,
      stdAmtDialog: false,
      stdTransAmount: '',
      stdReviewAmount: '',
      stdTcWorkAmount: '',
      stdTrWorkAmount: '',
      stdReWorkAmount: '',
      file: null,
      logo: null,
      assignList: [],
      assignTypes: {
        1: this.$t('company.push_notification'),
        2: this.$t('company.manual_assign')
      },
      /** variables for editition */
      checkAll: false,
      isIndeterminate: true,
      checkedServices: [],
      services: [],
      selOrgLang: '',
      selTransLang: '',
      langPairs: [],
      orglang: [], // for lang pairs
      translang: [], // for lang pairs
      transAmount: '',
      reviewAmount: '',
      tcWorkAmount: '',
      transWorkAmount: '',
      reviewWorkAmount: '',
      transworkAmountList: [],
      tcTags: [],
      trTags: [],
      reTags: [],
      tc_assign_type: 1,
      translator_assign_type: 1,
      reviewer_assign_type: 1,
      tc_numbers: 0,
      translator_numbers: 0,
      reviewer_numbers: 0,
      general_trans_list: [],
      excess_trans_list: [],
      emergency_trans_list: [],
      rules: {
        company_name: [
          { required: true, message: this.$t('validation.company_name_required'), trigger: 'blur' }
        ],
        phone_number: [
          { validator: validatePhone, trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: this.$t('validation.invalid_email'), trigger: 'blur' }
        ],
        system_lang: [
          { required: true, message: this.$t('validation.syslang_required'), trigger: 'change' }
        ]
      },
      validTitleCost: false,
      validPremiumRate: false,

      validTransAmount: false,
      validReviewAmount: false,
      validTcWorkAmount: false,
      validTransWorkAmount: false,
      validReviewWorkAmount: false,

      validGeneralScreenLimit: false,
      validEmergencyScreenLimit: false,
      validFreeScreenLimit: false,
      validGeneralEndTime: false,
      validLastTimeSetting: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      lastTimeKey: [
        'tc_gen_trans_time',
        'tc_gen_add_time',
        'tr_gen_trans_time',
        'tr_gen_add_time',
        're_gen_trans_time',
        're_gen_add_time',
        'tc_gen_excess_time',
        'tc_gen_excess_add_time',
        'tr_gen_excess_time',
        'tr_gen_excess_add_time',
        're_gen_excess_time',
        're_gen_excess_add_time',
        'tc_emg_trans_time',
        'tc_emg_add_time',
        'tr_emg_trans_time',
        'tr_emg_add_time',
        're_emg_trans_time',
        're_emg_add_time'
      ],
      is_last_time_required: false
    }
  },
  computed: {
    standardCurrency () {
      return this.currencyList.filter(
        item => item.value === this.form.currency_type
      )[0].label
    }
  },
  mounted () {
    this.services = this.supportServices.slice(1)
    this.setCheckedServices()
    this.setLangPairs()
    this.setTransWorkAmount()
    this.tc_assign_type = this.form.assigns.tc.assign_type
    this.translator_assign_type = this.form.assigns.translator.assign_type
    this.reviewer_assign_type = this.form.assigns.reviewer.assign_type
    if (this.form.assigns.tc.assign_type === 1) {
      if (this.form.assigns.tc.tag_type === 1) {
        this.tcTags = this.form.assigns.tc.tags_id
        this.trTags = this.form.assigns.translator.tags_id
        this.reTags = this.form.assigns.reviewer.tags_id
      }
      this.tc_numbers = this.form.assigns.tc.numbers
      this.translator_numbers = this.form.assigns.translator.numbers
      this.reviewer_numbers = this.form.assigns.reviewer.numbers
    }
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
    initStdAmtDialog () {
      this.stdTransAmount = ''
      this.stdReviewAmount = ''
      this.stdTcWorkAmount = ''
      this.stdTrWorkAmount = ''
      this.stdReWorkAmount = ''
    },
    onBasePriceSettingChangeY () {
      this.validTransAmount = false
      this.validReviewAmount = false
      this.validTcWorkAmount = false
      this.validTransWorkAmount = false
      this.validReviewWorkAmount = false
    },
    apply () {
      if (this.langPairs.length === 0) {
        this.$message({
          message: this.$t('validation.not_exist_lang_pairs'),
          type: 'error'
        })
      } else if (
        this.stdTransAmount === '' ||
        this.stdTransAmount === '' ||
        this.stdTransAmount === '' ||
        this.stdTransAmount === '' ||
        this.stdTransAmount === '') {
        this.$message({
          message: this.$t('validation.std_amount_all_required'),
          type: 'error'
        })
      } else {
        this.transworkAmountList = []
        for (let i = 0; i < this.langPairs.length; i++) {
          this.transworkAmountList.push({
            from: this.langPairs[i].orglang,
            to: this.langPairs[i].translang,
            work_price: this.stdTransAmount,
            review_price: this.stdReviewAmount,
            tc_price: this.stdTcWorkAmount,
            trans_price: this.stdTrWorkAmount,
            test_price: this.stdReWorkAmount
          })
        }
        this.stdAmtDialog = false
      }
    },
    setLangPairs () {
      for (let i = 0; i < this.form.working_languages.length; i++) {
        this.orglang.push(this.form.working_languages[i].original.id)
        this.translang.push(this.form.working_languages[i].translate.id)
        this.langPairs.push({
          orglang: this.$t('common.' + this.form.working_languages[i].original.name),
          translang: this.$t('common.' + this.form.working_languages[i].translate.name)
        })
      }
    },
    setTransWorkAmount () {
      if (this.form.prices && this.form.prices.length > 0) {
        if (this.form.is_base_price_set === 'N') {
          this.transAmount = this.form.prices[0].work_price
          this.reviewAmount = this.form.prices[0].native_review_price
          this.tcWorkAmount = this.form.prices[0].tc_price
          this.transWorkAmount = this.form.prices[0].trans_price
          this.reviewWorkAmount = this.form.prices[0].test_price
        } else {
          for (let i = 0; i < this.form.prices.length; i++) {
            this.transworkAmountList.push({
              from: this.form.prices[i].original.name,
              to: this.form.prices[i].translate.name,
              work_price: this.form.prices[i].work_price,
              review_price: this.form.prices[i].native_review_price,
              tc_price: this.form.prices[i].tc_price,
              trans_price: this.form.prices[i].trans_price,
              test_price: this.form.prices[i].test_price
            })
          }
        }
      }
    },
    setCheckedServices () {
      for (let i = 0; i < this.form.services.length; i++) {
        this.checkedServices.push(this.supportServices[this.form.services[i]])
      }
    },
    changeAvatarUrl (file) {
      this.file = file
    },
    changeLogoUrl (logo) {
      this.logo = logo
    },
    onPassChange (pwd) {
      this.form.user_pwd = pwd
    },
    onCompanyNameChange (companyName) {
      this.form.company_name = companyName
    },
    onContactNameChange (contactName) {
      this.form.user_name = contactName
    },
    onPhoneChange (phone) {
      this.form.phone_number = phone
    },
    onEmailChange (email) {
      this.form.email = email
    },
    payCheckChange (payCheck) {
      if (payCheck) {
        this.form.payment_check = 'Y'
      } else {
        this.form.payment_check = 'N'
      }
    },
    smsCheckChange (smsNotify) {
      if (smsNotify) {
        this.form.sms_notice_check = 'Y'
      } else {
        this.form.sms_notice_check = 'N'
      }
    },
    emailCheckChange (emailNotify) {
      if (emailNotify) {
        this.form.email_notice_check = 'Y'
      } else {
        this.form.email_notice_check = 'N'
      }
    },
    onUseTermsChange (useTerms) {
      if (useTerms) {
        this.form.use_terms = 'Y'
      } else {
        this.form.use_terms = 'N'
      }
    },
    /** modify status: support services */
    handleCheckAllChange (val) {
      this.checkedServices = val ? this.supportServices.slice(1) : []
      this.isIndeterminate = false
    },
    handleCheckedServicesChange (value) {
      const checkedCount = value.length
      this.checkAll = checkedCount === this.services.length
      this.isIndeterminate = checkedCount > 0 && checkedCount < this.services.length
    },
    addLangPair () {
      if (this.selOrgLang === '' || this.selTransLang === '') {
        this.$message({
          message: this.$t('validation.lang_pair_required'),
          type: 'error'
        })
      } else if (this.selOrgLang === this.selTransLang) {
        this.$message({
          message: this.$t('validation.diff_lang_pair'),
          type: 'error'
        })
      } else {
        this.orglang.push(this.selOrgLang)
        this.translang.push(this.selTransLang)
        this.langPairs.push({ orglang: this.getLangName(this.selOrgLang), translang: this.getLangName(this.selTransLang) })

        this.transworkAmountList.push({
          from: this.getLangName(this.selOrgLang),
          to: this.getLangName(this.selTransLang),
          work_price: '',
          review_price: '',
          tc_price: '',
          trans_price: '',
          test_price: ''
        })

        this.selOrgLang = ''
        this.selTransLang = ''
      }
    },
    langPairRemoved (index) {
      this.langPairs.splice(index, 1)
      this.transworkAmountList.splice(index, 1)
      this.orglang.splice(index, 1)
      this.translang.splice(index, 1)
    },
    assignTypeChange (data) {
      const { workerType, assignOption } = data
      if (workerType === 'tc') {
        this.tc_assign_type = assignOption
      } else if (workerType === 'translator') {
        this.translator_assign_type = assignOption
      } else {
        this.reviewer_assign_type = assignOption
      }
    },
    async tagsChanged (data) {
      const { workerType, selOptions } = data
      let selTags = -1
      if (selOptions.length === 0) {
        selTags = -1
      } else {
        selTags = selOptions
      }
      const resp = await this.$axios.post('/basic/get-worker-count-by-tags', {
        worker_type: workerType,
        tags: selTags
      })
      const numbers = resp.data.data
      if (workerType === 'tc') {
        this.tcTags = selOptions
        this.tc_numbers = numbers
      } else if (workerType === 'translator') {
        this.trTags = selOptions
        this.translator_numbers = numbers
      } else {
        this.reTags = selOptions
        this.reviewer_numbers = numbers
      }
    },
    /** validation */
    validTitleCostFunc () {
      if (this.form.title_cost === '') {
        this.validTitleCost = true
      } else {
        this.validTitleCost = false
      }
    },
    validPremiumRateFunc () {
      if (this.form.premium_rate === '') {
        this.validPremiumRate = true
      } else {
        this.validPremiumRate = false
      }
    },
    validTransAmountFunc () {
      if (this.transAmount === '') {
        this.validTransAmount = true
      } else {
        this.validTransAmount = false
      }
    },
    validReviewAmountFunc () {
      if (this.reviewAmount === '') {
        this.validReviewAmount = true
      } else {
        this.validReviewAmount = false
      }
    },
    validTcWorkAmountFunc () {
      if (this.tcWorkAmount === '') {
        this.validTcWorkAmount = true
      } else {
        this.validTcWorkAmount = false
      }
    },
    validTransWorkAmountFunc () {
      if (this.transWorkAmount === '') {
        this.validTransWorkAmount = true
      } else {
        this.validTransWorkAmount = false
      }
    },
    validReviewWorkAmountFunc () {
      if (this.reviewWorkAmount === '') {
        this.validReviewWorkAmount = true
      } else {
        this.validReviewWorkAmount = false
      }
    },
    validGeneralScreenLimitFunc () {
      if (this.form.general_screen_limit === '') {
        this.validGeneralScreenLimit = true
      } else {
        this.validGeneralScreenLimit = false
      }
    },
    validGeneralEndTimeFunc () {
      if (this.form.general_end_time === '') {
        this.validGeneralEndTime = true
      } else {
        this.validGeneralEndTime = false
      }
    },
    validEmergencyScreenLimitFunc () {
      if (this.form.emergency_screen_limit === '') {
        this.validEmergencyScreenLimit = true
      } else {
        this.validEmergencyScreenLimit = false
      }
    },
    validFreeScreenLimitFunc () {
      if (this.form.free_screen_limit === '') {
        this.validFreeScreenLimit = true
      } else {
        this.validFreeScreenLimit = false
      }
    },
    validLastTimeSettingFunc (index, key) {
      if (index < 6) {
        if (this.general_trans_list[0][key] === '') {
          this.validLastTimeSetting[index] = true
        } else {
          this.validLastTimeSetting[index] = false
        }
      } else if (index >= 6 && index < 12) {
        if (this.excess_trans_list[0][key] === '') {
          this.validLastTimeSetting[index] = true
        } else {
          this.validLastTimeSetting[index] = false
        }
      } else if (index >= 12 && index < 18) {
        if (this.emergency_trans_list[0][key] === '') {
          this.validLastTimeSetting[index] = true
        } else {
          this.validLastTimeSetting[index] = false
        }
      }
      this.validLastTimeSetting = this.validLastTimeSetting.map(item => item)
    },
    handleTitleCost (e) {
      this.validTitleCostFunc()
    },
    handlePremiumRate (e) {
      this.validPremiumRateFunc()
    },

    handleTransAmount (e) {
      this.validTransAmountFunc()
    },
    handleReviewAmount (e) {
      this.validReviewAmountFunc()
    },
    handleTcWorkAmount (e) {
      this.validTcWorkAmountFunc()
    },
    handleTransWorkAmount (e) {
      this.validTransWorkAmountFunc()
    },
    handleReviewWorkAmount (e) {
      this.validReviewWorkAmountFunc()
    },

    handleGeneralScreenLimit (e) {
      this.validGeneralScreenLimitFunc()
    },
    handleGeneralEndTime (e) {
      this.validGeneralEndTimeFunc()
    },
    handelEmergencyScreenLimit (e) {
      this.validEmergencyScreenLimitFunc()
    },
    handleFreeScreenLimit (e) {
      this.validFreeScreenLimitFunc()
    },
    handleLastTimeSetting (e, index, key) {
      this.validLastTimeSettingFunc(index, key)
    },
    onSubmit (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          if (this.langPairs.length === 0) {
            this.$notify({
              title: this.$t('common.fail'),
              message: this.$t('validation.lang_pair_required'),
              type: 'error'
            })
            return false
          }
          this.validTitleCostFunc()
          this.validPremiumRateFunc()

          if (this.form.is_base_price_set === 'N') {
            this.validTransAmountFunc()
            this.validReviewAmountFunc()
            this.validTcWorkAmountFunc()
            this.validTransWorkAmountFunc()
            this.validReviewWorkAmountFunc()
          }

          this.validGeneralScreenLimitFunc()
          this.validGeneralEndTimeFunc()
          this.validEmergencyScreenLimitFunc()
          this.validFreeScreenLimitFunc()
          for (let i = 0; i < 18; i++) {
            this.validLastTimeSettingFunc(i, this.lastTimeKey[i])
          }
          this.is_last_time_required = false
          for (let i = 0; i < 18; i++) {
            if (this.validLastTimeSetting[i]) {
              this.is_last_time_required = true
              break
            }
          }
          if (!this.validTitleCost && !this.validPremiumRate && !this.validTransAmount &&
           !this.validReviewAmount && !this.validTcWorkAmount && !this.validTransWorkAmount &&
           !this.validReviewWorkAmount && !this.validGeneralScreenLimit && !this.validGeneralEndTime &&
           !this.validEmergencyScreenLimit && !this.validFreeScreenLimit && !this.is_last_time_required) {
            if (this.form.is_base_price_set === 'Y') {
              for (let i = 0; i < this.langPairs.length; i++) {
                if (!this.transworkAmountList[i].work_price || !this.transworkAmountList[i].review_price ||
                !this.transworkAmountList[i].tc_price || !this.transworkAmountList[i].trans_price || !this.transworkAmountList[i].test_price) {
                  this.$notify({
                    title: this.$t('common.fail'),
                    message: this.$t('validation.price_required'),
                    type: 'error'
                  })
                  return false
                }
              }
            }

            const formData = new FormData()
            if (this.file != null) {
              formData.append('file', this.file)
            }
            if (this.logo != null) {
              formData.append('logo', this.logo)
            }
            const exclusionKeys = ['assigns', 'services', 'prices', 'avatar', 'company_logo', 'end_time_settings', 'working_languages', 'payment_check']
            for (const key in this.form) {
              if (exclusionKeys.includes(key)) {
                continue
              }
              formData.append(key, this.form[key])
            }
            formData.append('card_payment_check', this.form.payment_check)
            formData.append('tc_assign_type', this.tc_assign_type)
            formData.append('translator_assign_type', this.translator_assign_type)
            formData.append('reviewer_assign_type', this.reviewer_assign_type)

            for (let i = 0; i < this.orglang.length; i++) {
              formData.append('original_languages[]', this.orglang[i])
            }
            for (let i = 0; i < this.translang.length; i++) {
              formData.append('translate_languages[]', this.translang[i])
            }
            for (let i = 0; i < this.checkedServices.length; i++) {
              formData.append('services[]', this.supportServices.indexOf(this.checkedServices[i]))
            }
            // tag_type가 2인 경우는 전체 선택
            if (this.tc_assign_type === 1) {
              if (this.tcTags.length > 0) {
                for (let i = 0; i < this.tcTags.length; i++) {
                  formData.append('tc_tags[]', this.tcTags[i])
                }
              } else {
                formData.append('tc_tags', -1)
              }
              formData.append('tc_numbers', this.tc_numbers)
            }
            if (this.translator_assign_type === 1) {
              if (this.trTags.length > 0) {
                for (let i = 0; i < this.trTags.length; i++) {
                  formData.append('translator_tags[]', this.trTags[i])
                }
              } else {
                formData.append('translator_tags', -1)
              }
              formData.append('translator_numbers', this.translator_numbers)
            }
            if (this.reviewer_assign_type === 1) {
              if (this.reTags.length > 0) {
                for (let i = 0; i < this.reTags.length; i++) {
                  formData.append('reviewer_tags[]', this.reTags[i])
                }
              } else {
                formData.append('reviewer_tags', -1)
              }
              formData.append('reviewer_numbers', this.reviewer_numbers)
            }
            if (this.langPairs.length > 0) {
              if (this.form.is_base_price_set === 'N') {
                for (let i = 0; i < this.langPairs.length; i++) {
                  formData.append('work_price[]', this.transAmount)
                  formData.append('native_review_price[]', this.reviewAmount)
                  formData.append('tc_price[]', this.tcWorkAmount)
                  formData.append('trans_price[]', this.transWorkAmount)
                  formData.append('test_price[]', this.reviewWorkAmount)
                }
              } else {
                for (let i = 0; i < this.langPairs.length; i++) {
                  formData.append('work_price[]', this.transworkAmountList[i].work_price)
                  formData.append('native_review_price[]', this.transworkAmountList[i].review_price)
                  formData.append('tc_price[]', this.transworkAmountList[i].tc_price)
                  formData.append('trans_price[]', this.transworkAmountList[i].trans_price)
                  formData.append('test_price[]', this.transworkAmountList[i].test_price)
                }
              }
            }
            formData.append('general_trans_time[]', this.general_trans_list[0].tc_gen_trans_time)
            formData.append('general_trans_time[]', this.general_trans_list[0].tr_gen_trans_time)
            formData.append('general_trans_time[]', this.general_trans_list[0].re_gen_trans_time)

            formData.append('general_trans_add_time[]', this.general_trans_list[0].tc_gen_add_time)
            formData.append('general_trans_add_time[]', this.general_trans_list[0].tr_gen_add_time)
            formData.append('general_trans_add_time[]', this.general_trans_list[0].re_gen_add_time)

            formData.append('general_excess_time[]', this.excess_trans_list[0].tc_gen_excess_time)
            formData.append('general_excess_time[]', this.excess_trans_list[0].tr_gen_excess_time)
            formData.append('general_excess_time[]', this.excess_trans_list[0].re_gen_excess_time)

            formData.append('general_excess_add_time[]', this.excess_trans_list[0].tc_gen_excess_add_time)
            formData.append('general_excess_add_time[]', this.excess_trans_list[0].tr_gen_excess_add_time)
            formData.append('general_excess_add_time[]', this.excess_trans_list[0].re_gen_excess_add_time)

            formData.append('emergency_trans_time[]', this.emergency_trans_list[0].tc_emg_trans_time)
            formData.append('emergency_trans_time[]', this.emergency_trans_list[0].tr_emg_trans_time)
            formData.append('emergency_trans_time[]', this.emergency_trans_list[0].re_emg_trans_time)

            formData.append('emergency_add_time[]', this.emergency_trans_list[0].tc_emg_add_time)
            formData.append('emergency_add_time[]', this.emergency_trans_list[0].tr_emg_add_time)
            formData.append('emergency_add_time[]', this.emergency_trans_list[0].re_emg_add_time)
            this.loading = true
            this.$axios.post('/company/register-company', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }).then((resp) => {
              const { errorCode } = resp.data
              this.loading = false
              if (errorCode === 0) {
                this.$notify({
                  title: this.$t('common.success'),
                  message: this.$t('common.register_success'),
                  type: 'success'
                })
                this.$router.push('/company/detail/' + this.form.id)
              } else if (errorCode === 400) {
                this.$notify({
                  title: this.$t('common.fail'),
                  message: this.$t('common.invalid_param'),
                  type: 'error'
                })
              }
            })
          } else {
            this.$notify({
              title: this.$t('common.fail'),
              message: this.$t('validation.fill_required_fields'),
              type: 'error'
            })
            return false
          }
        } else {
          this.validTitleCostFunc()
          this.validPremiumRateFunc()

          this.validTransAmountFunc()
          this.validReviewAmountFunc()
          this.validTcWorkAmountFunc()
          this.validTransWorkAmountFunc()
          this.validReviewWorkAmountFunc()

          this.validGeneralScreenLimitFunc()
          this.validGeneralEndTimeFunc()
          this.validEmergencyScreenLimitFunc()
          this.validFreeScreenLimitFunc()
          for (let i = 0; i < 18; i++) {
            this.validLastTimeSettingFunc(i, this.lastTimeKey[i])
          }
          return false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.left-container {
  .el-tag {
    margin-right: 10px;
  }
}

.bottom-container {
  .check-all {
    float: left;
    margin-right: 30px;
  }
  .add-lang-pair {
    margin-left: 10px;
    background-color: $blue50;
    border-radius: $formControlBorderRadius;
  }
  .trans-item-div {
    display: flex;
    .not-editable-div {
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
        // padding-right: 30px;
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
        // padding-right: 30px;
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
        padding-left: 10px;
      }
      label {
        display: block;
      }
      .tc-work-amount.en, .trans-amount.en {
        line-height: 40px;
      }
    }
    .el-input, .el-select {
      width: 80px;
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
    .el-input {
      width: 50px !important;
      input {
        height: 30px;
      }
    }
  }
}
.el-dialog {
  .el-col {
    text-align: center;
    .el-input {
      margin-top: 10px;
      width: 50%;
    }
  }
}
.std-amount-dialog {
  label {
    word-break: break-word;
  }
}
::v-deep {
  .set-per-pairs {
    .btn-std-amount {
      cursor: pointer;
    }
    table th div {
      word-break: break-word;
      font-size: 12px !important;
    }
    table td div {
      font-size: 12px !important;
    }
  }
  .payment-request,
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
    .el-form-item__content {
      line-height: 20px !important;
    }
    .pay-std-cur {
      label {
        max-width: 160px;
        display: inline-block;
      }
      .el-select {
        min-width: 90px;
      }
    }
  }
  .company-end-table th {
    background: #f5f7fa;
    text-align: center;
  }
  .trans-amount-body td {
    text-align: center;
  }
  .error input{
    border-width: 1px;
    border-color: #F56C6C;
  }
}
</style>
