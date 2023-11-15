<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('admin.add') }}
    </div>
    <el-card v-loading="loading" class="form-container box-card">
      <el-form
        ref="adminRegForm"
        :model="form"
        :rules="validate_rule"
        label-width="160px"
        label-position="left"
      >
        <el-row>
          <el-col :lg="18" class="left-container">
            <el-form-item :label="$t('label.account_type')">
              <span class="account-type">{{ $t('user_type.admin') }}</span>
            </el-form-item>
            <div class="id-item">
              <el-form-item :label="$t('label.userid')" prop="user_id">
                <input-with-icon
                  :input-value="form.user_id"
                  :placeholder="$t('placeholder.id')"
                  :icon-name="'contact-24'"
                  @inputChanged="onUseridChange"
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

            <el-form-item :label="$t('label.name')" prop="user_name">
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
              class="system-lang"
              prop="system_lang"
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
            <el-form-item :label="$t('label.admin_memo')" prop="memo">
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
                @click="onSubmit('adminRegForm')"
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
  </div>
</template>

<script>
import edit from '@/mixin/edit'
import ImageUploadItem from '@/components/common/ImageUploadItem'

export default {
  // middleware: ['auth', 'auth-admin'],
  middleware: ['auth', 'stats'],
  name: 'AddAdmin',
  components: {
    ImageUploadItem
  },
  mixins: [edit],
  data () {
    const validateId = (rule, value, callback) => {
      if (value !== '' && !this.idRegEx.test(value)) {
        this.dupCheckDisabled = true
        callback(new Error(this.$t('validation.invalid_id')))
      } else {
        this.dupCheckDisabled = false
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
        user_id: '',
        user_pwd: '',
        user_name: '',
        country_code: '+82',
        phone_number: '',
        email: '',
        system_lang: '',
        sms_notice_check: 'N',
        email_notice_check: 'N',
        memo: '',
        password_gen: 'N'
      },
      user_type: 'admin', // for id duplicate check
      uploadedFile: null, // avatar uploaded file
      validate_rule: {
        // form validation rules
        user_id: [
          {
            required: true,
            message: this.$t('validation.id_required'),
            trigger: 'blur'
          },
          { validator: validateId, trigger: 'blur' }
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
            message: this.$t('validation.name_required'),
            trigger: 'blur'
          }
        ],
        phone_number: [{ validator: validatePhone, trigger: 'blur' }],
        email: [
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
        memo: [
          {
            min: 0,
            max: 300,
            message: this.$t('validation.memo_exceed_maxleng'),
            trigger: 'blur'
          }
        ]
      },
      rules: {
        // form validation rules
        user_id: [
          {
            required: true,
            message: this.$t('validation.id_required'),
            trigger: 'blur'
          },
          { validator: validateId, trigger: 'blur' }
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
            message: this.$t('validation.name_required'),
            trigger: 'blur'
          }
        ],
        phone_number: [{ validator: validatePhone, trigger: 'blur' }],
        email: [
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
        memo: [
          {
            min: 0,
            max: 300,
            message: this.$t('validation.memo_exceed_maxleng'),
            trigger: 'blur'
          }
        ]
      },
      rules_expt_pwd: {
        // form validation rules
        user_id: [
          {
            required: true,
            message: this.$t('validation.id_required'),
            trigger: 'blur'
          },
          { validator: validateId, trigger: 'blur' }
        ],
        user_name: [
          {
            required: true,
            message: this.$t('validation.name_required'),
            trigger: 'blur'
          }
        ],
        phone_number: [{ validator: validatePhone, trigger: 'blur' }],
        email: [
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
        memo: [
          {
            min: 0,
            max: 300,
            message: this.$t('validation.memo_exceed_maxleng'),
            trigger: 'blur'
          }
        ]
      },
      loading: false
    }
  },
  methods: {
    onUseridChange (id) {
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
    onPassChange (pass) {
      this.form.user_pwd = pass
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
    changeAvatarUrl (file) {
      this.uploadedFile = file
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
    passwordGenChange (passwordGenNotify) {
      if (passwordGenNotify) {
        // this.validate_rule = this.rules_expt_pwd
        this.$refs.adminRegForm.clearValidate('user_pwd')
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
          if (this.uploadedFile != null) {
            formData.append('file', this.uploadedFile)
          }
          for (const key in this.form) {
            formData.append(key, this.form[key])
          }
          this.loading = true

          this.$axios
            .post('/admin/register-admin', formData, {
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
                this.$router.push('/admin')
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
  border-right: 1px solid $gray30;
}

::v-deep {
  .el-input__inner {
    height: $inputBoxHeight;
  }
}
</style>
