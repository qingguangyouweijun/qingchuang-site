Page({
  data: {
    wallet: null,
    amount: ''
  },
  onShow() {
    const { readState } = require('../../utils/store')
    const state = readState()
    this.setData({ wallet: state.wallet })
  },
  handleInput(e) {
    this.setData({ amount: e.detail.value })
  },
  submitSettlement() {
    const amount = Number(this.data.amount || 0)
    if (!amount || amount <= 0) {
      wx.showToast({ title: '请输入正确的结算金额', icon: 'none' })
      return
    }
    if (amount > this.data.wallet.available) {
      wx.showToast({ title: '金额不能大于可结算余额', icon: 'none' })
      return
    }
    const { submitSettlement, readState } = require('../../utils/store')
    submitSettlement(amount)
    this.setData({ amount: '', wallet: readState().wallet })
    wx.showToast({ title: '已提交结算申请', icon: 'none' })
  }
})
