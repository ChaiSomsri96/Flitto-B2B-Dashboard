export default function ({ $auth, redirect, store }) {
  const user = (store.state.user_auth === undefined || store.state.user_auth === null) ? $auth.user : store.state.user_auth
  if (user && user.active === 'Y') {
    if (user.user_type === 2) {
      redirect('/dashboard/company')
    } else if (user.user_type === 3) {
      redirect('/dashboard/requester')
    } else if (user.user_type >= 4) {
      redirect('/dashboard/worker')
    }
  } else {
    redirect('/login')
  }
}
