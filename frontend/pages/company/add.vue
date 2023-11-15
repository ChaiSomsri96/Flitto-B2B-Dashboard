<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('company.add') }}
    </div>
    <el-card v-loading="loading" class="form-container box-card">
      <el-form
        ref="companyForm"
        :model="form"
        :rules="rules"
        label-width="170px"
        label-position="left"
      >
        <el-row>
          <el-col :lg="18" class="left-container">
            <el-form-item :label="$t('label.account_type')">
              <span class="account-type">{{ $t('user_type.company') }}</span>
            </el-form-item>
            <div class="id-item">
              <el-form-item :label="$t('label.userid')" prop="user_id">
                <input-with-icon
                  :input-value="form.user_id"
                  :placeholder="$t('placeholder.id')"
                  :icon-name="'contact-24'"
                  @inputChanged="onIdChange"
                />
              </el-form-item>
              <el-button
                type="primary"
                class="btn-check-dup"
                :disabled="dupCheckDisabled"
                @click="checkDuplicates"
              >
                {{ $t('common.dup_check') }}
              </el-button>
            </div>
            <el-form-item :label="$t('label.password')" :prop="form.password_gen === 'N'?'user_pwd':''">
              <div class="auto-notify-setting">
                <input-with-icon
                  :type="'password'"
                  :input-value="form.user_pwd"
                  :placeholder="form.password_gen === 'N'? $t('placeholder.password') : $t('placeholder.password_gen')"
                  :icon-name="'lock-24'"
                  :disabled="form.password_gen === 'Y'?true:false"
                  style="flex: 1; margin-right: 10px; margin-bottom: 5px;"
                  @inputChanged="onPassChange"
                />
                <custom-check-box
                  :is-checked="form.password_gen === 'Y' ? true : false"
                  :label="$t('placeholder.password_gen')"
                  :border="true"
                  style="flex: 1;"
                  @checkChanged="passwordGenChange"
                >
                </custom-check-box>
              </div>
            </el-form-item>
            <el-form-item :label="$t('label.company_name')" prop="company_name">
              <input-with-icon
                :input-value="form.company_name"
                :placeholder="$t('company.name')"
                :icon-name="'person-24'"
                @inputChanged="onCompanyNameChange"
              />
            </el-form-item>
            <el-form-item :label="$t('label.contact_name')">
              <input-with-icon
                :input-value="form.user_name"
                :placeholder="$t('company.contact_name')"
                :icon-name="'person-24'"
                @inputChanged="onContactNameChange"
              />
            </el-form-item>
            <!-- <div class="phone-item"> -->
            <el-form-item :label="$t('label.phone')" prop="phone_number">
              <div class="country-phone">
                <el-select
                  v-model="form.country_code"
                  filterable
                  :placeholder="$t('placeholder.country_code')"
                >
                  <el-option
                    v-for="(item, i) in countryPhoneList"
                    :key="i"
                    :label="item.label"
                    :value="item.value"
                  >
                  </el-option>
                </el-select>
                <input-with-icon
                  :type="'number'"
                  :input-value="form.phone_number"
                  :placeholder="$t('placeholder.phone')"
                  :icon-name="'call-24'"
                  @inputChanged="onPhoneChange"
                />
              </div>
            </el-form-item>
            <!-- </div> -->
            <el-form-item :label="$t('label.email')" prop="email">
              <input-with-icon
                :type="'email'"
                :input-value="form.email"
                :placeholder="$t('placeholder.email')"
                :icon-name="'mail-24'"
                @inputChanged="onEmailChange"
              />
            </el-form-item>
            <el-form-item
              :label="$t('label.syslang')"
              class="system-lang"
              prop="system_lang"
            >
              <el-select
                v-model="form.system_lang"
                clearable
                :placeholder="$t('common.sel_syslang')"
              >
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
          <el-col :lg="6" class="avatar-container">
            <image-upload-item @avatarChanged="changeAvatarUrl" />
            <image-upload-item
              :company-logo="true"
              @avatarChanged="changeLogoUrl"
            />
          </el-col>
        </el-row>
        <el-row>
          <el-col :lg="24" class="bottom-container">
            <el-form-item :label="$t('company.support_service')">
              <div>- {{ $t('company.caption_trans') }}</div>
              <div style="margin: 15px 0;"></div>
              <el-checkbox
                v-model="checkAll"
                :indeterminate="isIndeterminate"
                class="check-all"
                @change="handleCheckAllChange"
              >
                {{ $t('common.all') }}
              </el-checkbox>
              <el-checkbox-group
                v-model="checkedServices"
                @change="handleCheckedServicesChange"
              >
                <el-checkbox
                  v-for="service in services"
                  :key="service"
                  :label="service"
                >
                  {{ service }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item
              :label="$t('company.trans_lang_pair')"
              class="trans-lang-pair"
              required
            >
              <div class="trans-item-div">
                <el-select
                  v-model="selOrgLang"
                  clearable
                  :placeholder="$t('company.org_lang')"
                >
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
                <el-select
                  v-model="selTransLang"
                  clearable
                  :placeholder="$t('company.trans_lang')"
                >
                  <el-option
                    v-for="item in workLangs"
                    :key="item.id"
                    :label="$t('common.' + item.name)"
                    :value="item.id"
                  >
                  </el-option>
                </el-select>
                <el-button
                  type="primary"
                  class="add-lang-pair"
                  @click="addLangPair"
                >
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
            <el-form-item
              :label="$t('company.trans_work_amount')"
              class="trans-work-amount"
              required
            >
              <el-row class="basic-setting">
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
                  <label>{{
                    $t('company.title_desc_fee') + '(' + standardCurrency + ')'
                  }}</label>
                  <el-input
                    v-model="form.title_cost"
                    type="number"
                    :class="{ error: validTitleCost == true }"
                    @blur="handleTitleCost"
                  ></el-input>
                </el-col>
                <el-col :span="8" class="urg-trans-extra">
                  <label>{{ $t('company.urg_trans_extra') + '(%)' }}</label>
                  <el-input
                    v-model="form.premium_rate"
                    type="number"
                    :class="{ error: validPremiumRate == true }"
                    @blur="handlePremiumRate"
                  ></el-input>
                </el-col>
              </el-row>
              <el-row class="trans-work-question">
                <label>{{ $t('company.trans_work_question') }}</label>
                <el-radio v-model="form.is_base_price_set" label="N">
                  {{ $t('common.no') }}
                </el-radio>
                <el-radio
                  v-model="form.is_base_price_set"
                  label="Y"
                  @change="onBasePriceSettingChangeY"
                >
                  {{ $t('common.yes') }}
                </el-radio>
              </el-row>
              <el-row>
                <div
                  v-if="form.is_base_price_set == 'N'"
                  class="amount-batch-set"
                >
                  <label class="batch-set-label">{{
                    $t('company.amount_batch_set')
                  }}</label>
                  <el-col :span="4">
                    <label>{{
                      $t('company.trans_amount') + '(' + standardCurrency + ')'
                    }}</label>
                    <el-input
                      v-model="transAmount"
                      :class="{ error: validTransAmount == true }"
                      @blur="handleTransAmount"
                    ></el-input>
                  </el-col>
                  <el-col :span="4">
                    <label>{{
                      $t('company.review_amount') + '(' + standardCurrency + ')'
                    }}</label>
                    <el-input
                      v-model="reviewAmount"
                      :class="{ error: validReviewAmount == true }"
                      @blur="handleReviewAmount"
                    ></el-input>
                  </el-col>
                  <el-col
                    :span="4"
                    class="tc-work-amount"
                    :class="$i18n.locale"
                  >
                    <label>{{ $t('company.work_amount') + '(TC)' }}</label>
                    <el-input
                      v-model="tcWorkAmount"
                      :class="{ error: validTcWorkAmount == true }"
                      @blur="handleTcWorkAmount"
                    ></el-input>
                  </el-col>
                  <el-col :span="4">
                    <label>{{
                      $t('company.work_amount') +
                        '(' +
                        $t('company.trans') +
                        ')'
                    }}</label>
                    <el-input
                      v-model="transWorkAmount"
                      :class="{ error: validTransWorkAmount == true }"
                      @blur="handleTransWorkAmount"
                    ></el-input>
                  </el-col>
                  <el-col :span="4">
                    <label>{{
                      $t('company.work_amount') +
                        '(' +
                        $t('company.review') +
                        ')'
                    }}</label>
                    <el-input
                      v-model="reviewWorkAmount"
                      :class="{ error: validReviewWorkAmount == true }"
                      @blur="handleReviewWorkAmount"
                    ></el-input>
                  </el-col>
                </div>
                <div v-else class="set-per-pairs">
                  <div class="mb5">
                    <label>{{ $t('company.amount_pair_set') }}</label>
                    <el-tag
                      type="success"
                      effect="dark"
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
                    <el-table-column :label="'From'" width="100" align="center">
                      <template slot-scope="scope">
                        <span>{{ scope.row.from }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="'To'" width="100" align="center">
                      <template slot-scope="scope">
                        <span>{{ scope.row.to }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column
                      :label="$t('company.trans_amount')"
                      align="center"
                    >
                      <template slot-scope="scope">
                        <div style="display: inline-flex; align-items: center">
                          {{ standardCurrency }}&nbsp;<el-input
                            v-model="scope.row.work_price"
                            type="number"
                          ></el-input>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column
                      :label="$t('company.review_amount')"
                      align="center"
                    >
                      <template slot-scope="scope">
                        <div style="display: inline-flex; align-items: center">
                          {{ standardCurrency }}&nbsp;<el-input
                            v-model="scope.row.review_price"
                            type="number"
                          ></el-input>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column
                      :label="$t('company.work_amount') + '(TC)'"
                      align="center"
                    >
                      <template slot-scope="scope">
                        <div style="display: inline-flex; align-items: center">
                          $&nbsp;<el-input
                            v-model="scope.row.tc_price"
                            type="number"
                          ></el-input>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column
                      :label="
                        $t('company.work_amount') +
                          ' (' +
                          $t('company.trans') +
                          ')'
                      "
                      align="center"
                    >
                      <template slot-scope="scope">
                        <div style="display: inline-flex; align-items: center">
                          $&nbsp;<el-input
                            v-model="scope.row.trans_price"
                            type="number"
                          ></el-input>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column
                      :label="
                        $t('company.work_amount') +
                          ' (' +
                          $t('company.review') +
                          ')'
                      "
                      align="center"
                    >
                      <template slot-scope="scope">
                        <div style="display: inline-flex; align-items: center">
                          $&nbsp;<el-input
                            v-model="scope.row.test_price"
                            type="number"
                          ></el-input>
                        </div>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-row>
            </el-form-item>
            <el-form-item
              :label="$t('company.time_limit_set')"
              class="time-limit-set"
              required
            >
              <el-row>
                <label>{{ '-' + $t('company.normal_trans') }}</label>
                <div>
                  {{ $t('company.general_screen_limit') }}
                  <el-input
                    v-model="form.general_screen_limit"
                    type="number"
                    :class="{ error: validGeneralScreenLimit == true }"
                    @blur="handleGeneralScreenLimit"
                  >
                  </el-input>
                  &nbsp;{{ $t('company.min_or_less') }},
                  {{ $t('company.general_end_time') }}
                  <el-input
                    v-model="form.general_end_time"
                    type="number"
                    :class="{ error: validGeneralEndTime == true }"
                    @blur="handleGeneralEndTime"
                  ></el-input>
                  &nbsp;{{ $t('company.general_end_time_suffix') }}
                </div>
              </el-row>
              <el-row>
                <label>{{ '-' + $t('company.urgent_trans') }}</label>
                <div>
                  {{ $t('company.emergency_screen_limit') }}
                  <el-input
                    v-model="form.emergency_screen_limit"
                    type="number"
                    :class="{ error: validEmergencyScreenLimit == true }"
                    @blur="handelEmergencyScreenLimit"
                  ></el-input>
                  {{ $t('company.min_or_less') }},
                  {{ $t('company.emg_exceed_impossible') }}
                </div>
              </el-row>
              <el-row>
                <label>{{ '-' + $t('company.free_trans') }}</label>
                <div>
                  {{ $t('company.free_screen_limit') }}
                  <el-input
                    v-model="form.free_screen_limit"
                    type="number"
                    :class="{ error: validFreeScreenLimit == true }"
                    @blur="handleFreeScreenLimit"
                  ></el-input>
                  {{ $t('company.free_screen_limit_prefix') }}
                </div>
              </el-row>
            </el-form-item>
            <el-form-item
              :label="$t('company.worker_assign_set')"
              class="worker-assign-set"
              required
            >
              <worker-assign-item
                :worker-type="'tc'"
                :tag-options="tagOptions"
                :assign-numbers="tc_numbers"
                @assignTypeChanged="assignTypeChange"
                @tagOptionChanged="tagsChanged"
              />
              <worker-assign-item
                :worker-type="'translator'"
                :tag-options="tagOptions"
                :assign-numbers="translator_numbers"
                @assignTypeChanged="assignTypeChange"
                @tagOptionChanged="tagsChanged"
              />
              <worker-assign-item
                :worker-type="'reviewer'"
                :tag-options="tagOptions"
                :assign-numbers="reviewer_numbers"
                @assignTypeChanged="assignTypeChange"
                @tagOptionChanged="tagsChanged"
              />
            </el-form-item>
            <el-form-item
              :label="$t('company.worker_endtime_set')"
              class="last-time-setting"
              required
            >
              <el-row>
                <label>{{ '-  ' + $t('company.normal_trans_48') }}</label>
              </el-row>
              <el-row>
                <el-table
                  border
                  header-row-class-name="company-end-table"
                  :data="normal_trans_list"
                >
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
                          :class="{ error: validLastTimeSetting[0] == true }"
                          @blur="
                            handleLastTimeSetting(
                              $event,
                              0,
                              'tc_gen_trans_time'
                            )
                          "
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.tc_gen_add_time"
                          type="number"
                          :class="{ error: validLastTimeSetting[1] == true }"
                          @blur="
                            handleLastTimeSetting($event, 1, 'tc_gen_add_time')
                          "
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
                          :class="{ error: validLastTimeSetting[2] == true }"
                          @blur="
                            handleLastTimeSetting(
                              $event,
                              2,
                              'tr_gen_trans_time'
                            )
                          "
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.tr_gen_add_time"
                          type="number"
                          :class="{ error: validLastTimeSetting[3] == true }"
                          @blur="
                            handleLastTimeSetting($event, 3, 'tr_gen_add_time')
                          "
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
                          :class="{ error: validLastTimeSetting[4] == true }"
                          @blur="
                            handleLastTimeSetting(
                              $event,
                              4,
                              're_gen_trans_time'
                            )
                          "
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.re_gen_add_time"
                          type="number"
                          :class="{ error: validLastTimeSetting[5] == true }"
                          @blur="
                            handleLastTimeSetting($event, 5, 're_gen_add_time')
                          "
                        ></el-input>
                        {{ $t('caption.min') }}
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
                <el-table
                  border
                  header-row-class-name="company-end-table"
                  :data="excess_trans_list"
                  :show-header="false"
                >
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
                          :class="{ error: validLastTimeSetting[6] == true }"
                          @blur="
                            handleLastTimeSetting(
                              $event,
                              6,
                              'tc_gen_excess_time'
                            )
                          "
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.tc_gen_excess_add_time"
                          type="number"
                          :class="{ error: validLastTimeSetting[7] == true }"
                          @blur="
                            handleLastTimeSetting(
                              $event,
                              7,
                              'tc_gen_excess_add_time'
                            )
                          "
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
                          :class="{ error: validLastTimeSetting[8] == true }"
                          @blur="
                            handleLastTimeSetting(
                              $event,
                              8,
                              'tr_gen_excess_time'
                            )
                          "
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.tr_gen_excess_add_time"
                          type="number"
                          :class="{ error: validLastTimeSetting[9] == true }"
                          @blur="
                            handleLastTimeSetting(
                              $event,
                              9,
                              'tr_gen_excess_add_time'
                            )
                          "
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
                          :class="{ error: validLastTimeSetting[10] == true }"
                          @blur="
                            handleLastTimeSetting(
                              $event,
                              10,
                              're_gen_excess_time'
                            )
                          "
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.re_gen_excess_add_time"
                          type="number"
                          :class="{ error: validLastTimeSetting[11] == true }"
                          @blur="
                            handleLastTimeSetting(
                              $event,
                              11,
                              're_gen_excess_add_time'
                            )
                          "
                        ></el-input>
                        {{ $t('caption.min') }}
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </el-row>
              <el-row>
                <label>{{ '-  ' + $t('company.urg_trans_24') }}</label>
              </el-row>
              <el-row>
                <el-table
                  border
                  header-row-class-name="company-end-table"
                  :data="urg_trans_list"
                >
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
                          :class="{ error: validLastTimeSetting[12] == true }"
                          @blur="
                            handleLastTimeSetting(
                              $event,
                              12,
                              'tc_emg_trans_time'
                            )
                          "
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.tc_emg_add_time"
                          type="number"
                          :class="{ error: validLastTimeSetting[13] == true }"
                          @blur="
                            handleLastTimeSetting($event, 13, 'tc_emg_add_time')
                          "
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
                          :class="{ error: validLastTimeSetting[14] == true }"
                          @blur="
                            handleLastTimeSetting(
                              $event,
                              14,
                              'tr_emg_trans_time'
                            )
                          "
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.tr_emg_add_time"
                          type="number"
                          :class="{ error: validLastTimeSetting[15] == true }"
                          @blur="
                            handleLastTimeSetting($event, 15, 'tr_emg_add_time')
                          "
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
                          :class="{ error: validLastTimeSetting[16] == true }"
                          @blur="
                            handleLastTimeSetting(
                              $event,
                              16,
                              're_emg_trans_time'
                            )
                          "
                        ></el-input>
                        {{ $t('caption.min') }} +
                        <el-input
                          v-model="scope.row.re_emg_add_time"
                          type="number"
                          :class="{ error: validLastTimeSetting[17] == true }"
                          @blur="
                            handleLastTimeSetting($event, 17, 're_emg_add_time')
                          "
                        ></el-input>
                        {{ $t('caption.min') }}
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </el-row>
            </el-form-item>
            <el-form-item
              :label="$t('company.req_pay_flag')"
              class="payment-request"
            >
              <div style="width: calc(50% - 5px);">
                <custom-check-box
                  :is-checked="form.card_payment_check === 'Y' ? true : false"
                  :label="$t('company.require_card_pay')"
                  :border="true"
                  @checkChanged="onCardPayChange"
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
                  @checkChanged="onSmsNotifyChange"
                >
                </custom-check-box>
                <custom-check-box
                  :is-checked="form.email_notice_check === 'Y' ? true : false"
                  :label="$t('common.email_notify')"
                  :border="true"
                  @checkChanged="onEmailNotifyChange"
                >
                </custom-check-box>
              </div>
            </el-form-item>
            <el-form-item
              :label="$t('label.use_terms')"
              class="use-terms-agree"
            >
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
                :autosize="{ minRows: 3, maxRows: 4 }"
              ></el-input>
            </el-form-item>
            <el-form-item label-width="0px">
              <el-button
                type="primary"
                class="btn-save"
                :disabled="loading"
                @click="onSubmit('companyForm')"
              >
                <span>{{ $t('common.register') }}</span>
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
        <el-button type="primary" @click="apply()">{{
          $t('common.apply')
        }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import InputWithIcon from '@/components/common/InputWithIcon.vue'
import CustomCheckBox from '@/components/common/CustomCheckBox.vue'
import WorkerAssignItem from '@/components/common/WorkerAssignItem.vue'
import ImageUploadItem from '@/components/common/ImageUploadItem.vue'
import global from '@/mixin/global'
import LangTagPair from '@/components/common/LangTagPair'

export default {
  // middleware: ['auth', 'auth-admin'],
  middleware: ['auth', 'stats'],
  layout: 'default',
  components: {
    InputWithIcon,
    CustomCheckBox,
    WorkerAssignItem,
    ImageUploadItem,
    LangTagPair
  },
  mixins: [global],
  data () {
    /** custom validators */
    const validateUserid = (rule, value, callback) => {
      if (value !== '' && !this.idRegEx.test(value)) {
        callback(new Error(this.$t('validation.invalid_id')))
      } else {
        callback()
      }
    }
    const validatePhone = (rule, value, callback) => {
      if (value !== '' && !this.phoneRegEx.test(value)) {
        callback(new Error(this.$t('validation.invalid_phone_num')))
      } else {
        callback()
      }
    }
    return {
      loading: false,
      stdAmtDialog: false,
      stdTransAmount: '',
      stdReviewAmount: '',
      stdTcWorkAmount: '',
      stdTrWorkAmount: '',
      stdReWorkAmount: '',
      form: {
        user_id: '',
        user_pwd: '',
        company_name: '',
        user_name: '',
        country_code: '+82',
        phone_number: '',
        email: '',
        system_lang: '',
        currency_type: 'JPY',
        title_cost: '',
        premium_rate: '',
        is_base_price_set: 'N',
        general_screen_limit: '',
        emergency_screen_limit: '',
        free_screen_limit: '',
        general_end_time: '',
        tc_assign_type: 1,
        translator_assign_type: 1,
        reviewer_assign_type: 1,
        card_payment_check: 'N',
        sms_notice_check: 'N',
        email_notice_check: 'N',
        use_terms: 'N',
        memo: '',
        password_gen: 'N'
      },
      user_type: 'company', // id duplicate check
      file: null,
      logo: null,
      orglang: [],
      translang: [],
      selOrgLang: '',
      selTransLang: '',
      tcTags: [],
      trTags: [],
      reTags: [],
      tc_numbers: 0,
      translator_numbers: 0,
      reviewer_numbers: 0,
      checkAll: false,
      isIndeterminate: true,
      checkedServices: [],
      serviceOptions: [
        this.$t('company.tc_work'),
        this.$t('company.review_work'),
        this.$t('company.title_desc_trans'),
        this.$t('company.youtube_auto_apply')
      ],
      services: [
        this.$t('company.tc_work'),
        this.$t('company.review_work'),
        this.$t('company.title_desc_trans'),
        this.$t('company.youtube_auto_apply')
      ],
      transAmount: '',
      reviewAmount: '',
      tcWorkAmount: '',
      transWorkAmount: '',
      reviewWorkAmount: '',
      smsDisabled: false,
      transworkAmountList: [],
      work_price: [],
      review_price: [],
      tc_price: [],
      trans_price: [],
      test_price: [],
      normal_trans_list: [
        {
          title: this.$t('company.trans_48'),
          tc_gen_trans_time: '',
          tc_gen_add_time: '',
          tr_gen_trans_time: '',
          tr_gen_add_time: '',
          re_gen_trans_time: '',
          re_gen_add_time: ''
        }
      ],
      excess_trans_list: [
        {
          title: this.$t('company.over_trans'),
          tc_gen_excess_time: '',
          tc_gen_excess_add_time: '',
          tr_gen_excess_time: '',
          tr_gen_excess_add_time: '',
          re_gen_excess_time: '',
          re_gen_excess_add_time: ''
        }
      ],
      urg_trans_list: [
        {
          title: this.$t('company.last_time'),
          tc_emg_trans_time: '',
          tc_emg_add_time: '',
          tr_emg_trans_time: '',
          tr_emg_add_time: '',
          re_emg_trans_time: '',
          re_emg_add_time: ''
        }
      ],
      langPairs: [],
      rules: {
        user_id: [
          {
            required: true,
            message: this.$t('validation.id_required'),
            trigger: 'blur'
          },
          { validator: validateUserid, trigger: 'blur' }
        ],
        user_pwd: [
          {
            required: true,
            message: this.$t('validation.pass_required'),
            trigger: 'blur'
          }
        ],
        company_name: [
          {
            required: true,
            message: this.$t('validation.company_name_required'),
            trigger: 'blur'
          }
        ],
        phone_number: [
          {
            required: true,
            message: this.$t('validation.phone_required'),
            trigger: 'blur'
          },
          { validator: validatePhone, trigger: 'blur' }
        ],
        email: [
          {
            required: true,
            message: this.$t('validation.email_required'),
            trigger: 'blur'
          },
          {
            type: 'email',
            message: this.$t('validation.invalid_email'),
            trigger: 'blur'
          }
        ],
        system_lang: [
          {
            required: true,
            message: this.$t('validation.syslang_required'),
            trigger: 'change'
          }
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
      validLastTimeSetting: [
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false
      ],
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
  watch: {
    langPairs (newVal) {
      this.transworkAmountList = []
      for (let i = 0; i < newVal.length; i++) {
        this.transworkAmountList.push({
          from: newVal[i].orglang,
          to: newVal[i].translang,
          work_price: this.work_price[i],
          review_price: this.review_price[i],
          tc_price: this.tc_price[i],
          trans_price: this.trans_price[i],
          test_price: this.test_price[i]
        })
      }
    }
  },
  created () {
    this.getWorkLangs()
    this.getTags()
    this.setTcNumbers()
    this.setTrNumbers()
    this.setReNumbers()
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
        this.stdTransAmount === ''
      ) {
        this.$message({
          message: this.$t('validation.std_amount_all_required'),
          type: 'error'
        })
      } else {
        this.stdAmtDialog = false
        for (let i = 0; i < this.langPairs.length; i++) {
          this.transworkAmountList[i].work_price = this.stdTransAmount
          this.transworkAmountList[i].review_price = this.stdReviewAmount
          this.transworkAmountList[i].tc_price = this.stdTcWorkAmount
          this.transworkAmountList[i].trans_price = this.stdTrWorkAmount
          this.transworkAmountList[i].test_price = this.stdReWorkAmount
        }
      }
    },
    async setTcNumbers () {
      const resp = await this.$axios.post('/basic/get-worker-count-by-tags', {
        worker_type: 'tc',
        tags: -1
      })
      this.tc_numbers = resp.data.data
    },
    async setTrNumbers () {
      const resp = await this.$axios.post('/basic/get-worker-count-by-tags', {
        worker_type: 'translator',
        tags: -1
      })
      this.translator_numbers = resp.data.data
    },
    async setReNumbers () {
      const resp = await this.$axios.post('/basic/get-worker-count-by-tags', {
        worker_type: 'reviewer',
        tags: -1
      })
      this.reviewer_numbers = resp.data.data
    },
    assignTypeChange (data) {
      const { workerType, assignOption } = data
      if (workerType === 'tc') {
        this.form.tc_assign_type = assignOption
      } else if (workerType === 'translator') {
        this.form.translator_assign_type = assignOption
      } else {
        this.form.reviewer_assign_type = assignOption
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
    langPairRemoved (index) {
      this.langPairs.splice(index, 1)
      this.work_price.splice(index, 1)
      this.review_price.splice(index, 1)
      this.tc_price.splice(index, 1)
      this.trans_price.splice(index, 1)
      this.test_price.splice(index, 1)
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
        const dupPairs = this.langPairs.filter(
          langPair =>
            langPair.orglang === this.getLangName(this.selOrgLang) &&
            langPair.translang === this.getLangName(this.selTransLang)
        )
        if (dupPairs.length > 0) {
          this.$message({
            message: this.$t('validation.dup_lang_pair'),
            type: 'error'
          })
          return false
        }
        this.orglang.push(this.selOrgLang)
        this.translang.push(this.selTransLang)
        this.langPairs.push({
          orglang: this.getLangName(this.selOrgLang),
          translang: this.getLangName(this.selTransLang)
        })
        this.selOrgLang = ''
        this.selTransLang = ''

        this.work_price.push('')
        this.review_price.push('')
        this.tc_price.push('')
        this.trans_price.push('')
        this.test_price.push('')
      }
    },
    changeAvatarUrl (file) {
      this.file = file
    },
    changeLogoUrl (logo) {
      this.logo = logo
    },
    handleCheckAllChange (val) {
      this.checkedServices = val ? this.serviceOptions : []
      this.isIndeterminate = false
    },
    handleCheckedServicesChange (value) {
      const checkedCount = value.length
      this.checkAll = checkedCount === this.services.length
      this.isIndeterminate =
        checkedCount > 0 && checkedCount < this.services.length
    },
    onIdChange (id) {
      if (this.idRegEx.test(id)) {
        this.dupCheckDisabled = false
      } else {
        this.dupCheckDisabled = true
      }
      this.form.user_id = id
      if (this.dupCheckedId !== '' && this.dupCheckedId !== this.form.user_id) {
        this.dupChecked = false
      }
      if (this.dupCheckedId !== '' && this.dupCheckedId === this.form.user_id) {
        this.dupChecked = true
      }
    },
    onPassChange (pwd) {
      this.form.user_pwd = pwd
    },
    onCompanyNameChange (name) {
      this.form.company_name = name
    },
    onContactNameChange (contact) {
      this.form.user_name = contact
    },
    onPhoneChange (phone) {
      this.form.phone_number = phone
    },
    onEmailChange (email) {
      this.form.email = email
    },
    onSmsNotifyChange (smsNotify) {
      if (smsNotify) {
        this.form.sms_notice_check = 'Y'
      } else {
        this.form.sms_notice_check = 'N'
      }
    },
    onEmailNotifyChange (emailNotify) {
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
    passwordGenChange (passwordGenNotify) {
      if (passwordGenNotify) {
        this.$refs.companyForm.clearValidate('user_pwd')
        this.form.password_gen = 'Y'
        this.form.user_pwd = ''
      } else {
        this.form.password_gen = 'N'
      }
    },
    onSubmit (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          if (!this.dupChecked) {
            this.$notify({
              title: this.$t('common.fail'),
              message: this.$t('validation.id_dupcheck_required'),
              type: 'error'
            })
            return false
          }
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

          if (
            !this.validTitleCost &&
            !this.validPremiumRate &&
            !this.validTransAmount &&
            !this.validReviewAmount &&
            !this.validTcWorkAmount &&
            !this.validTransWorkAmount &&
            !this.validReviewWorkAmount &&
            !this.validGeneralScreenLimit &&
            !this.validGeneralEndTime &&
            !this.validEmergencyScreenLimit &&
            !this.validFreeScreenLimit &&
            !this.is_last_time_required
          ) {
            if (this.form.is_base_price_set === 'Y') {
              for (let i = 0; i < this.langPairs.length; i++) {
                if (
                  !this.transworkAmountList[i].work_price ||
                  !this.transworkAmountList[i].review_price ||
                  !this.transworkAmountList[i].tc_price ||
                  !this.transworkAmountList[i].trans_price ||
                  !this.transworkAmountList[i].test_price
                ) {
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
            for (const key in this.form) {
              formData.append(key, this.form[key])
            }
            for (let i = 0; i < this.orglang.length; i++) {
              formData.append('original_languages[]', this.orglang[i])
            }
            for (let i = 0; i < this.translang.length; i++) {
              formData.append('translate_languages[]', this.translang[i])
            }
            for (let i = 0; i < this.checkedServices.length; i++) {
              formData.append(
                'services[]',
                this.serviceOptions.indexOf(this.checkedServices[i]) + 1
              )
            }
            if (this.form.tc_assign_type === 1) {
              if (this.tcTags.length > 0) {
                for (let i = 0; i < this.tcTags.length; i++) {
                  formData.append('tc_tags[]', this.tcTags[i])
                }
              } else {
                formData.append('tc_tags', -1)
              }
              formData.append('tc_numbers', this.tc_numbers)
            }
            if (this.form.translator_assign_type === 1) {
              if (this.trTags.length > 0) {
                for (let i = 0; i < this.trTags.length; i++) {
                  formData.append('translator_tags[]', this.trTags[i])
                }
              } else {
                formData.append('translator_tags', -1)
              }
              formData.append('translator_numbers', this.translator_numbers)
            }
            if (this.form.reviewer_assign_type === 1) {
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
                  formData.append(
                    'work_price[]',
                    this.transworkAmountList[i].work_price
                  )
                  formData.append(
                    'native_review_price[]',
                    this.transworkAmountList[i].review_price
                  )
                  formData.append(
                    'tc_price[]',
                    this.transworkAmountList[i].tc_price
                  )
                  formData.append(
                    'trans_price[]',
                    this.transworkAmountList[i].trans_price
                  )
                  formData.append(
                    'test_price[]',
                    this.transworkAmountList[i].test_price
                  )
                }
              }
            }
            formData.append(
              'general_trans_time[]',
              this.normal_trans_list[0].tc_gen_trans_time
            )
            formData.append(
              'general_trans_time[]',
              this.normal_trans_list[0].tr_gen_trans_time
            )
            formData.append(
              'general_trans_time[]',
              this.normal_trans_list[0].re_gen_trans_time
            )

            formData.append(
              'general_trans_add_time[]',
              this.normal_trans_list[0].tc_gen_add_time
            )
            formData.append(
              'general_trans_add_time[]',
              this.normal_trans_list[0].tr_gen_add_time
            )
            formData.append(
              'general_trans_add_time[]',
              this.normal_trans_list[0].re_gen_add_time
            )

            formData.append(
              'general_excess_time[]',
              this.excess_trans_list[0].tc_gen_excess_time
            )
            formData.append(
              'general_excess_time[]',
              this.excess_trans_list[0].tr_gen_excess_time
            )
            formData.append(
              'general_excess_time[]',
              this.excess_trans_list[0].re_gen_excess_time
            )

            formData.append(
              'general_excess_add_time[]',
              this.excess_trans_list[0].tc_gen_excess_add_time
            )
            formData.append(
              'general_excess_add_time[]',
              this.excess_trans_list[0].tr_gen_excess_add_time
            )
            formData.append(
              'general_excess_add_time[]',
              this.excess_trans_list[0].re_gen_excess_add_time
            )

            formData.append(
              'emergency_trans_time[]',
              this.urg_trans_list[0].tc_emg_trans_time
            )
            formData.append(
              'emergency_trans_time[]',
              this.urg_trans_list[0].tr_emg_trans_time
            )
            formData.append(
              'emergency_trans_time[]',
              this.urg_trans_list[0].re_emg_trans_time
            )

            formData.append(
              'emergency_add_time[]',
              this.urg_trans_list[0].tc_emg_add_time
            )
            formData.append(
              'emergency_add_time[]',
              this.urg_trans_list[0].tr_emg_add_time
            )
            formData.append(
              'emergency_add_time[]',
              this.urg_trans_list[0].re_emg_add_time
            )

            this.loading = true
            this.$axios
              .post('/company/register-company', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              })
              .then((resp) => {
                const { errorCode } = resp.data
                this.loading = false
                if (errorCode === 0) {
                  this.$notify({
                    title: this.$t('common.success'),
                    message: this.$t('common.register_success'),
                    type: 'success'
                  })
                  this.$router.push('/company')
                } else if (errorCode === 11) {
                  this.$notify({
                    title: this.$t('common.error'),
                    message: this.$t('common.id_duplicated'),
                    type: 'error'
                  })
                } else {
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
    },
    onCardPayChange (payCheck) {
      if (payCheck) {
        this.form.card_payment_check = 'Y'
      } else {
        this.form.card_payment_check = 'N'
      }
    },
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
        if (this.normal_trans_list[0][key] === '') {
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
        if (this.urg_trans_list[0][key] === '') {
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
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
::v-deep .btn-save span {
  display: flex;
  justify-content: space-between;
}
.left-container {
  border-right: 1px solid $gray30;
  .account-type {
    font-size: 15px;
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
  .trans-work-amount {
    .basic-setting {
      .el-input,
      .el-select {
        width: 120px;
        input {
          height: 60px;
        }
      }
    }
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
        padding-left: 10px;
      }
      .batch-set-label {
        display: block;
        margin-bottom: 5px;
      }
      .tc-work-amount.en {
        line-height: 40px;
      }
      .el-input {
        width: 120px;
        input {
          height: 60px;
        }
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
  .std-amount-dialog {
    label {
      word-break: break-word;
    }
  }
}
::v-deep {
  .el-input__inner {
    height: $inputBoxHeight;
  }
  .time-limit-set {
    .el-input {
      width: 60px;
      input {
        height: 40px;
      }
    }
  }
  .company-end-table th {
    background: #f5f7fa;
    text-align: center;
  }
  .last-time-setting {
    table td span,
    table td div {
      word-break: break-word;
    }
    .el-input {
      width: 50px !important;
      input {
        height: 30px;
      }
    }
  }
  .error input {
    border-width: 1px;
    border-color: #f56c6c;
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
  .title-desc-fee {
    label {
      line-height: $formLabelLineHeight !important;
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
    }
  }
  .set-per-pairs {
    .el-tag {
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
}
</style>
