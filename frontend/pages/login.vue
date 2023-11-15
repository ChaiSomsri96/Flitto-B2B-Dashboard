<template>
  <div>
    <el-row>
      <div class="left-container hidden-sm-and-down">
        <div class="header">
          <img src="/imgs/login-logo.png" class="login-logo mb5" />
          <div class="subtitle">
            translation portal
          </div>
        </div>
        <div class="main">
          <!-- <div>
            <p class="title">
              Welcome Back !
            </p>
            <p class="content-text">
              Lorem Ipsum Lorem Ipsum is simply dummy text of the printing and typesetting industry
            </p>
          </div> -->
          <img src="/imgs/login-welcome.png" />
        </div>
      </div>
      <el-col :md="6" :lg="6" class="hidden-sm-and-down">
      </el-col>
      <el-col :md="18" :lg="18" style="align-items: baseline;">
        <div class="mobile-header hidden-md-and-up">
          <img src="/imgs/login-logo.png" class="login-logo" />
          <!-- <div class="subtitle">
            translation portal
          </div> -->
        </div>
        <div class="right-container">
          <div class="header">
            {{ lang[lang_key]['put_your_account_details'] }}
          </div>
          <div class="main">
            <el-form
              ref="loginForm"
              :rules="rules"
              :model="loginForm"
              label-position="top"
              @keyup.enter.native="onSubmitForm()"
            >
              <el-form-item prop="domain">
                <span class="input-label">{{
                  lang[lang_key]['enter_your_domain']
                }}</span>
                <div class="input-item">
                  <svg-icon icon-class="www" />
                  <el-input
                    v-model="loginForm.domain"
                    placeholder="domain"
                  ></el-input>
                </div>
              </el-form-item>
              <el-form-item prop="userid">
                <span class="input-label">{{
                  lang[lang_key]['enter_your_id']
                }}</span>
                <div class="input-item">
                  <svg-icon icon-class="contacts" />
                  <el-input
                    v-model="loginForm.userid"
                    placeholder="id"
                  ></el-input>
                </div>
              </el-form-item>
              <el-form-item prop="password">
                <span class="input-label">{{
                  lang[lang_key]['enter_your_password']
                }}</span>
                <div class="input-item">
                  <svg-icon icon-class="lock" />
                  <el-input
                    v-model="loginForm.password"
                    type="password"
                    placeholder="password"
                  ></el-input>
                </div>
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  class="btn-login"
                  @click="onSubmitForm()"
                >
                  {{ lang[lang_key]['login_now'] }}
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
        <div class="footer">
          <p>
            <span>
              <a
                :href="lang[lang_key]['link_terms']"
                target="_blank"
                class="view-terms-detail"
                style="text-decoration:none"
              >{{ lang[lang_key]['use_terms'] }}</a>
            </span>
            <span> | </span>
            <span>
              <a
                :href="lang[lang_key]['link_privacy']"
                target="_blank"
                class="view-terms-detail"
                style="text-decoration:none"
              >{{ lang[lang_key]['privacy'] }}</a>
            </span>
          </p>
          <span>{{ lang[lang_key]['company_info'] }}</span>
        </div>
      </el-col>
    </el-row>
    <el-dialog
      :title="$t('common.use_terms')"
      :visible.sync="useTermsDlgVisible"
      width="30%"
      center
    >
      <el-checkbox
        v-model="checkedAll"
        :indeterminate="isIndeterminate"
        @change="handleCheckAllChange"
      >
        {{ $t('common.all_agree') }}
      </el-checkbox>
      <el-checkbox-group
        v-model="checkedTerms"
        @change="handleCheckedTermsChange"
      >
        <el-checkbox label="1">
          {{ $t('common.use_terms_agree') }}&nbsp;&nbsp;<a
            :href="lang[lang_key]['link_terms']"
            target="_blank"
            class="view-terms-detail"
          >{{ $t('common.view_detail') }}</a>
        </el-checkbox>
        <br />
        <el-checkbox label="2">
          {{ $t('common.privacy_agree') }}&nbsp;&nbsp;<a
            :href="lang[lang_key]['link_privacy']"
            target="_blank"
            class="view-terms-detail"
          >{{ $t('common.view_detail') }}</a>
        </el-checkbox>
      </el-checkbox-group>
      <span slot="footer" class="dialog-footer">
        <el-button
          type="primary"
          :disabled="loginBtnDisabled"
          @click="handleLogin"
        >{{ $t('common.login') }}</el-button>
        <el-button @click="handleLogout">{{ $t('navbar.logout') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  layout: 'auth',
  data () {
    const dataObj = {
      useTermsDlgVisible: false,
      checkedAll: false,
      checkedTerms: [],
      isIndeterminate: false,
      loginBtnDisabled: true,
      loginForm: {
        domain: '',
        userid: '',
        password: ''
      },
      lang_key: 'en',
      lang: {
        ko: {
          put_your_account_details: '로그인',
          enter_your_domain: '도메인을 입력하세요.',
          enter_your_id: 'ID를 입력하세요.',
          enter_your_password: '비밀번호를 입력하세요.',
          login_now: '로그인',
          use_terms: '서비스 이용약관',
          privacy: '개인정보처리방침',
          link_terms: 'https://ko.flitto.com/terms_group',
          link_privacy: 'https://ko.flitto.com/terms_group#go_to_privacy',
          company_info: '주식회사 플리토 | 대표자: 이정수 | 사업자등록번호: 215-87-72878 | 통신판매업신고번호: 2014-서울강남-02858호 | 주소: (06141) 서울특별시 강남구 테헤란로211 9층 (역삼동 678-39) | 전화번호: 02-512-0142, 0162 (고객센터)'
        },
        en: {
          put_your_account_details: 'Log in',
          enter_your_domain: 'Enter Your Domain',
          enter_your_id: 'Enter Your ID',
          enter_your_password: 'Enter Your Password',
          login_now: 'Login Now',
          use_terms: 'Terms of Service',
          privacy: 'Privacy Policy',
          link_terms: 'https://en.flitto.com/terms_group',
          link_privacy: 'https://en.flitto.com/terms_group#go_to_privacy',
          company_info: 'Flitto Inc. | Address: (06141) 9F, 211, Teheran-ro, Gangnam-gu, Seoul, Korea | Tel: +82-2-512-0142, 0162 (Customer Service)'
        },
        'en-US': {
          put_your_account_details: 'Log in',
          enter_your_domain: 'Enter Your Domain',
          enter_your_id: 'Enter Your ID',
          enter_your_password: 'Enter Your Password',
          login_now: 'Login Now',
          use_terms: 'Terms of Service',
          privacy: 'Privacy Policy',
          link_terms: 'https://en.flitto.com/terms_group',
          link_privacy: 'https://en.flitto.com/terms_group#go_to_privacy',
          company_info: 'Flitto Inc. | Address: (06141) 9F, 211, Teheran-ro, Gangnam-gu, Seoul, Korea | Tel: +82-2-512-0142, 0162 (Customer Service)'
        },
        ja: {
          put_your_account_details: 'ログイン',
          enter_your_domain: 'ドメインを入力してください',
          enter_your_id: 'IDを入力してください',
          enter_your_password: 'パスワードを入力してください',
          login_now: 'ログイン',
          use_terms: 'サービスの利用規約',
          privacy: '個人情報の取扱い',
          link_terms: 'https://ja.flitto.com/terms_group#go_to_service',
          link_privacy: 'https://ja.flitto.com/terms_group#go_to_privacy',
          company_info: 'フリットジャパン株式会社 | 住所:(〒100-0006) 東京都千代田区有楽町1-12-1 新有楽町ビル 11F | TEL:+81-03-4500-1794'
        },
        'zh-CN': {
          put_your_account_details: '想要登录请输入您的账号信息。',
          enter_your_domain: '请输入您的域名。',
          enter_your_id: '请输入ID。',
          enter_your_password: '请输入密码。',
          login_now: '登录',
          use_terms: '服务条款',
          privacy: '隐私政策',
          link_terms: 'https://zh-cn.flitto.com/terms_group',
          link_privacy: 'https://zh-cn.flitto.com/terms_group#go_to_privacy',
          company_info: '北京飞译网络技术有限公司 | 北京市海淀区海淀北二街8号中关村SOHO-A-1003'
        }
      },
      rules: {
        domain: [
          {
            required: true,
            message: 'Please enter your domain.',
            trigger: 'blur'
          }
          // { min: 3, max: 5, message: 'Length should be 3 to 5', trigger: 'blur' }
        ],
        userid: [
          { required: true, message: 'Please enter your id', trigger: 'blur' }
        ],
        password: [
          {
            required: true,
            message: 'Please enter your password',
            trigger: 'blur'
          }
        ]
      }
    }
    if (process.client) {
      if (navigator.language === 'ko' || navigator.language === 'ko-KR') {
        dataObj.rules.domain[0].message = '도메인을 입력해주세요.'
        dataObj.rules.userid[0].message = '아이디를 입력해주세요.'
        dataObj.rules.password[0].message = '비밀번호를 입력해주세요.'
      } else if (navigator.language === 'ja') {
        dataObj.rules.domain[0].message = 'ドメイン を入力してください。'
        dataObj.rules.userid[0].message = 'IDを入力してください。'
        dataObj.rules.password[0].message = 'パスワードを入力してください。'
      } else if (navigator.language === 'zh-CN' || navigator.language === 'zh') {
        dataObj.rules.domain[0].message = '请输入域名。'
        dataObj.rules.userid[0].message = '请输入ID。'
        dataObj.rules.password[0].message = '请输入密码。'
      }
    }
    return dataObj
  },
  watch: {
    checkedAll (val) {
      if (val) {
        this.loginBtnDisabled = false
      } else {
        this.loginBtnDisabled = true
      }
    }
  },
  created () {},
  mounted () {
    window.OneSignal = window.OneSignal || []
    window.OneSignal.push(() => {
      window.OneSignal.isPushNotificationsEnabled((isEnabled) => {
        if (isEnabled) {
          console.log('Push notifications are enabled!')
          window.OneSignal.removeExternalUserId()
        } else {
        }
      })
    })
    const userLang = navigator.language || navigator.userLanguage
    this.lang_key = userLang
    if (
      !(
        this.lang_key === 'ko' ||
        this.lang_key === 'en-US' ||
        this.lang_key === 'en' ||
        this.lang_key === 'ja' ||
        this.lang_key === 'zh-CN' ||
        this.lang_key === 'ko-KR' ||
        this.lang_key === 'zh'
      )
    ) {
      this.lang_key = 'en'
    } else if (this.lang_key === 'ko-KR') {
      this.lang_key = 'ko'
    } else if (this.lang_key === 'zh') {
      this.lang_key = 'zh-CN'
    }
  },
  methods: {
    onSubmitForm () {
      this.$refs.loginForm.validate(async (valid) => {
        if (valid) {
          try {
            const resp = await this.$auth.loginWith('local', {
              data: this.loginForm
            })
            if (resp.data.errorCode === 0) {
              await this.$i18n.setLocale(resp.data.system_lang.toLowerCase())
              if (
                this.$auth.user.user_type === 3 &&
                this.$auth.user.use_terms === 'Y' &&
                this.$auth.user.agreed === 'N'
              ) {
                this.useTermsDlgVisible = true
              } else {
                this.handleLogin()
              }
            } else if (resp.data.errorCode === 1) {
              if (this.lang_key === 'ja') {
                this.$message.error('パスワードを間違って入力しました。')
              } else if (this.lang_key === 'ko') {
                this.$message.error('비밀번호가 올바르지 않습니다.')
              } else if (this.lang_key === 'zh-CN') {
                this.$message.error('密码错误。')
              } else {
                this.$message.error('Your password is incorrect.')
              }
            } else if (resp.data.errorCode === 2) {
              if (this.lang_key === 'ja') {
                this.$message.error('ドメインまたはIDを間違って入力しました。')
              } else if (this.lang_key === 'ko') {
                this.$message.error('도메인 또는 아이디가 올바르지 않습니다.')
              } else if (this.lang_key === 'zh-CN') {
                this.$message.error('域名或ID错误。')
              } else {
                this.$message.error('Your domain or ID is incorrect.')
              }
            }
          } catch (err) {
            console.log(err)
          }
        } else {
          return false
        }
      })
    },
    handleCheckAllChange (val) {
      this.checkedTerms = val ? ['1', '2'] : []
      this.isIndeterminate = false
    },
    handleCheckedTermsChange (val) {
      const checkedCount = val.length
      this.checkedAll = checkedCount === 2
      this.isIndeterminate = checkedCount > 0 && checkedCount < 2
    },
    async handleLogin () {
      if (this.$auth.user.user_type === 1) {
        this.$router.push('/')
      } else if (this.$auth.user.user_type >= 4 && this.$auth.user.user_type <= 6) {
        this.$router.push('/dashboard/worker')
      } else if (this.$auth.user.user_type === 2 || this.$auth.user.user_type === 7) {
        this.$router.push('/dashboard/company')
      } else if (
        this.$auth.user.use_terms === 'Y' &&
        this.$auth.user.active === 'N'
      ) {
        const response = await this.$axios.post(
          '/requester/update-requester-accept'
        )
        const { errorCode } = response.data
        if (errorCode === 0) {
          const updatedUser = { ...this.$auth.user }
          updatedUser.active = 'Y'
          this.$auth.setUser(updatedUser)
          await this.$nextTick()
          this.$router.push('/dashboard/' + this.$auth.user.role)
        }
      } else {
        this.$router.push('/dashboard/' + this.$auth.user.role)
      }
    },
    async handleLogout () {
      await this.$auth.logout()
      this.useTermsDlgVisible = false
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.el-form-item {
  margin-bottom: 25px;
}
.input-item {
  display: flex;
  .el-input {
    flex: 1;
    margin-left: 10px;
  }
}
.svg-icon {
  width: $inputBoxHeight !important;
  height: $inputBoxHeight !important;
}
::v-deep {
  .el-form-item__error {
    font-size: 14px;
    left: 60px;
  }
  .el-input__inner {
    height: $inputBoxHeight;
    font-size: $inputFontSize;
    border-radius: $formControlBorderRadius;
  }
  .el-checkbox__input.is-checked + .el-checkbox__label {
    color: #606266;
  }
}
.el-col {
  display: flex;
  background-color: $contentBgColor;
  flex-direction: column;
  height: 100vh;
}

.mobile-header {
  background-color: $blue50;
  color: white;
  padding: 30px 80px;
  width: 100% !important;
  /* .subtitle {
    font-size: 16px;
    font-weight: 500;
    color: $logoSubtitleColor;
  } */
}

.left-container {
  width: 25%;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: $blue50;
  color: white;
  .header {
    padding: 40px 60px 30px 60px;
    .subtitle {
      font-size: 16px;
      font-weight: 500;
      color: $logoSubtitleColor;
    }
  }
  .main {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    flex: 1;
    border-top: 1px solid #f3f6f963;
    padding: 30px 50px;
    .title {
      font-size: 40px;
      font-weight: bold;
      margin-top: 0px;
      margin-bottom: 20px;
    }
    img {
      width: 100%;
    }
  }
}

.right-container {
  /* display:flex;
  flex-direction: column;
  justify-content: center; */
  padding: 20px 80px 40px 80px;
  align-items: baseline;
  // padding-top: 90px;
  // padding-bottom: 90px;
  width: 60%;
  height: 88% !important;
  margin: 0px auto 0px auto;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  background-color: white;
  color: $gray90;
  .header {
    font-size: 32px;
    width: 100%;
    height: auto !important;
    // margin-top: 22%;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
  }
  .el-form {
    margin-top: 20px;
    .input-label {
      font-size: $labelFontSize;
      color: $formLabelColor;
      font-weight: bold;
    }
    .btn-login {
      width: 180px;
      font-size: 18px;
      text-align: center;
      margin-top: 25px;
      background-color: $blue50;
      border-radius: 8px;
      color: white;
      &:hover {
        opacity: 0.8;
      }
    }
  }
}
.footer {
  font-size: 14px;
  padding: 20px 40px;
  position: fixed;
  bottom: 5px;
}
.view-terms-detail {
  text-decoration: underline;
  color: $blue50;
}
.el-checkbox {
  margin-bottom: 10px;
}
@media screen and (max-width: 1600px) and (min-width: 1201px) {
  .left-container {
    .header {
      padding: 40px 60px 30px 60px !important;
    }
    .main {
      padding: 30px !important;
      .title {
        font-size: 34px !important;
      }
    }
  }
  .right-container {
    padding: 20px 100px 40px 100px !important;
    height: 84% !important;
    .header {
      font-size: 28px !important;
    }
    .el-form-item {
      margin-bottom: 20px !important;
    }
  }
  .footer {
    font-size: 13px;
    padding: 10px 30px;
    position: fixed;
    bottom: 5px;
  }
}

@media screen and (max-width: 1200px) and (min-width: 992px) {
  .left-container {
    .header {
      padding: 40px 60px 30px 60px !important;
    }
    .main {
      padding: 30px !important;
      .title {
        font-size: 34px !important;
      }
    }
  }
  .right-container {
    width: 70% !important;
    padding: 20px 80px 40px 80px !important;
    height: 84% !important;
    .header {
      font-size: 25px !important;
    }
    .el-form-item {
      margin-bottom: 20px !important;
    }
  }
  .footer {
    font-size: 12px;
    padding: 10px 30px;
    position: fixed;
    bottom: 5px;
  }
}

@media screen and (max-width: 991px) and (min-width: 361px) {
  .mobile-header {
    padding: 20px 50px !important;
  }
  .right-container {
    width: 100%;
    padding: 30px 50px;
    height: 100%;
    border-radius: 0px;
    .header {
      font-size: 20px;
    }
    .btn-login {
      width: 150px;
    }
  }
  .footer {
    width: 90%;
    font-size: 12px;
    margin: 0px auto 0px auto;
    padding : 25px 10px;
    position: inherit;
  }
}

@media screen and (max-width: 360px) {
  .mobile-header {
    padding: 25px;
  }
  .right-container {
    width: 100%;
    padding: 20px 25px !important;
    height: 100%;
    border-radius: 0px;
    .header {
      font-size: 20px;
    }
    .btn-login {
      width: 150px;
    }
  }
  .footer {
    width: 90%;
    font-size: 12px;
    margin: 0px auto 0px auto;
    padding : 25px 10px;
    position: inherit;
  }
}
</style>
