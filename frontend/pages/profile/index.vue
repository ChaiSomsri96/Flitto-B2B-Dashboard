<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('sidebar.my_profile') }}
    </div>
    <el-card class="box-card">
      <el-form ref="profileForm" :rules="rules" :model="form" label-width="200px" label-position="left">
        <el-row>
          <el-col :lg="18" class="info-container">
            <el-form-item :label="$t('label.account_type')">
              <span v-if="$auth.user.user_type == 1" class="account-type">{{ $t('user_type.admin') }}</span>
              <span v-if="$auth.user.user_type == 2" class="account-type">{{ $t('user_type.company') }}</span>
              <span v-if="$auth.user.user_type == 3" class="account-type">{{ $t('user_type.requester') }}</span>
              <span v-if="$auth.user.user_type == 4" class="account-type">{{ $t('user_type.tc') }}</span>
              <span v-if="$auth.user.user_type == 5" class="account-type">{{ $t('user_type.translator') }}</span>
              <span v-if="$auth.user.user_type == 6" class="account-type">{{ $t('user_type.reviewer') }}</span>
              <span v-if="$auth.user.user_type == 7" class="account-type">{{ $t('user_type.manager') }}</span>
            </el-form-item>
            <div class="id-item">
              <el-form-item :label="$t('label.userid')">
                <span class="account-type">
                  {{ form.user_id }}
                </span>
              </el-form-item>
            </div>
            <el-form-item :label="$t('label.password')">
              <el-button type="primary" class="btn-password" @click="dialogFormVisible=true">
                <span class="mr5">{{ $t('common.password_change') }}</span>
                <i class="el-icon-right"></i>
              </el-button>
            </el-form-item>
            <el-form-item v-if="$auth.user.user_type == '2' || $auth.user.user_type == '7'" :label="$t('label.company_name')">
              <span class="account-type">{{ form.company_name }}</span>
            </el-form-item>

            <el-form-item v-if="$auth.user.user_type == '2'" :label="$t('label.contact_name')">
              <input-with-icon
                :input-value="form.user_name"
                :placeholder="$t('company.contact_name')"
                :icon-name="'person-24'"
                @inputChanged="onContactNameChange"
              />
            </el-form-item>

            <el-form-item v-if="$auth.user.user_type == '7'" :label="$t('label.name')">
              <input-with-icon
                :input-value="form.user_name"
                :placeholder="$t('placeholder.name')"
                :icon-name="'person-24'"
                @inputChanged="onNameChange"
              />
            </el-form-item>
            <el-form-item v-if="$auth.user.user_type != '2' && $auth.user.user_type != '7'" :label="$t('label.name')" prop="user_name">
              <input-with-icon
                :input-value="form.user_name"
                :placeholder="$t('placeholder.name')"
                :icon-name="'person-24'"
                @inputChanged="onNameChange"
              />
            </el-form-item>
            <el-form-item :label="$t('label.phone')" prop="phone">
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
                  :input-value="form.phone"
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
            <el-form-item v-if="$auth.user.user_type == 3" :label="$t('label.youtube_account')">
              <span v-if="form.youtube_connected_check == 'N'" class="youtube-login-desc">{{ $t('label.youtube_login_desc') }}</span>
              <span v-else class="youtube-logout-desc">{{ $t('label.youtube_logout_desc', { googleName: form.google_name, googleEmail: form.google_email }) }}</span>
              <el-button v-if="form.youtube_connected_check == 'N'" type="primary" plain @click="youtubeLogin">
                <span>{{ $t('label.youtube_login') }}</span>
              </el-button>
              <el-button v-else type="primary" plain @click="youtubeLogout">
                <span>{{ $t('label.youtube_logout') }}</span>
              </el-button>
            </el-form-item>
            <el-form-item :label="$t('label.syslang')" prop="system_language">
              <el-select v-model="form.system_language" :placeholder="$t('placeholder.syslang')">
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
              v-if="$auth.user.user_type == '5'"
              :label="$t('profile.work_lang')"
            >
              <template v-if="form.translate_pairs">
                <div class="trans-item-div">
                  <div v-for="{original, translate, index} in form.translate_pairs" :key="index" class="trans-pair">
                    <span class="trans-original">
                      {{ $t('common.' + original) }}
                    </span>
                    <i class="el-icon-caret-right"></i>
                    <span class="trans-tranlsate">
                      {{ $t('common.' + translate) }}
                    </span>
                  </div>
                </div>
              </template>
              <template v-else>
                -
              </template>
            </el-form-item>

            <el-form-item
              v-if="$auth.user.user_type == '2' || $auth.user.user_type == '7'"
              :label="$t('profile.service_lang_pair')"
            >
              <template v-if="form.services">
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
              </template>
              <template v-if="form.translate_pairs">
                <div class="trans-item-div">
                  <div v-for="{original, translate, index} in form.translate_pairs" :key="index" class="trans-pair">
                    <span class="trans-original">
                      {{ $t('common.' + original) }}
                    </span>
                    <i class="el-icon-caret-right"></i>
                    <span class="trans-tranlsate">
                      {{ $t('common.' + translate) }}
                    </span>
                  </div>
                </div>
              </template>
              <template v-else>
                -
              </template>
            </el-form-item>
            <el-form-item v-if="$auth.user.user_type == '3'" :label="$t('label.translang_defval')">
              <div class="trans-item-div">
                <el-button type="success" class="btn-org-lang" @click="orgDialog = true">
                  <template v-if="selOrgLang && workLangs.length > 0">
                    {{ getLangName(selOrgLang) }}
                  </template>
                  <template v-else>
                    {{ $t('placeholder.orglang') }}
                  </template>
                </el-button>
                <div class="right-icon">
                  <i class="el-icon-caret-right"></i>
                </div>
                <el-button type="warning" class="btn-trans-lang" :disabled="!selOrgLang ? true: false" @click="transDialog = true">
                  <template v-if="selTransLangs.length > 0">
                    {{ transLangNames }}
                  </template>
                  <template v-else>
                    {{ $t('placeholder.translang') }}
                  </template>
                </el-button>
              </div>
            </el-form-item>
            <el-form-item v-if="$auth.user.user_type == '4' || $auth.user.user_type == '6'" :label="$t('label.worklang')">
              <div class="trans-item-div">
                <template v-if="form.working_languages">
                  <div v-for="(lang, index) in form.working_languages" :key="index" class="trans-pair">
                    <span class="trans-original">
                      {{ $t('common.' + lang) }}
                    </span>
                  </div>
                </template>
                <template v-else>
                  -
                </template>
              </div>
            </el-form-item>
            <el-form-item :label="$t('label.auto_notify')">
              <div class="auto-notify-setting">
                <custom-check-box
                  :is-checked="form.is_sms == 'Y' ? true : false"
                  :label="$t('common.sms_notify')"
                  :border="true"
                  :disabled="smsDisabled"
                  @checkChanged="onSmsNotifyChange"
                >
                </custom-check-box>
                <custom-check-box
                  :is-checked="form.is_email == 'Y' ? true : false"
                  :label="$t('common.email_notify')"
                  :border="true"
                  @checkChanged="onEmailNotifyChange"
                >
                </custom-check-box>
              </div>
            </el-form-item>
            <el-form-item v-if="$auth.user.user_type == '3'" :label="$t('common.other')" prop="extra">
              <el-input
                v-model="form.extra"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 4}"
              >
              </el-input>
            </el-form-item>
            <el-form-item label-width="0px">
              <el-button type="primary" class="btn-save" @click="onSubmit('profileForm')">
                <span class="mr5">{{ $t('common.save') }}</span>
                <i class="el-icon-right"></i>
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="6" class="avatar-container">
            <image-upload-item :image-url="form.avatar" @avatarChanged="changeAvatarUrl" />
            <image-upload-item v-if="$auth.user.user_type == 2" :company-logo="true" :image-url="form.logo" @avatarChanged="changeLogo" />
          </el-col>
        </el-row>
      </el-form>
    </el-card>
    <el-dialog
      :title="$t('common.password_change')"
      :visible.sync="dialogFormVisible"
      class="password-change-dialog"
      :before-close="handleClose"
      @close="resetPassForm('passForm')"
    >
      <el-form
        ref="passForm"
        :rules="passRules"
        :model="password"
        label-position="left"
        label-width="150px"
      >
        <el-form-item :label="$t('common.cur_password')" prop="current">
          <el-input v-model="password.current" type="password" />
        </el-form-item>
        <el-form-item :label="$t('common.new_password')" prop="new">
          <el-input v-model="password.new" type="password" />
        </el-form-item>
        <el-form-item :label="$t('common.con_password')" prop="confirm">
          <el-input v-model="password.confirm" type="password" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <!-- <el-button @click="dialogFormVisible = false">
          {{ $t('common.cancel') }}
        </el-button> -->
        <el-button type="primary" @click="changePassword()">
          {{ $t('common.save') }}
        </el-button>
      </div>
    </el-dialog>
    <el-dialog
      :title="$t('placeholder.orglang')"
      :visible.sync="orgDialog"
      width="60%"
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
      width="60%"
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
          {{ $t('requester.selected_lang_count', { n: checkedCount }) }}
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
import { mapGetters } from 'vuex'
import InputWithIcon from '@/components/common/InputWithIcon.vue'
import CustomCheckBox from '@/components/common/CustomCheckBox.vue'
import global from '@/mixin/global'
import langPairs from '@/mixin/langPairs'
export default {
  layout: 'default',
  middleware: ['auth', 'stats'],
  components: {
    InputWithIcon,
    CustomCheckBox
  },
  mixins: [global, langPairs],
  async asyncData ({ $axios }) {
    try {
      const resp = await $axios.post('/basic/get-my-info')
      if (resp.data.errorCode === 0) {
        const userInfo = resp.data.data
        return {
          form: userInfo
        }
      }
    } catch (err) {
      console.log(err)
    }
  },
  data () {
    const validateNewPass = (rule, value, callback) => {
      if (this.$auth.user.user_type === 1) {
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
    const validateConPass = (rule, value, callback) => {
      if (value !== this.password.new) {
        callback(new Error(this.$t('validation.pass_not_match')))
      } else {
        callback()
      }
    }
    const validatePhone = (rule, value, callback) => {
      const regEx = /^\d+(-\d+)*$/
      if (value !== '' && !regEx.test(value)) {
        callback(new Error(this.$t('validation.invalid_phone_num')))
      }
      callback()
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
      youtubeConnected: false,
      dialogFormVisible: false, // for password change dialog
      password: {
        current: '',
        new: '',
        confirm: ''
      },
      rules: {
        user_name: [
          { required: true, message: this.$t('validation.name_required'), trigger: 'blur' }
        ],
        system_language: [
          { required: true, message: this.$t('validation.syslang_required'), trigger: 'change' }
        ],
        phone: [
          { validator: validatePhone, trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: this.$t('validation.invalid_email'), trigger: 'blur' }
        ]
      },
      passRules: {
        current: [
          { required: true, message: this.$t('validation.cur_pass_required'), trigger: 'blur' }
        ],
        new: [
          { required: true, message: this.$t('validation.new_pass_required'), trigger: 'blur' },
          { validator: validateNewPass, trigger: 'blur' }
        ],
        confirm: [
          { required: true, message: this.$t('validation.con_pass_required'), trigger: 'blur' },
          { validator: validateConPass, trigger: 'blur' }
        ]
      },
      checkAll: false,
      uploadedFile: null,
      logo: null
    }
  },
  computed: {
    ...mapGetters(['loggedUser'])
  },
  watch: {
    /** 전화번호국번이 일본(+81)으로 선택되는 경우 알림톡/sms 비활성화 */
    form: {
      handler (newVal) {
        if (newVal.country_code === '+81' || newVal.country_code === '81') {
          this.form.is_sms = false
          this.smsDisabled = true
        } else {
          this.smsDisabled = false
        }
      },
      deep: true
    }
  },
  created () {
    if (this.$auth.user.user_type === 3) {
      this.getCompanyLangPairs()
      this.setOrgLang()
      this.currentTransLangList()
    }
    if (this.$auth.user.user_type > 3 && this.$auth.user.user_type < 7) {
      this.rules.email.unshift({
        required: true,
        message: this.$t('validation.email_required'),
        trigger: 'blur'
      })
      this.rules.phone.unshift({
        required: true,
        message: this.$t('validation.phone_required'),
        trigger: 'blur'
      })
    }
    if (this.form.country_code === '+81') {
      this.smsDisabled = true
    } else {
      this.smsDisabled = false
    }
    // this.getUserInfo()
  },
  methods: {
    setOrgLang () {
      if (this.form.original_language) {
        this.orglang = this.form.original_language.id
        this.selOrgLang = this.form.original_language.id
      }
    },
    currentTransLangList () {
      if (this.form.working_languages) {
        for (let i = 0; i < this.form.working_languages.length; i++) {
          // this.transLangCheckList.push(this.form.working_languages[i].name)
          // this.selTransLangs.push(this.form.working_languages[i].name)
          this.transLangCheckList.push(this.$t('common.' + this.form.working_languages[i].name))
          this.selTransLangs.push(this.$t('common.' + this.form.working_languages[i].name))
        }
        this.checkedCount = this.selTransLangs.length
      }
    },
    changeAvatarUrl (file) {
      this.uploadedFile = file
    },
    changeLogo (file) {
      this.logo = file
    },
    changePassword () {
      this.$refs.passForm.validate((valid) => {
        if (valid) {
          this.loading = true
          this.$axios
            .post('/basic/change-password', { new_password: this.password.new, old_password: this.password.current })
            .then((resp) => {
              const { errorCode } = resp.data
              this.loading = false
              if (errorCode === 0) {
                this.$notify({
                  title: this.$t('common.success'),
                  message: this.$t('common.udpate_password_success'),
                  type: 'success'
                })
                this.dialogFormVisible = false
                this.resetPassForm('passForm')
              } else if (errorCode === 1) {
                this.$notify({
                  title: this.$t('common.fail'),
                  message: this.$t('profile.old_pass_incorrect'),
                  type: 'error'
                })
              } else {
                this.$notify({
                  title: this.$t('common.fail'),
                  message: this.$t('common.update_password_fail'),
                  type: 'error'
                })
              }
            })
        }
      })
    },
    handleClose (done) {
      this.$confirm(this.$t('profile.confirm_close_dialog'), {
        confirmButtonText: this.$t('common.ok'),
        cancelButtonText: this.$t('common.no')
      }).then(() => {
        done()
      }).catch(() => {})
    },
    resetPassForm (formName) {
      this.$refs[formName].resetFields()
    },
    onUseridChange (id) {
      this.form.user_id = id
    },
    /* onPassChange (pwd) {
      this.form.password = pwd
    }, */
    onNameChange (name) {
      this.form.user_name = name
    },
    onPhoneChange (phone) {
      this.form.phone = phone
    },
    onEmailChange (email) {
      this.form.email = email
    },
    onSyslangChange (sysLang) {
      this.form.sysLang = sysLang
    },
    onSmsNotifyChange (smsNotify) {
      if (smsNotify) {
        this.form.is_sms = 'Y'
      } else {
        this.form.is_sms = 'N'
      }
    },
    onEmailNotifyChange (emailNotify) {
      if (emailNotify) {
        this.form.is_email = 'Y'
      } else {
        this.form.is_email = 'N'
      }
    },
    onSubmit (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.$confirm(this.$t('common.save_confirm'), this.$t('common.warning'), {
            confirmButtonText: this.$t('common.yes'),
            cancelButtonText: this.$t('common.no'),
            type: 'warning'
          }).then(() => {
            const formData = new FormData()
            if (this.uploadedFile != null) {
              formData.append('file', this.uploadedFile)
            }
            if (this.logo != null) {
              formData.append('logo', this.logo)
            }
            formData.append('user_name', this.form.user_name)
            formData.append('country_code', this.form.country_code)
            formData.append('phone_number', this.form.phone)
            formData.append('email', this.form.email)
            formData.append('system_lang', this.form.system_language)
            formData.append('extra', this.form.extra)
            if (this.form.is_sms === 'Y') {
              formData.append('sms_notice_check', 'Y')
            } else {
              formData.append('sms_notice_check', 'N')
            }
            if (this.form.is_email === 'Y') {
              formData.append('email_notice_check', 'Y')
            } else {
              formData.append('email_notice_check', 'N')
            }

            if (this.$auth.user.user_type === 3 && this.form.youtube_connected_check === 'Y') { formData.append('youtube_apply_type', this.form.youtube_apply_type) }

            if (this.$auth.user.user_type === 3 && this.selOrgLang) {
              formData.append('original_language', this.selOrgLang)
              for (let i = 0; i < this.selTransLangs.length; i++) {
                formData.append('translate_languages[]', this.getTransLangId(this.selTransLangs[i]))
              }
            }
            this.$axios.post('/basic/update-my-info', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }).then(async (resp) => {
              const { errorCode, data } = resp.data
              if (errorCode === 0) {
                this.$store.dispatch('user/setName', data.user_name)
                this.$store.dispatch('user/setAvatar', data.avatar)
                if (this.$auth.user.user_type === 2) { // company case
                  this.$store.dispatch('user/setLogo', data.company_logo)
                }
                if (this.form.system_language.toLowerCase() !== this.$i18n.locale) {
                  await this.$i18n.setLocale(this.form.system_language.toLowerCase())
                  location.reload()
                }
                this.$notify({
                  title: this.$t('common.success'),
                  message: this.$t('common.save_success'),
                  type: 'success'
                })
              } else if (errorCode === 10) {
                this.$notify({
                  title: this.$t('common.fail'),
                  message: this.$t('validation.invalid_avatar'),
                  type: 'error'
                })
              }
            })
          }).catch(() => {
          })
        } else {
          return false
        }
      })
    },
    async youtubeLogin () {
      /** Directly get back the access_token and id_token */
      // const googleUser = await this.$gAuth.signIn()
      // console.log(googleUser.getAuthResponse())

      /** observe google login status, return true or false */
      // this.youtubeConnected = this.$gAuth.isAuthorized

      /** one-time code to generate access token and refresh token on the backend */
      try {
        const authCode = await this.$gAuth.getAuthCode()
        if (authCode) {
          const response = await this.$axios.post('/requester/get-auth-code', {
            code: authCode
          })
          const { errorCode, data } = response.data
          // after successful response
          if (errorCode === 0) {
            this.form.google_name = data.youtube_name
            this.form.google_email = data.youtube_email
            this.form.youtube_connected_check = 'Y'
            this.$message.success(this.$t('profile.youtube_connect_success'))
          } else {
            this.$message.error(this.$t('profile.youtube_connect_fail'))
            this.form.youtube_connected_check = 'N'
          }
        } else {
          this.$message.error(this.$t('profile.youtube_login_fail'))
          this.form.youtube_connected_check = 'N'
        }
      } catch (err) {
        console.log(err)
      }
    },
    async youtubeLogout () {
      try {
        await this.$gAuth.signOut()
        const resp = await this.$axios.post('/requester/revoke-token')
        const { errorCode } = resp.data
        if (errorCode === 0) {
          this.$message.success(this.$t('profile.youtube_disconnect_success'))
          this.form.google_name = ''
          this.form.google_email = ''
          this.form.youtube_connected_check = 'N'
        } else {
          this.$message.error(this.$t('profile.youtube_disconnect_fail'))
        }
      } catch {
      }
    },
    onContactNameChange (name) {
      this.form.user_name = name
    },
    async getUserInfo () {
      this.loading = true
      try {
        const resp = await this.$axios.post('/basic/get-my-info')
        if (resp.data.errorCode === 0) {
          const userInfo = resp.data.data
          this.form = userInfo
          if (this.$auth.user.user_type === 3) {
            this.setOrgLang()
            this.currentTransLangList()
          }
        }
        this.loading = false
      } catch (err) {
        console.log(err)
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.info-container {
  border-right: 1px solid $gray30;
  padding: $formContainerPadding;
  .tag-group {
    .el-tag {
      margin-right: 5px;
    }
  }
  .phone-item {
    display: flex;
    margin-bottom: 10px;
    .country-phone{
      flex: 1;
      .el-select {
        width: 40%;
        margin-right: 5%;
      }
      .el-input {
        float: right;
        width: 55%;
      }
    }
  }
  .el-form-item:first-child {
    // text-align: right;
    .account-type {
      font-size: $labelFontSize;
    }
  }
  .check-all {
    float: left;
    margin-right: 30px;
  }
  .add-lang-pair {
    margin-left: 10px;
    background-color: $blue50;
    border-radius: $formControlBorderRadius;
  }
  .icon_center{
    align-self: 'center';
  }
  .work-lang .el-select {
    width: 65%;
  }
  .youtube-login-desc {
    margin-right: 10px;
    color: #e88747;
  }
  .youtube-logout-desc {
    margin-right: 10px;
    color: #409eff;
  }
  .youtube-apply-type {
    margin-left: 10px;
    margin-right: 10px;
  }
  .el-tag {
    margin-right: 10px;
  }
  .trans-pair{
    margin-right: 14px;
    margin-bottom: 5px;
  }
  .trans-original{
    background: #67c23a;
    padding: 9px;
    border-radius: 4px;
    color: white;
  }
  .trans-tranlsate{
    background: #f56c6c;
    padding: 9px;
    border-radius: 4px;
    color: white;
  }
}
.trans-item-div {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
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

.lang-options {
  margin: 10px 0;
  width: 32%;
}

.trans-dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

::v-deep {
  .el-input__inner {
    height: $inputBoxHeight;
  }
  .el-dialog__body {
    border-top: 1px solid #dcdcdc;
    border-bottom: 1px solid #dcdcdc;
  }
  .password-change-dialog {
    .el-dialog__title {
      color: white;
      font-size: 18px;
    }
    .el-dialog__close {
      color:white;
    }
    .el-dialog__headerbtn {
      font-size: 18px;
    }
  }
}
</style>
