<template>
  <div class="edit-container">
    <div class="page-title">
      {{ $t('requester.detail') }}
    </div>
    <el-card v-loading="loading" class="box-card">
      <el-form
        ref="requesterEditForm"
        :model="form"
        :rules="rules"
        label-width="160px"
        label-position="left"
      >
        <el-row>
          <el-col :md="18" :lg="18" class="left-container">
            <el-form-item
              v-if="$auth.user.user_type == 1"
              :label="$t('requester.company')"
            >
              <span class="company-info">{{
                form.company_data['company_name'] +
                  '(' +
                  form.company_data['company_id'] +
                  ')'
              }}</span>
            </el-form-item>
            <el-form-item :label="$t('label.account_type')">
              <span class="account-type">{{ $t('user_type.requester') }}</span>
            </el-form-item>
            <el-form-item :label="$t('label.userid')">
              <input-with-icon
                :input-value="form.user_id"
                :icon-name="'contact-24'"
                :disabled="true"
              />
            </el-form-item>
            <el-form-item :label="$t('label.password')" prop="user_pwd">
              <input-with-icon
                :placeholder="$t('placeholder.password')"
                :type="'password'"
                :icon-name="'lock-24'"
                @inputChanged="onPassChange"
              />
            </el-form-item>
            <el-form-item :label="$t('label.user_name')" prop="user_name">
              <input-with-icon
                :input-value="form.user_name"
                :icon-name="'person-24'"
                :placeholder="$t('placeholder.name')"
                @inputChanged="onNameChange"
              />
            </el-form-item>
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
                  :input-value="form.phone_number"
                  :placeholder="$t('placeholder.phone')"
                  :icon-name="'call-24'"
                  @inputChanged="onPhoneChange"
                />
              </div>
            </el-form-item>
            <el-form-item :label="$t('label.email')" prop="email">
              <input-with-icon
                :type="'email'"
                :input-value="form.email"
                :icon-name="'mail-24'"
                :placeholder="$t('placeholder.email')"
                @inputChanged="onEmailChange"
              />
            </el-form-item>
            <el-form-item :label="$t('label.syslang')" prop="system_lang">
              <el-select
                v-model="form.system_lang"
                :placeholder="$t('placeholder.syslang')"
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

            <el-form-item :label="$t('label.translang')" class="trans-lang">
              <div class="trans-item-div">
                <el-button
                  type="success"
                  class="btn-org-lang"
                  @click="orgDialog = true"
                >
                  <template v-if="selOrgLang && workLangs.length > 0">
                    {{ getLangName(selOrgLang) }}
                  </template>
                  <template v-else>
                    {{ $t('placeholder.orglang') }}
                  </template>
                </el-button>
                <span class="btn-caret-right">
                  <i class="el-icon-caret-right"></i>
                </span>
                <el-button
                  type="warning"
                  class="btn-trans-lang"
                  @click="transDialog = true"
                >
                  <template v-if="selTransLangs.length > 0">
                    {{ transLangNames }}
                  </template>
                  <template v-else>
                    {{ $t('placeholder.translang') }}
                  </template>
                </el-button>
              </div>
            </el-form-item>

            <el-form-item
              v-if="$auth.user.user_type == 2 || $auth.user.user_type == 7"
              :label="$t('label.account_sale')"
            >
              <input-with-icon
                :input-value="
                  form.discount ? '￥' + form.discount + '/min' : '-'
                "
                :icon-name="'money'"
                :disabled="true"
              />
            </el-form-item>
            <el-form-item
              v-if="$auth.user.user_type == 1"
              :label="$t('label.account_sale')"
              prop="discount"
              class="discount"
            >
              <el-input v-model="form.discount" type="number"></el-input>
              {{ $t('requester.account_sale_desc') }}
            </el-form-item>
            <el-form-item
              v-if="$auth.user.user_type == 2 || $auth.user.user_type == 7"
              :label="$t('label.free_req_count')"
            >
              <input-with-icon
                :input-value="form.free_req_cnt"
                :icon-name="'request'"
                :disabled="true"
              />
            </el-form-item>
            <el-form-item
              v-if="$auth.user.user_type == 1"
              :label="$t('label.free_req_count')"
              prop="free_req_cnt"
              class="free-req-cnt"
            >
              <el-input v-model="form.free_req_cnt" type="number"></el-input>
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
            <el-form-item :label="$t('common.other')" prop="extra">
              <el-input
                v-model="form.extra"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 4 }"
              >
              </el-input>
            </el-form-item>
            <el-form-item
              v-if="$auth.user.user_type == 1"
              :label="$t('label.admin_memo')"
              prop="memo"
            >
              <el-input
                v-model="form.memo"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 4 }"
              >
              </el-input>
            </el-form-item>
            <el-form-item
              v-if="$auth.user.user_type == 2 || $auth.user.user_type == 7"
              :label="$t('label.client_comp_memo')"
              prop="memo"
            >
              <el-input
                v-model="form.memo"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 4 }"
              >
              </el-input>
            </el-form-item>
            <el-form-item label-width="0px">
              <el-button
                type="primary"
                class="btn-save"
                :disabled="loading"
                @click="onSubmit('requesterEditForm')"
              >
                <span>{{ $t('common.save') }}</span>
                <i class="el-icon-right"></i>
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :md="6" :lg="6" class="avatar-container">
            <image-upload-item
              :image-url="form.avatar"
              @avatarChanged="changeAvatarUrl"
            />
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-dialog
      :title="$t('placeholder.orglang')"
      :visible.sync="orgDialog"
      width="60%"
      @open="openOrgDialog"
    >
      <div>
        <el-radio
          v-for="lang in availableOrgLangs"
          :key="lang.id"
          v-model="orglang"
          :label="lang.id"
          class="lang-options"
        >
          {{ $t('common.' + lang.name) }}
        </el-radio>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="closeOrgDialog">{{
          $t('requester.select_complete')
        }}</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :title="$t('placeholder.translang')"
      :visible.sync="transDialog"
      width="60%"
      @open="openTransDialog"
    >
      <el-checkbox-group
        v-model="transLangCheckList"
        @change="handleCheckedLang"
      >
        <el-checkbox
          v-for="lang in availableTransLangs"
          :key="lang.id"
          :value="lang.id"
          :label="$t('common.' + lang.name)"
          class="lang-options"
        >
        </el-checkbox>
      </el-checkbox-group>
      <div slot="footer" class="trans-dialog-footer">
        <label>
          {{ $t('requester.selected_lang_count', { n: checkedCount }) }}
        </label>
        <div>
          <el-button @click="formatSelectTransLang">
            {{ $t('requester.format_select') }}
          </el-button>
          <el-button type="primary" @click="closeTransDialog">
            {{ $t('requester.select_complete') }}
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import global from '@/mixin/global'
import langPairs from '@/mixin/langPairs'
import InputWithIcon from '@/components/common/InputWithIcon.vue'
import CustomCheckBox from '@/components/common/CustomCheckBox.vue'
export default {
  // middleware: ['auth', 'auth-admincom'],
  middleware: ['auth', 'stats'],
  layout: 'detail',
  components: {
    InputWithIcon,
    CustomCheckBox
  },
  mixins: [global, langPairs],
  async asyncData ({ $axios, params, error }) {
    const requesterId = params.id
    try {
      const response = await $axios.post('/requester/detail', {
        id: requesterId
      })
      const { errorCode, data } = response.data
      data.user_pwd = ''
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
    const validatePass = (rule, value, callback) => {
      if (this.$auth.user.user_type === 1) {
        callback()
      }
      if (!value) {
        callback()
      }
      if (value.length < 10 || value.length > 20) {
        callback(new Error(this.$t('validation.pass_invalid')))
      }
      if (
        this.letterNumRegexPass(value) ||
        this.letterSpecRegexPass(value) ||
        this.numSpecRegexPass(value)
      ) {
        callback()
      } else {
        callback(new Error(this.$t('validation.pass_invalid')))
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
      file: null,
      /** form validation rules */
      rules: {
        user_pwd: [{ validator: validatePass, trigger: 'blur' }],
        user_name: [
          {
            required: true,
            message: this.$t('validation.user_name_required'),
            trigger: 'blur'
          }
        ],
        phone_number: [{ validator: validatePhone, trigger: 'blur' }],
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
        ],
        discount: [
          {
            required: true,
            message: this.$t('validation.discount_required'),
            trigger: 'blur'
          }
        ],
        free_req_cnt: [
          {
            required: true,
            message: this.$t('validation.free_req_cnt_required'),
            trigger: 'blur'
          }
        ],
        memo: [
          {
            min: 0,
            max: 300,
            message: this.$t('validation.memo_exceed_maxleng'),
            trigger: 'blur'
          }
        ]
      }
    }
  },
  created () {
    this.setOrgLang()
    this.currentTransLangList()
    this.getCompanyLangPairs(this.form.company_data.id)
  },
  methods: {
    setOrgLang () {
      if (this.form.original_language) {
        this.orglang = this.form.original_language.id
        this.selOrgLang = this.form.original_language.id
      }
    },
    currentTransLangList () {
      for (let i = 0; i < this.form.translate_languages.length; i++) {
        this.transLangCheckList.push(
          this.$t('common.' + this.form.translate_languages[i].name)
        )
        this.selTransLangs.push(
          this.$t('common.' + this.form.translate_languages[i].name)
        )
      }
      this.checkedCount = this.selTransLangs.length
    },
    openOrgDialog () {
      if (this.selOrgLang !== this.orglang) {
        this.setOrgLang()
      }
    },
    openTransDialog () {
      if (
        JSON.stringify(this.selTransLangs) !==
        JSON.stringify(this.transLangCheckList)
      ) {
        this.currentTransLangList()
      }
    },
    changeAvatarUrl (file) {
      this.file = file
    },
    onPassChange (pwd) {
      this.form.user_pwd = pwd
    },
    onNameChange (name) {
      this.form.user_name = name
    },
    onPhoneChange (phone) {
      this.form.phone_number = phone
    },
    onEmailChange (email) {
      this.form.email = email
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
    onSubmit (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.loading = true
          const formData = new FormData()
          if (this.file != null) {
            formData.append('file', this.file)
          }
          const exclusionKeys = [
            'avatar',
            'original_language',
            'translate_languages',
            'company_data'
          ]
          if (this.$auth.user.user_type === 2 || this.$auth.user.user_type === 7) {
            exclusionKeys.push('discount', 'free_req_cnt')
          }
          for (const key in this.form) {
            if (exclusionKeys.includes(key)) {
              continue
            }
            formData.append(key, this.form[key])
          }
          /** Add company data */
          formData.append('company_id', this.form.company_data.id)
          if (this.selOrgLang) {
            formData.append('original_language', this.orglang)
          }
          if (this.selTransLangs.length > 0) {
            for (let i = 0; i < this.selTransLangs.length; i++) {
              formData.append(
                'translate_languages[]',
                this.getTransLangId(this.selTransLangs[i])
              )
            }
          }
          this.$axios
            .post('/requester/register-requester', formData, {
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
                this.$router.push('/requester/detail/' + this.form.id)
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
            .catch(() => {
              this.loading = false
            })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
.left-container {
  .trans-item-div {
    display: flex;
    .el-icon-right {
      margin-left: 5px;
      margin-right: 5px;
    }
    .btn-org-lang {
      flex: 1;
    }
    .btn-caret-right {
      text-align: center;
      margin-left: 5px;
      margin-right: 5px;
      width: 40px;
    }
    .btn-trans-lang {
      margin-left: 0px;
      flex: 1;
    }
  }
}

.left-container {
  .el-tag {
    margin-right: 10px;
  }
  .discount .el-input,
  .free-req-cnt .el-input {
    width: 60px;
  }
}

.lang-options {
  margin: 10px 0;
  width: 32%;
}

.trans-dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  label {
    text-align: left;
    max-width: $dialogFooterLbMxWidth;
  }
}

::v-deep {
  .el-dialog__footer {
    padding: $dialogFooterPadding !important;
  }
  .trans-lang,
  .free-req-cnt {
    .el-form-item__label {
      line-height: $formLabelLineHeight !important;
      margin-top: $formLabelMgTop !important;
    }
  }
}
</style>
