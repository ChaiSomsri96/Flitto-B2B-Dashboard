import Vue from 'vue'
import GAuth from 'vue-google-oauth2'

const gauthOption = {
  clientId: '1096071879251-t5suhbgeu61jf8je5hjved15327eqsnl.apps.googleusercontent.com',
  scope: 'profile email https://www.googleapis.com/auth/youtubepartner https://www.googleapis.com/auth/youtube.force-ssl',
  prompt: 'consent',
  fetch_basic_profile: true
}
Vue.use(GAuth, gauthOption)
