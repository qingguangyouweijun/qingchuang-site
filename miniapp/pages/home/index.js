Page({
  data: {
    session: {
      loggedIn: false,
      nickname: '微信游客',
      avatarUrl: '',
      authMode: 'wechat-planned',
      lastLoginCode: ''
    },
    counts: {
      express: 0,
      books: 0,
      snacks: 0
    }
  },
  onShow() {
    const { readState } = require('../../utils/store')
    const state = readState()
    this.setData({
      session: state.session,
      counts: {
        express: state.expressOrders.length,
        books: state.bookPosts.length,
        snacks: state.snackProducts.length
      }
    })
  },
  goCampus() {
    wx.switchTab({ url: '/pages/campus/index' })
  },
  goProfile() {
    wx.switchTab({ url: '/pages/profile/index' })
  },
  goAuth() {
    wx.navigateTo({ url: '/pages/auth/index' })
  }
})
