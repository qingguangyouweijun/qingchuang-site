const STORAGE_KEY = 'qingchuang-mini-state-v1'

function createDefaultState() {
  return {
    session: {
      loggedIn: false,
      nickname: '微信游客',
      avatarUrl: '',
      authMode: 'wechat-planned',
      lastLoginCode: '',
      note: '当前为小程序原生界面适配版，后续会把 wx.login code 发送到轻创服务端完成正式微信登录。'
    },
    wallet: {
      available: 26.5,
      pending: 8.8,
      applying: 0,
      settled: 128,
      settlements: []
    },
    expressOrders: [
      {
        id: 'EXP-DEMO-001',
        courierType: '顺丰',
        pickupInfo: '尾号 1328 / 取件码 6689 / 收件人 小陈',
        building: '3号楼',
        address: '402',
        note: '到楼下联系',
        amount: 2,
        status: '待接单',
        createdAt: '今天 12:30'
      }
    ],
    bookPosts: [
      {
        id: 'BOOK-DEMO-001',
        title: '高等数学（第七版）',
        category: '专业课',
        price: 18,
        sellerIncome: 16,
        condition: '八成新',
        description: '无缺页，可直接使用。',
        createdAt: '今天 10:00'
      }
    ],
    bookOrders: [],
    snackProducts: [
      {
        id: 'SNACK-001',
        name: '可口可乐 330ml',
        subtitle: '冰镇更好喝',
        price: 3.5,
        stock: 24,
        emoji: '🥤'
      },
      {
        id: 'SNACK-002',
        name: '乐事原味薯片',
        subtitle: '宿舍常备款',
        price: 6,
        stock: 16,
        emoji: '🍟'
      },
      {
        id: 'SNACK-003',
        name: '旺仔牛奶',
        subtitle: '晚自习回血',
        price: 4.5,
        stock: 18,
        emoji: '🥛'
      }
    ],
    snackOrders: []
  }
}

function readState() {
  const current = wx.getStorageSync(STORAGE_KEY)
  if (current) {
    return current
  }
  const initial = createDefaultState()
  wx.setStorageSync(STORAGE_KEY, initial)
  return initial
}

function writeState(nextState) {
  wx.setStorageSync(STORAGE_KEY, nextState)
  return nextState
}

function updateState(updater) {
  const current = readState()
  const next = updater(current)
  return writeState(next)
}

function createNo(prefix) {
  const stamp = Date.now().toString().slice(-8)
  return `${prefix}${stamp}`
}

function saveSession(session) {
  return updateState((state) => ({ ...state, session: { ...state.session, ...session, loggedIn: true } }))
}

function logout() {
  return updateState((state) => ({ ...state, session: createDefaultState().session }))
}

function addExpressOrder(payload) {
  const order = {
    id: createNo('EXP-'),
    courierType: payload.courierType,
    pickupInfo: payload.pickupInfo,
    building: payload.building,
    address: payload.address,
    note: payload.note || '',
    amount: payload.amount,
    status: '待接单',
    createdAt: '刚刚'
  }
  updateState((state) => ({ ...state, expressOrders: [order, ...state.expressOrders] }))
  return order
}

function acceptExpressOrder(id) {
  return updateState((state) => ({
    ...state,
    expressOrders: state.expressOrders.map((item) => item.id === id ? { ...item, status: '配送中' } : item)
  }))
}

function completeExpressOrder(id) {
  return updateState((state) => ({
    ...state,
    expressOrders: state.expressOrders.map((item) => item.id === id ? { ...item, status: '已完成' } : item),
    wallet: {
      ...state.wallet,
      pending: Number((state.wallet.pending + 1.2).toFixed(2))
    }
  }))
}

function addBookPost(payload) {
  const post = {
    id: createNo('BOOK-'),
    title: payload.title,
    category: payload.category,
    price: payload.price,
    sellerIncome: Math.max(Number((payload.price - 2).toFixed(2)), 0),
    condition: payload.condition,
    description: payload.description || '',
    createdAt: '刚刚'
  }
  updateState((state) => ({ ...state, bookPosts: [post, ...state.bookPosts] }))
  return post
}

function createBookOrder(id) {
  const state = readState()
  const post = state.bookPosts.find((item) => item.id === id)
  if (!post) {
    throw new Error('未找到对应旧书')
  }
  const order = {
    id: createNo('BOR-'),
    title: post.title,
    price: post.price,
    sellerIncome: post.sellerIncome,
    status: '待卖家送达',
    createdAt: '刚刚'
  }
  updateState((current) => ({ ...current, bookOrders: [order, ...current.bookOrders] }))
  return order
}

function addSnackOrder(payload) {
  const product = readState().snackProducts.find((item) => item.id === payload.productId)
  if (!product) {
    throw new Error('零食商品不存在')
  }
  const order = {
    id: createNo('SNK-'),
    name: product.name,
    quantity: payload.quantity,
    total: Number((product.price * payload.quantity).toFixed(2)),
    location: payload.location,
    note: payload.note || '',
    status: '待配送',
    createdAt: '刚刚'
  }
  updateState((state) => ({ ...state, snackOrders: [order, ...state.snackOrders] }))
  return order
}

function submitSettlement(amount) {
  return updateState((state) => ({
    ...state,
    wallet: {
      ...state.wallet,
      available: Number((state.wallet.available - amount).toFixed(2)),
      applying: Number((state.wallet.applying + amount).toFixed(2)),
      settlements: [
        {
          id: createNo('SET-'),
          amount,
          status: '结算申请中',
          createdAt: '刚刚'
        },
        ...state.wallet.settlements
      ]
    }
  }))
}

function getOrderGroups() {
  const state = readState()
  return {
    expressOrders: state.expressOrders,
    bookOrders: state.bookOrders,
    snackOrders: state.snackOrders
  }
}

module.exports = {
  createDefaultState,
  readState,
  writeState,
  saveSession,
  logout,
  addExpressOrder,
  acceptExpressOrder,
  completeExpressOrder,
  addBookPost,
  createBookOrder,
  addSnackOrder,
  submitSettlement,
  getOrderGroups
}
