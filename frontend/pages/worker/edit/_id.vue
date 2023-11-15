<template>
  <div class="edit-container">
    <div class="page-title">
      {{ $t('worker.detail') }}
    </div>
    <el-card v-loading="loading" class="box-card">
      <el-form ref="workerEditForm" :model="form" :rules="rules" label-width="160px" label-position="left">
        <el-row>
          <el-col :md="18" :lg="18" class="left-container">
            <el-form-item :label="$t('label.account_type')">
              <span class="account-type">{{ workerTypes[form.user_type] }}</span>
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
          </el-col>
          <el-col :md="6" :lg="6" class="avatar-container">
            <image-upload-item :image-url="form.avatar" @avatarChanged="changeAvatarUrl" />
          </el-col>
        </el-row>
        <el-row>
          <el-col :lg="24" class="bottom-container">
            <el-form-item
              :label="$t('label.worklang')"
              class="work-lang"
              prop="work_lang"
            >
              <el-select
                v-if="form.user_type != 'translator'"
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
              <div v-else class="trans-item-div">
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
            <el-form-item :label="$t('worker.correct_rate')" class="correct-rate" prop="correction_rate">
              <div class="correct-rate">
                <el-input v-model="form.correction_rate" type="number"></el-input>
                {{ $t('worker.correct_rate_desc') }}
              </div>
            </el-form-item>
            <el-form-item :label="$t('worker.sim_work_qty')" class="sim-work-qty" prop="can_work">
              <div class="sim-work-qty">
                <el-input v-model="form.can_work" type="number"></el-input> {{ $t('worker.sim_qty_desc') }}
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
            <el-form-item :label="$t('label.tag')" class="tags">
              <el-select
                v-model="form.tags"
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
              <el-button type="primary" class="btn-save" :disabled="this.loading" @click="onSubmit('workerEditForm')">
                <span>{{ $t('common.save') }}</span>
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
import ImageUploadItem from '@/components/common/ImageUploadItem.vue'
import LangTagPair from '@/components/common/LangTagPair'

export default {
  // middleware: ['auth', 'auth-admin'],
  middleware: ['auth', 'stats'],
  layout: 'detail',
  components: {
    InputWithIcon,
    CustomCheckBox,
    ImageUploadItem,
    LangTagPair
  },
  mixins: [global],
  validate ({ params }) {
    // Must be a number
    return /^\d+$/.test(params.id)
  },
  async asyncData ({ $axios, params, error }) {
    const workerId = params.id
    try {
      const response = await $axios.post('/worker/detail', { id: workerId })
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
      file: null,
      worklang: [],
      orglang: [],
      translang: [],
      selOrgLang: '',
      selTransLang: '',
      langPairs: [],
      /** for validation */
      rules: {
        user_name: [
          { required: true, message: this.$t('validation.name_required'), trigger: 'blur' }
        ],
        phone_number: [
          { required: true, message: this.$t('validation.phone_required'), trigger: 'blur' },
          { validator: validatePhone, trigger: 'blur' }
        ],
        email: [
          { required: true, message: this.$t('validation.email_required'), trigger: 'blur' },
          { type: 'email', message: this.$t('validation.invalid_email'), trigger: 'blur' }
        ],
        system_lang: [
          { required: true, message: this.$t('validation.syslang_required'), trigger: 'change' }
        ],
        correction_rate: [
          { required: true, message: this.$t('validation.correct_rate_required'), trigger: 'blur' }
        ],
        can_work: [
          { required: true, message: this.$t('validation.sim_qty_required'), trigger: 'blur' }
        ],
        memo: [
          { min: 0, max: 300, message: this.$t('validation.memo_exceed_maxleng'), trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  mounted () {
    if (this.form.country_code === '+81') {
      this.smsDisabled = true
    } else {
      this.smsDisabled = false
    }
    this.setWorkLang()
    if (this.form.user_type === 'translator') {
      this.setLangPairs()
    }
  },
  methods: {
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
    changeAvatarUrl (file) {
      this.file = file
    },
    setWorkLang () {
      for (let i = 0; i < this.form.working_languages.length; i++) {
        this.worklang.push(this.form.working_languages[i].id)
      }
    },
    setLangPairs () {
      for (let i = 0; i < this.form.working_languages.length; i++) {
        this.orglang.push(this.form.working_languages[i].original.id)
        this.translang.push(this.form.working_languages[i].translate.id)
        this.langPairs.push({ orglang: this.form.working_languages[i].original.name, translang: this.form.working_languages[i].translate.name })
      }
    },
    /** Add lang pair in case of 'translator' */
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
        const dupPairs = this.langPairs.filter(langPair => langPair.orglang === this.getLangName(this.selOrgLang) && langPair.translang === this.getLangName(this.selTransLang))
        if (dupPairs.length > 0) {
          this.$message({
            message: this.$t('validation.dup_lang_pair'),
            type: 'error'
          })
          return false
        }
        this.orglang.push(this.selOrgLang)
        this.translang.push(this.selTransLang)
        this.langPairs.push({ orglang: this.getLangName(this.selOrgLang), translang: this.getLangName(this.selTransLang) })
        this.selOrgLang = ''
        this.selTransLang = ''
      }
    },
    langPairRemoved (index) {
      this.langPairs.splice(index, 1)
      this.orglang.splice(index, 1)
      this.translang.splice(index, 1)
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
          const exclusionKeys = ['avatar', 'tags', 'working_languages']
          for (const key in this.form) {
            if (exclusionKeys.includes(key)) {
              continue
            }
            formData.append(key, this.form[key])
          }
          for (let i = 0; i < this.worklang.length; i++) {
            formData.append('working_languages[]', this.worklang[i])
          }
          for (let i = 0; i < this.orglang.length; i++) {
            formData.append('original_languages[]', this.orglang[i])
          }
          for (let i = 0; i < this.translang.length; i++) {
            formData.append('translate_languages[]', this.translang[i])
          }
          for (let i = 0; i < this.form.tags.length; i++) {
            formData.append('tags[]', this.form.tags[i])
          }
          this.loading = true
          this.$axios.post('/worker/register-worker', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }).then((resp) => {
            const { errorCode } = resp.data
            if (errorCode === 0) {
              this.loading = false
              this.$notify({
                title: this.$t('common.success'),
                message: this.$t('common.register_success'),
                type: 'success'
              })
              this.$router.push('/worker/detail/' + this.form.id)
            } else if (errorCode === 11) {
              this.$notify({
                title: this.$t('common.error'),
                message: this.$t('common.id_duplicated'),
                type: 'error'
              })
            } else {
              this.loading = false
              this.$notify({
                title: this.$t('common.fail'),
                message: this.$t('common.invalid_param'),
                type: 'error'
              })
            }
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.bottom-container {
  .el-tag {
    margin-right: 10px;
  }
  .trans-item-div {
    display: flex;
    .el-icon-right {
      margin-left: 5px;
      margin-right: 5px;
    }
  }
  .work-lang .el-select {
    width: 65%;
  }
  .correct-rate .el-input, .sim-work-qty .el-input {
    width: 60px;
  }
  .tags .el-select{
    width: 100%;
  }
  .add-lang-pair {
    margin-left: 10px;
    background-color: $blue50;
    border-radius: $formControlBorderRadius;
  }
}
::v-deep {
  .correct-rate, .sim-work-qty, .auto-notify {
    .el-form-item__label {
      line-height: $formLabelLineHeight !important;
      margin-top: $formLabelMgTop !important;
    }
  }
}
</style>
