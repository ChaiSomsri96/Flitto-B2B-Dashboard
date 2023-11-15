export default ({ $axios, app }) => {
  $axios.defaults.timeout = 10000
  $axios.defaults.baseURL =
    'http://' + process.env.API_HOST + ':' + process.env.API_PORT + '/'
  $axios.defaults.prefix =
    'http://' + process.env.API_HOST + ':' + process.env.API_PORT + '/'
  /* $axios.defaults.headers.common.Authorization =
    'bearer ' + app.store.getters['user/getToken'] || ''

  $axios.onRequest((config) => {
    if (config.withoutToken) {
      config.headers.common.Authorization = ''
    } else {
      config.headers.common.Authorization =
        'bearer ' + app.store.getters['user/getToken'] || ''
    }
    // app.$bus.$emit('loading', true)
  }) */

  $axios.onResponse((response) => {
    // app.$bus.$emit('loading', false)
    return response
  })
  $axios.onError((err) => {
    // app.$bus.$emit('loading', false)

    return Promise.reject(err)
  })
}
