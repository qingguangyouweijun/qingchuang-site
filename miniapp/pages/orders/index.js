Page({
  data: {
    expressOrders: [],
    bookOrders: [],
    snackOrders: []
  },
  onShow() {
    const { getOrderGroups } = require('../../utils/store')
    const groups = getOrderGroups()
    this.setData(groups)
  }
})
