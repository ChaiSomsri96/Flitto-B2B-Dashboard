import Cookies from 'js-cookie'

export const state = () => ({
  sidebar: {
    opened: Cookies.get('sidebarStatus') ? !!+Cookies.get('sidebarStatus') : true,
    withoutAnimation: false
  },
  device: 'desktop',
  rowExpand: [],
  noticeCount: 0
})

export const getters = {
  rowExpand (state) {
    return state.rowExpand
  },
  noticeCount (state) {
    return state.noticeCount
  }
}

export const mutations = {
  TOGGLE_SIDEBAR: (state) => {
    state.sidebar.opened = !state.sidebar.opened
    state.sidebar.withoutAnimation = false
    if (state.sidebar.opened) {
      Cookies.set('sidebarStatus', 1)
    } else {
      Cookies.set('sidebarStatus', 0)
    }
  },
  CLOSE_SIDEBAR: (state, withoutAnimation) => {
    Cookies.set('sidebarStatus', 0)
    state.sidebar.opened = false
    state.sidebar.withoutAnimation = withoutAnimation
  },
  TOGGLE_DEVICE: (state, device) => {
    state.device = device
  },
  TOGGLE_EXPAND: (state, rowIndex) => {
    const matchedIndex = state.rowExpand.findIndex(item => item.rowIndex === rowIndex)
    if (matchedIndex > -1) {
      const newObj = {
        rowIndex,
        isExpanded: !state.rowExpand[matchedIndex].isExpanded
      }
      state.rowExpand.splice(matchedIndex, 1, newObj)
    } else {
      state.rowExpand.push({
        rowIndex,
        isExpanded: false
      })
    }
  },
  INIT_ROWEXPAND: (state) => {
    state.rowExpand = []
  },
  SET_NOTICE_COUNT: (state, noticeCount) => {
    state.noticeCount = noticeCount
  }
}

export const actions = {
  toggleSideBar ({ commit }) {
    commit('TOGGLE_SIDEBAR')
  },
  closeSideBar ({ commit }, { withoutAnimation }) {
    commit('CLOSE_SIDEBAR', withoutAnimation)
  },
  toggleDevice ({ commit }, device) {
    commit('TOGGLE_DEVICE', device)
  },
  toggleRowExpand ({ commit }, rowIndex) {
    commit('TOGGLE_EXPAND', rowIndex)
  },
  initRowExpand ({ commit }) {
    commit('INIT_ROWEXPAND')
  },
  setNoticeCount ({ commit }, noticeCount) {
    commit('SET_NOTICE_COUNT', noticeCount)
  }
}
