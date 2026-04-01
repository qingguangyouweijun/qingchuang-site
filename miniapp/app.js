App({
  globalData: {
    brandName: '轻创 Qintra',
    authMode: 'wechat-planned'
  },
  onLaunch() {
    const firstOpenAt = wx.getStorageSync('miniappFirstOpenAt')
    if (!firstOpenAt) {
      wx.setStorageSync('miniappFirstOpenAt', Date.now())
    }
  }
})
