<template>
  <div class="detail-container">
    <div class="page-title">
      {{ $t('admin.detail') }}
    </div>
    <el-card class="box-card">
      <el-form ref="adminDetailForm" :model="form" label-width="160px" label-position="left">
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
            <el-form-item :label="$t('label.password')">
              <input-with-icon
                :input-value="'-'"
                :icon-name="'lock-24'"
                :disabled="true"
              />
            </el-form-item>
            <el-form-item :label="$t('label.name')" prop="user_name">
              <input-with-icon
                :input-value="form.user_name"
                :icon-name="'person-24'"
                :disabled="true"
                :placeholder="$t('placeholder.name')"
              />
            </el-form-item>
            <el-form-item :label="$t('label.phone')" prop="phone_number">
              <input-with-icon
                :input-value="form.phone_number ? (form.country_code + form.phone_number) : '-'"
                :icon-name="'call-24'"
                :disabled="true"
              />
            </el-form-item>
            <el-form-item :label="$t('label.email')" prop="email">
              <input-with-icon
                :input-value="form.email ? form.email : '-'"
                :icon-name="'mail-24'"
                :disabled="true"
                :placeholder="$t('placeholder.email')"
              />
            </el-form-item>
            <el-form-item :label="$t('label.syslang')" prop="system_lang">
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
          <el-col :md="6" :lg="6" class="avatar-container">
            <img :src="form.avatar ? form.avatar : defaultAvatar" class="avatar" />
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
  async asyncData ({ $axios, params, error }) {
    const adminId = params.id
    try {
      const response = await $axios.post('/admin/detail', { id: adminId })
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
    }
  },
  computed: {
    getSyslangName () {
      return this.sysLangList.filter(lang => lang.value === this.form.system_lang)[0].label
    }
  },
  methods: {
    onModify () {
      this.$router.push('/admin/edit/' + this.$route.params.id)
    }
  }
}
</script>
