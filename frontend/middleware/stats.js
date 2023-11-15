export default function ({ $auth, route, redirect, store }) {
  /* return axios.post('http://my-stats-api.com', {
      url: route.fullPath
    }) */
  if (route.fullPath === '/') {
    if (!process.client) {
      if (store.state.user_auth.user_type === 2 || store.state.user_auth.user_type === 7) {
        redirect('/dashboard/company')
      } else if (store.state.user_auth.user_type === 3) {
        redirect('/dashboard/requester')
      } else if (store.state.user_auth.user_type >= 4 && store.state.user_auth.user_type <= 6) {
        redirect('/dashboard/worker')
      }
    } else if ($auth.user.user_type === 2 || $auth.user.user_type === 7) {
      redirect('/dashboard/company')
    } else if ($auth.user.user_type === 3) {
      redirect('/dashboard/requester')
    } else if ($auth.user.user_type >= 4 && $auth.user.user_type <= 6) {
      redirect('/dashboard/worker')
    }
  }
}
