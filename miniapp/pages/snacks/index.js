Page({
  data: {
    products: [],
    orders: [],
    deliveryLocation: '',
    note: ''
  },
  onShow() {
    const { readState } = require('../../utils/store')
    const state = readState()
    this.setData({ products: state.snackProducts, orders: state.snackOrders })
  },
  handleInput(e) {
    this.setData({ [e.currentTarget.dataset.key]: e.detail.value })
  },
  buyNow(e) {
    if (!this.data.deliveryLocation) {
      wx.showToast({ title: '请先填写送达位置', icon: 'none' })
      return
    }
    const { addSnackOrder } = require('../../utils/store')
    try {
      addSnackOrder({
        productId: e.currentTarget.dataset.id,
        quantity: 1,
        location: this.data.deliveryLocation,
        note: this.data.note
      })
      this.setData({ note: '' })
      this.onShow()
      wx.showToast({ title: '已生成零食订单', icon: 'none' })
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    }
  }
})
