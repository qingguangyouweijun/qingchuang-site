Page({
  data: {
    session: {
      loggedIn: false,
      nickname: '微信游客',
      avatarUrl: '',
      authMode: 'wechat-planned',
      lastLoginCode: ''
    }
  },
  onShow() {
    const { readState, logout } = require('../../utils/store')
    this.logoutStore = logout
    const state = readState()
    this.setData({ session: state.session })
  },
  goAuth() {
    wx.navigateTo({ url: '/pages/auth/index' })
  },
  goWallet() {
    wx.switchTab({ url: '/pages/wallet/index' })
  },
  goOrders() {
    wx.switchTab({ url: '/pages/orders/index' })
  },
  handleLogout() {
    this.logoutStore()
    this.onShow()
    wx.showToast({ title: '已清除预留登录态', icon: 'none' })
  }
})
