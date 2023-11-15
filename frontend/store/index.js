export const state = () => ({
  user_auth: ''
})

export const getters = {
  loggedUser: state => state.user_auth
}
export const mutations = {
  SET_AUTH: (state, auth) => {
    state.user_auth = auth
  }
}
export const actions = {
  async nuxtServerInit ({ commit }, { req, $axios }) {
    let auth = null
    // console.log(req.headers)
    // const cookieParts = req.headers.cookie.split(' ')
    // for (let i = 0; i < cookieParts.length; i++) { console.log(decodeURI(cookieParts[i])) }
    // if (req.headers.authorization) {
    // cookie found
    try {
      console.log($axios.defaults.baseURL + '/auth/me')
      const { data } = await $axios.post('/auth/me')
      // server return the data is cookie valid loggedIn is true
      auth = data.data // set the data auth
    } catch (err) {
      // No valid cookie found
      console.log(err)
      auth = null
    }
    if (auth) {
      await this.$i18n.setLocale(auth.system_lang.toLowerCase())
    }
    // }
    commit('SET_AUTH', auth) // set state auth
  }
}
