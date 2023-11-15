<template>
  <div class="detail-container">
    <div class="page-title">
      {{ $t('worker.detail') }}
    </div>
    <el-card class="box-card">
      <el-form ref="workerDetailForm" :model="form" label-width="160px" label-position="left">
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
                :input-value="'-'"
                :icon-name="'lock-24'"
                :disabled="true"
              />
            </el-form-item>
            <el-form-item :label="$t('label.name')">
              <input-with-icon
                :input-value="form.user_name"
                :icon-name="'person-24'"
                :disabled="true"
                :placeholder="$t('placeholder.name')"
              />
            </el-form-item>
            <el-form-item :label="$t('label.phone')">
              <input-with-icon
                :input-value="form.country_code + form.phone_number"
                :icon-name="'call-24'"
                :disabled="true"
              />
            </el-form-item>
            <el-form-item :label="$t('label.email')">
              <input-with-icon
                :input-value="form.email"
                :icon-name="'mail-24'"
                :disabled="true"
                :placeholder="$t('placeholder.email')"
              />
            </el-form-item>
            <el-form-item :label="$t('label.syslang')">
              <input-with-icon
                :input-value="getSyslangName"
                :icon-name="'global'"
                :disabled="true"
              />
            </el-form-item>
          </el-col>
          <el-col :md="6" :lg="6" class="avatar-container">
            <img :src="form.avatar ? form.avatar : defaultAvatar" class="avatar" />
          </el-col>
        </el-row>
        <el-row>
          <el-col :lg="24" class="bottom-container">
            <el-form-item :label="$t('label.worklang')">
              <template v-if="form.working_languages.length > 0">
                <div v-if="form.user_type != 'translator'" class="tag-group">
                  <el-tag
                    v-for="item in form.working_languages"
                    :key="item.id"
                    type="success"
                    effect="dark"
                  >
                    {{ $t('common.' + item.name) }}
                  </el-tag>
                </div>
                <div v-else class="trans-item-div">
                  <div v-for="(item, i) in langPairs" :key="i">
                    <el-tag
                      type="info"
                      effect="dark"
                    >
                      {{ $t('common.' + item.orglang) }}
                    </el-tag>
                    <i class="el-icon-right"></i>
                    <el-tag
                      type="success"
                      effect="dark"
                    >
                      {{ $t('common.' + item.translang) }}
                    </el-tag>
                  </div>
                </div>
              </template>
              <template v-else>
                -
              </template>
            </el-form-item>
            <el-form-item :label="$t('worker.correct_rate')" class="correct-rate">
              <input-with-icon
                :input-value="form.correction_rate != undefined ? form.correction_rate + '%' : ''"
                :icon-name="'money'"
                :disabled="true"
              />
            </el-form-item>
            <el-form-item :label="$t('worker.sim_work_qty')" class="sim-work-qty">
              <input-with-icon
                :input-value="form.can_work"
                :icon-name="'request'"
                :disabled="true"
              />
            </el-form-item>
            <el-form-item :label="$t('label.auto_notify')" class="auto-notify">
              <div class="auto-notify-setting">
                <custom-check-box
                  :is-checked="form.sms_notice_check === 'Y' ? true : false"
                  :label="$t('common.sms_notify')"
                  :border="true"
                  :disabled="true"
                >
                </custom-check-box>
                <custom-check-box
                  :is-checked="form.email_notice_check === 'Y' ? true : false"
                  :label="$t('common.email_notify')"
                  :border="true"
                  :disabled="true"
                >
                </custom-check-box>
              </div>
            </el-form-item>
            <el-form-item :label="$t('label.tag')" class="tags">
              <div v-if="form.tags.length > 0" class="tag-group">
                <el-tag
                  v-for="(item, i) in form.tags"
                  :key="i"
                  type="info"
                  effect="dark"
                >
                  {{ item }}
                </el-tag>
              </div>
              <div v-else>
                -
              </div>
            </el-form-item>
            <el-form-item :label="$t('label.admin_memo')">
              <el-input
                v-model="form.memo"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 4}"
                :disabled="true"
                maxlength="300"
              >
              </el-input>
            </el-form-item>
            <el-form-item label-width="0px">
              <el-button type="primary" class="btn-modify" @click="onModify">
                <span>{{ $t('common.update') }}</span>
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

export default {
  // middleware: ['auth', 'auth-admin'],
  middleware: ['auth', 'stats'],
  layout: 'detail',
  components: {
    InputWithIcon,
    CustomCheckBox
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
    return {
      file: null,
      selOrgLang: '',
      selTransLang: '',
      langPairs: []
    }
  },
  computed: {
    getSyslangName () {
      return this.sysLangList.filter(lang => lang.value === this.form.system_lang)[0].label
    }
  },
  mounted () {
    if (this.form.user_type === 'translator') {
      this.setLangPairs()
    }
  },
  methods: {
    setLangPairs () {
      for (let i = 0; i < this.form.working_languages.length; i++) {
        this.langPairs.push({ orglang: this.form.working_languages[i].original.name, translang: this.form.working_languages[i].translate.name })
      }
    },
    onModify () {
      this.$router.push('/worker/edit/' + this.$route.params.id)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.bottom-container {
  padding: 0px 20px;
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
  .correct-rate, .sim-work-qty {
    .el-input {
      width: 100px;
    }
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
