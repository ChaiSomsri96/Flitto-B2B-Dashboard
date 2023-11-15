<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('worker.add') }}
    </div>
    <el-card v-loading="loading" class="form-container box-card">
      <el-form
        ref="workerRegForm"
        :model="form"
        :rules="rules"
        label-width="180px"
        label-position="left"
      >
        <el-row>
          <el-col :lg="18" class="left-container">
            <el-form-item :label="$t('label.account_type')">
              <el-select v-model="user_type">
                <el-option
                  v-for="item in userTypes"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
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
          </el-col>
          <el-col :lg="6" class="avatar-container">
            <image-upload-item @avatarChanged="changeAvatarUrl" />
          </el-col>
        </el-row>
        <el-row>
          <el-col :lg="24" class="bottom-container">
            <el-form-item
              v-if="user_type !== 'translator'"
              :label="$t('label.worklang')"
              class="work-lang"
              prop="worklang"
            >
              <el-select
                v-model="worklang"
                multiple
                clearable
                :placeholder="$t('placeholder.worklang')"
              >
                <el-option
                  v-for="item in workLangs"
                  :key="item.id"
                  :label="$t('common.' + item.name)"
                  :value="item.id"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item v-else :label="$t('label.worklang')">
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
              :label="$t('worker.correct_rate')"
              prop="correction_rate"
              class="correct-rate"
            >
              <el-input v-model="form.correction_rate" type="number"></el-input>
              {{ $t('worker.correct_rate_desc') }}
            </el-form-item>
            <el-form-item
              :label="$t('worker.sim_work_qty')"
              prop="can_work"
              class="sim-work-qty"
            >
              <el-input v-model="form.can_work" type="number"></el-input>
              {{ $t('worker.sim_qty_desc') }}
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
            <el-form-item :label="$t('label.tag')" class="tags">
              <el-select
                v-model="tags"
                multiple
                filterable
                allow-create
                default-first-option
                :placeholder="$t('placeholder.tag')"
              >
                <el-option
                  v-for="(item, i) in tagOptions"
                  :key="i"
                  :label="item.name"
                  :value="item.name"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('label.admin_memo')" prop="memo">
              <el-input
                v-model="form.memo"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 4 }"
                maxlength="300"
              >
              </el-input>
            </el-form-item>
            <el-form-item label-width="0px">
              <el-button
                type="primary"
                class="btn-save"
                :disabled="this.loading"
                @click="onSubmit('workerRegForm')"
              >
                <span>{{ $t('common.register') }}</span>
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
import ImageUploadItem from '@/components/common/ImageUploadItem'
import LangTagPair from '@/components/common/LangTagPair'

export default {
  name: 'AddWorker',
  // middleware: ['auth', 'auth-admin'],
  middleware: ['auth', 'stats'],
  components: {
    ImageUploadItem,
    LangTagPair
  },
  mixins: [global],
  data () {
    const validateId = (rule, value, callback) => {
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
      form: {
        user_id: '',
        user_pwd: '',
        user_name: '',
        country_code: '+82',
        phone_number: '',
        email: '',
        system_lang: '',
        correction_rate: '',
        can_work: '',
        sms_notice_check: 'N',
        email_notice_check: 'N',
        memo: '',
        password_gen: 'N'
      },
      user_type: 'tc',
      worklang: [],
      // required when usertype === translator
      orglang: [],
      translang: [],
      selOrgLang: '',
      selTransLang: '',
      tags: [],
      userTypes: [
        { value: 'tc', label: this.$t('user_type.tc') },
        { value: 'translator', label: this.$t('user_type.translator') },
        { value: 'reviewer', label: this.$t('user_type.reviewer') }
      ],
      langPairs: [], // for language pairs dom render
      uploadedFile: null, // avatar uploaded file
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
          }
        ],
        user_name: [
          {
            required: true,
            message: this.$t('validation.name_required'),
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
        ],
        /* worklang: [
          { required: true, message: this.$t('validation.worklang_required'), trigger: 'change' }
        ], */
        correction_rate: [
          {
            required: true,
            message: this.$t('validation.correct_rate_required'),
            trigger: 'blur'
          }
        ],
        can_work: [
          {
            required: true,
            message: this.$t('validation.sim_qty_required'),
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
      },
      loading: false
    }
  },
  methods: {
    langPairRemoved (index) {
      this.langPairs.splice(index, 1)
      this.orglang.splice(index, 1)
      this.translang.splice(index, 1)
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
      }
    },
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
        this.$refs.workerRegForm.clearValidate('user_pwd')
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
          const formData = new FormData()
          if (this.uploadedFile != null) {
            formData.append('file', this.uploadedFile)
          }
          for (const key in this.form) {
            formData.append(key, this.form[key])
          }
          formData.append('user_type', this.user_type)
          for (let i = 0; i < this.worklang.length; i++) {
            formData.append('working_languages[]', this.worklang[i])
          }
          for (let i = 0; i < this.orglang.length; i++) {
            formData.append('original_languages[]', this.orglang[i])
          }
          for (let i = 0; i < this.translang.length; i++) {
            formData.append('translate_languages[]', this.translang[i])
          }
          for (let i = 0; i < this.tags.length; i++) {
            formData.append('tags[]', this.tags[i])
          }
          this.loading = true
          this.$axios
            .post('/worker/register-worker', formData, {
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
                this.$router.push('/worker')
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

.bottom-container {
  .work-lang .el-select {
    width: 65%;
  }
  .tags .el-select {
    width: 50%;
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
}

::v-deep {
  .correct-rate,
  .sim-work-qty {
    .el-input {
      width: 80px;
    }
    .el-form-item__label {
      line-height: $formLabelLineHeight;
      margin-top: $formLabelMgTop;
    }
  }
  .el-input__inner {
    height: $inputBoxHeight;
  }
}
</style>
