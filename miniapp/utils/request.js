const { baseUrl, requestTimeout } = require('./config')
const SESSION_KEY = 'qingchuang-mini-session-token'

function getSessionToken() {
  return wx.getStorageSync(SESSION_KEY) || ''
}

function setSessionToken(token) {
  wx.setStorageSync(SESSION_KEY, token)
}

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      timeout: requestTimeout,
      header: {
        'Content-Type': 'application/json',
        'x-mini-session': getSessionToken()
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
          return
        }
        reject(new Error((res.data && (res.data.error || res.data.message)) || `请求失败：${res.statusCode}`))
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

module.exports = {
  request,
  getSessionToken,
  setSessionToken
}
