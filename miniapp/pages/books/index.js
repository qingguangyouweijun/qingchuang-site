Page({
  data: {
    tab: 'sell',
    form: {
      title: '',
      category: '',
      price: '',
      condition: '',
      description: ''
    },
    sellerIncome: 0,
    posts: [],
    orders: []
  },
  onShow() {
    const { readState } = require('../../utils/store')
    const state = readState()
    this.setData({ posts: state.bookPosts, orders: state.bookOrders })
  },
  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab })
  },
  handleInput(e) {
    const key = e.currentTarget.dataset.key
    const form = { ...this.data.form, [key]: e.detail.value }
    const price = Number(form.price || 0)
    this.setData({ form, sellerIncome: Math.max(Number((price - 2).toFixed(2)), 0) })
  },
  publishBook() {
    const form = this.data.form
    if (!form.title || !form.category || !form.price) {
      wx.showToast({ title: '请先补全书名、分类和售价', icon: 'none' })
      return
    }
    const { addBookPost } = require('../../utils/store')
    addBookPost({
      title: form.title,
      category: form.category,
      price: Number(form.price),
      condition: form.condition || '九成新',
      description: form.description
    })
    this.setData({
      form: { title: '', category: '', price: '', condition: '', description: '' },
      sellerIncome: 0,
      tab: 'orders'
    })
    this.onShow()
    wx.showToast({ title: '已发布到旧书广场', icon: 'none' })
  },
  createOrder(e) {
    const { createBookOrder } = require('../../utils/store')
    try {
      createBookOrder(e.currentTarget.dataset.id)
      this.onShow()
      wx.showToast({ title: '已生成旧书订单', icon: 'none' })
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    }
  }
})
