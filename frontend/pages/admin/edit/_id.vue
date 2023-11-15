<template>
  <div class="edit-container">
    <div class="page-title">
      {{ $t('admin.detail') }}
    </div>
    <el-card v-loading="loading" class="box-card">
      <el-form ref="adminEditForm" :model="form" :rules="rules" label-width="160px" label-position="left">
        <el-row>
          <el-col :md="18" :lg="18" class="left-container">
            <el-form-item :label="$t('label.account_type')">
              <span class="account-type">{{ $t('user_type.admin') }}</span>
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
            <el-form-item :label="$t('label.name')" prop="user_name">
              <input-with-icon
                :input-value="form.user_name"
                :icon-name="'person-24'"
                :placeholder="$t('placeholder.name')"
                @inputChanged="onNameChange"
              />
            </el-form-item>
            <el-form-item :label="$t('label.phone')" prop="phone_number">
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
              <el-select v-model="form.system_lang" :placeholder="$t('placeholder.syslang')">
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
            <el-form-item v-if="$auth.user.user_type == 1" :label="$t('label.admin_memo')">
              <el-input
                v-model="form.memo"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 4}"
                maxlength="300"
              >
              </el-input>
            </el-form-item>
            <el-form-item label-width="0px">
              <el-button type="primary" class="btn-save" :disabled="loading" @click="onSubmit('adminEditForm')">
                <span>{{ $t('common.save') }}</span>
                <i class="el-icon-right"></i>
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :md="6" :lg="6" class="avatar-container">
            <image-upload-item :image-url="form.avatar" @avatarChanged="changeAvatarUrl" />
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import edit from '@/mixin/edit'
import InputWithIcon from '@/components/common/InputWithIcon.vue'
import CustomCheckBox from '@/components/common/CustomCheckBox.vue'
export default {
  // middleware: ['auth', 'auth-admin'],
  middleware: ['auth', 'stats'],
  layout: 'detail',
  components: {
    InputWithIcon,
    CustomCheckBox
  },
  mixins: [edit],
  async asyncData ({ $axios, params, error }) {
    const adminId = params.id
    try {
      const response = await $axios.post('/admin/detail', { id: adminId })
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
      if (this.letterNumRegexPass(value) ||
      this.letterSpecRegexPass(value) ||
      this.numSpecRegexPass(value)) {
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
        user_pwd: [
          { validator: validatePass, trigger: 'blur' }
        ],
        user_name: [
          { required: true, message: this.$t('validation.name_required'), trigger: 'blur' }
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
      }
    }
  },
  methods: {
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
          const formData = new FormData()
          if (this.file != null) {
            formData.append('file', this.file)
          }
          const exclusionKeys = ['avatar']
          for (const key in this.form) {
            if (exclusionKeys.includes(key)) {
              continue
            }
            formData.append(key, this.form[key])
          }
          this.loading = true
          this.$axios.post('/admin/register-admin', formData, {
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
              this.$router.push('/admin/detail/' + this.form.id)
            } else {
              this.$notify({
                title: this.$t('common.fail'),
                message: this.$t('common.invalid_param'),
                type: 'error'
              })
            }
          }).catch((err) => {
            console.log(err)
            this.loading = false
          })
        }
      })
    }
  }
}
</script>
