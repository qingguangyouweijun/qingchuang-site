Page({
  data: {
    session: {
      loggedIn: false,
      nickname: '微信游客',
      avatarUrl: '',
      authMode: 'wechat-planned',
      lastLoginCode: ''
    },
    modules: [
      {
        title: '快递代取',
        desc: '分成下单与接单两条流程，原生表单更适合手机操作。',
        url: '/pages/express/index'
      },
      {
        title: '旧书广场',
        desc: '把旧书售卖和旧书下单收进一个原生页面里。',
        url: '/pages/books/index'
      },
      {
        title: '零食快递',
        desc: '宿舍零食、饮料和临时加购在这里完成。',
        url: '/pages/snacks/index'
      }
    ]
  },
  onShow() {
    const { readState } = require('../../utils/store')
    const state = readState()
    this.setData({ session: state.session })
  },
  openModule(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url })
  }
})
