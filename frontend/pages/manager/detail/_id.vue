<template>
  <div class="detail-container">
    <div class="page-title">
      {{ $t('manager.detail') }}
    </div>
    <el-card class="box-card">
      <el-form
        ref="managerDetailForm"
        :model="form"
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

            <el-form-item :label="$t('label.password')">
              <input-with-icon
                :input-value="'-'"
                :icon-name="'lock-24'"
                :disabled="true"
              />
            </el-form-item>

            <el-form-item :label="$t('label.user_name')">
              <input-with-icon
                :input-value="form.user_name"
                :icon-name="'person-24'"
                :disabled="true"
                :placeholder="$t('placeholder.name')"
              />
            </el-form-item>

            <el-form-item :label="$t('label.phone')">
              <input-with-icon
                :input-value="
                  form.phone_number
                    ? form.country_code + form.phone_number
                    : '-'
                "
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

            <el-form-item :label="$t('manager.requester')" class="tags">
              <div v-if="form.requester_names.length > 0" class="tag-group">
                <el-tag
                  v-for="(item, index) in form.requester_names"
                  :key="index"
                  type="info"
                  effect="dark"
                >
                  {{ item.user_name + '(' + item.user_id + ')' }}
                </el-tag>
              </div>
              <div v-else>
                -
              </div>
            </el-form-item>

            <el-form-item
              v-if="$auth.user.user_type == 1"
              :label="$t('label.admin_memo')"
            >
              <el-input
                v-model="form.memo"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 4 }"
                :disabled="true"
              >
              </el-input>
            </el-form-item>
            <el-form-item
              v-if="$auth.user.user_type == 2"
              :label="$t('label.client_comp_memo')"
            >
              <el-input
                v-model="form.memo"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 4 }"
                :disabled="true"
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
          <el-col :md="6" :lg="6" class="avatar-container">
            <img
              :src="form.avatar ? form.avatar : defaultAvatar"
              class="avatar"
            />
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import detail from '@/mixin/detail'
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
  mixins: [detail],
  async asyncData ({ $axios, params, error }) {
    const managerId = params.id
    try {
      const response = await $axios.post('/manager/detail', {
        id: managerId
      })
      const { errorCode, data } = response.data
      if (errorCode === 0) {
        return {
          form: data
        }
      } else {
        error({ statusCode: 500, message: 'Internal server error' })
      }
    } catch (err) {
      error({ statusCode: 404, message: 'Pages not found' })
    }
  },
  computed: {
    getSyslangName () {
      return this.sysLangList.filter(
        lang => lang.value === this.form.system_lang
      )[0].label
    }
  },
  methods: {
    onModify () {
      this.$router.push('/manager/edit/' + this.$route.params.id)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
.left-container {
  .el-tag {
    margin-right: 10px;
  }
  .trans-item-div {
    display: flex;
    align-items: center;
    line-height: 20px;
    .original-lang {
      background: #67c23a;
      padding: 10px;
      border-radius: 4px;
      color: white;
    }
    .translate-lang {
      background: #f56c6c;
      padding: 10px;
      border-radius: 4px;
      color: white;
      margin-right: 10px;
    }
  }
}
::v-deep {
  .trans-lang,
  .free-req-cnt {
    .el-form-item__label {
      line-height: $formLabelLineHeight !important;
      margin-top: $formLabelMgTop !important;
    }
  }
}
</style>
