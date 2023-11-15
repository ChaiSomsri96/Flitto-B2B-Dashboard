<template>
  <div class="edit-container">
    <div class="page-title">
      {{ $t('manager.detail') }}
    </div>
    <el-card v-loading="loading" class="box-card">
      <el-form
        ref="managerEditForm"
        :model="form"
        :rules="rules"
        label-width="180px"
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
              <span class="account-type">{{ $t('user_type.manager') }}</span>
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

            <!-- 관리대상 요청자 -->
            <el-form-item :label="$t('manager.requester')" class="tags">
              <el-select
                v-model="form.requesters"
                multiple
                filterable
                default-first-option
                :placeholder="$t('placeholder.requester_input')"
              >
                <el-option
                  v-for="item in requesterList"
                  :key="item.id"
                  :label="item.user_name + '(' + item.user_id + ')'"
                  :value="item.id"
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

            <!-- memo -->
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
              v-if="$auth.user.user_type == 2"
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
                @click="onSubmit('managerEditForm')"
              >
                <span>{{ $t('common.save') }}</span>
                <i class="el-icon-right"></i>
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="6" class="avatar-container">
            <image-upload-item
              :image-url="form.avatar"
              @avatarChanged="changeAvatarUrl"
            />
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import InputWithIcon from '@/components/common/InputWithIcon.vue'
import CustomCheckBox from '@/components/common/CustomCheckBox.vue'
import global from '@/mixin/global'
export default {
  // middleware: ['auth', 'auth-admincom'],
  middleware: ['auth', 'stats'],
  layout: 'detail',
  components: {
    InputWithIcon,
    CustomCheckBox
  },
  mixins: [global],
  async asyncData ({ $axios, params, error }) {
    const managerId = params.id
    try {
      const response = await $axios.post('/manager/detail', {
        id: managerId
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
    /** custom validators */
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
      user_type: 'manager',
      companyList: [],
      requesterList: [],
      loading: false,
      file: null,
      // requesters: [],
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
      }
    }
  },
  created () {
    this.getRequesterList()
  },
  methods: {
    changeAvatarUrl (file) {
      this.file = file
    },
    async getRequesterList () {
      try {
        const companyId = this.$auth.user.user_type === 1 ? this.form.company_data.id : this.$auth.user.id
        const resp = await this.$axios.post('/requester/get-requester-list', {
          search: { company_ids: [companyId] }
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
            'company_data',
            'requesters',
            'requester_names'
          ]
          for (const key in this.form) {
            if (exclusionKeys.includes(key)) {
              continue
            }
            formData.append(key, this.form[key])
          }
          for (let i = 0; i < this.form.requesters.length; i++) {
            formData.append('requesters[]', this.form.requesters[i])
          }
          formData.append('company_id', (this.$auth.user.user_type === 1 ? this.form.company_data.id : this.$auth.user.id))
          this.$axios
            .post('/manager/register-manager', formData, {
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
                this.$router.push('/manager/detail/' + this.form.id)
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

.left-container {
    .account-sale .el-input,
    .free-req-count .el-input {
        width: 60px;
    }
    .tags .el-select {
        width: 50%;
    }
}
.el-form-item:first-child {
    text-align: left;
    .account-type {
        font-size: 15px;
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

</style>
