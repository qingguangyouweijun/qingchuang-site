const COURIER_TYPES = ['顺丰', '京东', '其他']

function computeAmount(form) {
  const small = Number(form.smallCount || 0)
  const medium = Number(form.mediumCount || 0)
  const large = Number(form.largeCount || 0)
  const xlarge = Number(form.xlargeCount || 0)
  const total = small * 2 + medium * 4 + large * 6 + xlarge * 8
  return Number(total.toFixed(2))
}

Page({
  data: {
    tab: 'order',
    courierTypes: COURIER_TYPES,
    courierIndex: 0,
    form: {
      pickupInfo: '',
      building: '',
      address: '',
      note: '',
      smallCount: 1,
      mediumCount: 0,
      largeCount: 0,
      xlargeCount: 0
    },
    amount: 2,
    orders: []
  },
  onShow() {
    const { readState } = require('../../utils/store')
    const state = readState()
    this.setData({ orders: state.expressOrders })
  },
  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab })
  },
  handleCourierChange(e) {
    this.setData({ courierIndex: Number(e.detail.value) })
  },
  handleInput(e) {
    const key = e.currentTarget.dataset.key
    const form = { ...this.data.form, [key]: e.detail.value }
    this.setData({ form, amount: computeAmount(form) })
  },
  submitOrder() {
    const form = this.data.form
    if (!form.pickupInfo || !form.building || !form.address) {
      wx.showToast({ title: '请先补全取件信息、楼栋和地址', icon: 'none' })
      return
    }
    const { addExpressOrder } = require('../../utils/store')
    addExpressOrder({
      courierType: this.data.courierTypes[this.data.courierIndex],
      pickupInfo: form.pickupInfo,
      building: form.building,
      address: form.address,
      note: form.note,
      amount: this.data.amount
    })
    this.setData({
      tab: 'runner',
      form: {
        pickupInfo: '',
        building: '',
        address: '',
        note: '',
        smallCount: 1,
        mediumCount: 0,
        largeCount: 0,
        xlargeCount: 0
      },
      amount: 2
    })
    this.onShow()
    wx.showToast({ title: '已生成快递单', icon: 'none' })
  },
  acceptOrder(e) {
    const { acceptExpressOrder } = require('../../utils/store')
    acceptExpressOrder(e.currentTarget.dataset.id)
    this.onShow()
    wx.showToast({ title: '已接单', icon: 'none' })
  },
  completeOrder(e) {
    const { completeExpressOrder } = require('../../utils/store')
    completeExpressOrder(e.currentTarget.dataset.id)
    this.onShow()
    wx.showToast({ title: '已标记完成', icon: 'none' })
  }
})
