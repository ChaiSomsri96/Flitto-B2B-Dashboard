const getDefaultState = () => {
  return {
    token: '',
    name: '',
    avatar: '',
    logo: ''
  }
}

export const state = () => (getDefaultState())
export const getters = {
  userName (state) {
    return state.name
  },
  userAvatar (state) {
    return state.avatar
  },
  companyLogo (state) {
    return state.logo
  }
}
export const mutations = {
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_LOGO: (state, logo) => {
    state.logo = logo
  }
}

export const actions = {
  // user login
  login ({ commit }, userInfo) {
    const _domain = userInfo.domain
    const _userid = userInfo.userid
    const _password = userInfo.password

    return new Promise((resolve, reject) => {
      this.$axios.post('/auth/login', {
        domain: _domain.trim(),
        userid: _userid.trim(),
        password: _password
      }).then((response) => {
        const { status, data } = response
        console.log(status)
        console.log(data)
        if (status === 'success') {
          commit('SET_TOKEN', data)
        }
        resolve(response)
      }).catch((error) => {
        reject(error)
      })
    })
  },

  setName ({ commit }, name) {
    commit('SET_NAME', name)
  },

  setAvatar ({ commit }, avatar) {
    commit('SET_AVATAR', avatar)
  },

  setLogo ({ commit }, logo) {
    commit('SET_LOGO', logo)
  }
}
