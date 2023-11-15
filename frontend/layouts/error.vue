<template>
  <div class="text-center">
    <h1 v-if="error.statusCode === 404">
      {{ lang[lang_key]['error_404'] }}
    </h1>
    <h1 v-else>
      {{ lang[lang_key]['error_500'] }}
    </h1>
    <el-button
      type="primary"
      class="btn-login"
      @click="btnClick"
    >
      {{ $auth.loggedIn ? '돌아가기' : lang[lang_key]['login'] }}
    </el-button>
  </div>
</template>

<script>
export default {
  layout: 'detail',
  props: {
    error: {
      type: Object,
      default: null
    }
  },
  data () {
    const dataObj = {
      lang_key: 'en',
      lang: {
        ko: {
          error_404: '해당 페이지를 찾을 수 없습니다.',
          error_500: '페이지에 오류가 발생했습니다.',
          login: '로그인',
          back: '돌아가기'
        },
        en: {
          error_404: 'The page could not be found.',
          error_500: 'The page encountered an error.',
          login: 'Login',
          back: 'Go back'
        },
        'en-US': {
          error_404: 'The page could not be found.',
          error_500: 'The page encountered an error.',
          login: 'Login',
          back: 'Go back'
        },
        ja: {
          error_404: '該当ページが見つかりません。',
          error_500: 'ページにエラーが発生しました。',
          login: 'ログイン',
          back: '戻る'
        },
        'zh-CN': {
          error_404: '找不到相应页面。',
          error_500: '页面出现了错误。',
          login: '登录',
          back: '回去'
        }
      }
    }
    return dataObj
  },
  mounted () {
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
    btnClick () {
      if (this.$auth.loggedIn) {
        this.$router.back()
      } else {
        location.href = '/login'
      }
    }
  },
  head () {
    return {
      title: this.error.statusCode || 500
    }
  }
}
</script>
