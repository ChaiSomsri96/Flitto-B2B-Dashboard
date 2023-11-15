<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('requester.add') }}
    </div>
    <el-card v-loading="loading" class="form-container box-card">
      <el-form
        ref="requesterRegForm"
        :rules="rules"
        :model="form"
        label-width="180px"
        label-position="left"
      >
        <el-row>
          <el-col :lg="18" class="left-container">
            <el-form-item :label="$t('label.account_type')">
              <span class="account-type">{{ $t('user_type.requester') }}</span>
            </el-form-item>
            <el-form-item
              v-if="$auth.user.user_type == 1"
              :label="$t('label.company')"
              prop="company_id"
            >
              <el-select
                v-model="form.company_id"
                clearable
                :placeholder="$t('placeholder.sel_company')"
                @change="companyChanged"
              >
                <el-option
                  v-for="item in companyList"
                  :key="item.id"
                  :label="item.company_name"
                  :value="item.id"
                >
                </el-option>
              </el-select>
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

            <el-form-item :label="$t('label.user_name')" prop="user_name">
              <input-with-icon
                :input-value="form.user_name"
                :placeholder="$t('placeholder.name')"
                :icon-name="'person-24'"
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
                :placeholder="$t('placeholder.email')"
                :icon-name="'mail-24'"
                @inputChanged="onEmailChange"
              />
            </el-form-item>
            <el-form-item
              :label="$t('label.syslang')"
              prop="system_lang"
              class="system-lang"
            >
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
            <el-form-item
              :label="$t('label.translang_defval')"
              class="trans-item-div"
            >
              <el-button
                type="success"
                class="btn-org-lang"
                :disabled="form.company_id ? false : true"
                @click="orgDialog = true"
              >
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
              <el-button
                type="warning"
                class="btn-trans-lang"
                :disabled="selOrgLang ? false : true"
                @click="transDialog = true"
              >
                <template v-if="selTransLangs.length > 0">
                  {{ transLangNames }}
                </template>
                <template v-else>
                  {{ $t('placeholder.translang') }}
                </template>
              </el-button>
            </el-form-item>

            <el-form-item
              v-if="$auth.user.user_type == 1"
              :label="$t('requester.account_sale')"
              prop="discount"
            >
              <div class="account-sale">
                <el-input v-model="form.discount"></el-input>
                {{ $t('requester.account_sale_desc') }}
              </div>
            </el-form-item>
            <el-form-item
              v-if="$auth.user.user_type == 1"
              :label="$t('requester.free_req_count')"
              prop="free_req_cnt"
              class="free-req-cnt"
            >
              <div class="free-req-count">
                <el-input v-model="form.free_req_cnt"></el-input>
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
            <el-form-item :label="$t('common.other')" prop="extra">
              <el-input
                v-model="form.extra"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 4 }"
              ></el-input>
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
              ></el-input>
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
              ></el-input>
            </el-form-item>
            <el-form-item label-width="0px">
              <el-button
                type="primary"
                class="btn-save"
                :disabled="loading"
                @click="onSubmit('requesterRegForm')"
              >
                <span>{{ $t('common.register') }}</span>
                <i class="el-icon-right"></i>
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="6" class="avatar-container">
            <image-upload-item @avatarChanged="changeAvatarUrl" />
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
      width="40%"
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
      <span slot="footer" class="trans-dialog-footer">
        <label>
          {{ $t('requester.selected_lang_count', { n: checkedCount }) }}
        </label>
        <div>
          <el-button @click="formatSelectTransLang">{{
            $t('requester.format_select')
          }}</el-button>
          <el-button type="primary" @click="closeTransDialog">{{
            $t('requester.select_complete')
          }}</el-button>
        </div>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import InputWithIcon from '@/components/common/InputWithIcon.vue'
import CustomCheckBox from '@/components/common/CustomCheckBox.vue'
import global from '@/mixin/global'
import langPairs from '@/mixin/langPairs'

export default {
  // middleware: ['auth', 'auth-admincom'],
  middleware: ['auth', 'stats'],
  layout: 'default',
  components: {
    InputWithIcon,
    CustomCheckBox
  },
  mixins: [global, langPairs],
  data () {
    /** custom validators */
    const validateUserid = (rule, value, callback) => {
      if (value !== '' && !this.idRegEx.test(value)) {
        callback(new Error(this.$t('validation.invalid_id')))
      } else {
        callback()
      }
    }
    const validatePass = (rule, value, callback) => {
      if (this.$auth.user.user_type === 1) {
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
      form: {
        company_id: '',
        user_id: '',
        user_pwd: '',
        user_name: '',
        country_code: '+82',
        phone_number: '',
        email: '',
        system_lang: '',
        discount: '',
        free_req_cnt: '',
        sms_notice_check: 'N',
        email_notice_check: 'N',
        memo: '',
        password_gen: 'N'
      },
      user_type: 'requester',
      companyList: [],
      checkedCount: 0,
      file: null, // avatar upload
      loading: false,
      rules: {
        company_id: [
          {
            required: true,
            message: this.$t('placeholder.sel_company'),
            trigger: 'change'
          }
        ],
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
          },
          { validator: validatePass, trigger: 'blur' }
        ],
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
    if (this.$auth.user.user_type === 1) {
      this.getCompanyList()
    }
    /** in case of company */
    if (this.$auth.user.user_type === 2) {
      this.form.company_id = this.$auth.user.id
      this.form.country_code = this.$auth.user.country_code
      this.getCompanyLangPairs(this.$auth.user.id)
    }
    if (this.$auth.user.user_type === 7) {
      this.form.company_id = this.$auth.user.company_id
      this.form.country_code = this.$auth.user.company_country_code
      this.getCompanyLangPairs(this.$auth.user.company_id)
    }
  },
  methods: {
    changeAvatarUrl (file) {
      this.file = file
    },
    async getCompanyList () {
      try {
        const response = await this.$axios.post('/company/get-company-list')
        this.companyList = response.data.data.list
      } catch {
        this.companyList = []
      }
    },
    companyChanged () {
      if (this.form.user_id && this.form.company_id) {
        this.dupCheckDisabled = false
      } else {
        this.dupCheckDisabled = true
      }
      this.getCompanyDetail(this.form.company_id)
      this.getCompanyLangPairs(this.form.company_id)
      this.orglang = ''
      this.selOrgLang = ''
      this.transLangCheckList = []
      this.selTransLangs = []
    },
    async getCompanyDetail (companyId) {
      try {
        const response = await this.$axios.post('/company/detail', {
          id: companyId
        })
        const { errorCode, data } = response.data
        if (errorCode === 0) {
          this.form.country_code = data.country_code
        }
      } catch (err) {}
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
    onNameChange (name) {
      this.form.user_name = name
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
    passwordGenChange (passwordGenNotify) {
      if (passwordGenNotify) {
        // this.validate_rule = this.rules_expt_pwd
        this.$refs.requesterRegForm.clearValidate('user_pwd')
        this.form.password_gen = 'Y'
        this.form.user_pwd = ''
      } else {
        // this.validate_rule = this.rules
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
          const formData = new FormData()
          if (this.file != null) {
            formData.append('file', this.file)
          }
          const exclusionKeys = ['discount', 'free_req_cnt']
          for (const key in this.form) {
            if (
              this.$auth.user.user_type === 2 &&
              exclusionKeys.includes(key)
            ) {
              continue
            }
            formData.append(key, this.form[key])
          }
          if (this.selOrgLang) {
            formData.append('original_language', this.selOrgLang)
          }
          if (this.selTransLangs.length > 0) {
            for (let i = 0; i < this.selTransLangs.length; i++) {
              formData.append(
                'translate_languages[]',
                this.getTransLangId(this.selTransLangs[i])
              )
            }
          }
          this.loading = true
          this.$axios
            .post('/requester/register-requester', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            })
            .then((resp) => {
              this.loading = false
              const { errorCode } = resp.data
              if (errorCode === 0) {
                this.$notify({
                  title: this.$t('common.success'),
                  message: this.$t('common.register_success'),
                  type: 'success'
                })
                this.$router.push('/requester')
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
  border-right: 1px solid $gray30;
}

.left-container {
  .account-sale .el-input,
  .free-req-count .el-input {
    width: 60px;
  }
  .tags .el-select {
    width: 65%;
  }
}

.el-form-item:first-child {
  text-align: left;
  .account-type {
    font-size: 15px;
  }
}

::v-deep .trans-item-div .el-form-item__content {
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
.el-checkbox {
  flex: 1;
  margin-right: 0px;
}

::v-deep {
  .el-input__inner {
    height: $inputBoxHeight;
  }
  .el-dialog__body {
    border-top: 1px solid #dcdcdc;
    border-bottom: 1px solid #dcdcdc;
  }
  .free-req-cnt {
    .el-form-item__label {
      line-height: $formLabelLineHeight !important;
      margin-top: $formLabelMgTop !important;
    }
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
}
</style>
