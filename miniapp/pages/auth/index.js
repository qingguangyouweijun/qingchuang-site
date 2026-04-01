Page({
  data: {
    loading: false,
    session: {
      loggedIn: false,
      nickname: '微信游客',
      avatarUrl: '',
      authMode: 'wechat-planned',
      lastLoginCode: ''
    },
    wxCode: ''
  },
  onShow() {
    const { readState } = require('../../utils/store')
    const state = readState()
    this.setData({ session: state.session, wxCode: state.session.lastLoginCode || '' })
  },
  handleWechatProfile() {
    this.setData({ loading: true })
    wx.login({
      success: (loginRes) => {
        const code = loginRes.code || ''
        wx.getUserProfile({
          desc: '用于完善你在轻创小程序内的头像和昵称，并为后续微信登录打通准备信息。',
          success: (profileRes) => {
            const { saveSession } = require('../../utils/store')
            saveSession({
              nickname: profileRes.userInfo.nickName,
              avatarUrl: profileRes.userInfo.avatarUrl,
              authMode: 'wechat-ready',
              lastLoginCode: code
            })
            this.onShow()
            wx.showToast({ title: '已保存微信授权资料', icon: 'none' })
          },
          fail: () => {
            wx.showToast({ title: '你取消了微信授权', icon: 'none' })
          },
          complete: () => {
            this.setData({ loading: false })
          }
        })
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({ title: 'wx.login 调用失败', icon: 'none' })
      }
    })
  }
})
