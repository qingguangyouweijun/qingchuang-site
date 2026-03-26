# 轻创 Qintra

- 中文名：轻创
- 英文名：Qintra
- 品牌标语：让便捷融入生活

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19
- **样式**: Tailwind CSS 4
- **数据库**: SQLite (better-sqlite3) + Drizzle ORM
- **认证**: JWT (jose) + httpOnly cookie + bcryptjs
- **邮件**: Brevo SMTP (nodemailer)
- **安全验证**: Cloudflare Turnstile
- **AI**: Ollama 本地推理

## 功能模块

- 校园快递代取
- 旧书广场
- 校园钱包与结算申请
- 晴窗功能页
- AI 陪伴模块
- 独立管理员网站
- 统一注册 / 登录

## 认证方式

- 普通用户使用邮箱验证码注册，注册时设置密码
- 普通用户登录使用邮箱 + 密码
- 管理员登录使用邮箱 + 密码
- 注册验证码通过 Brevo SMTP 发送
- 普通用户默认 `app_role = 'user'`
- 管理员与普通用户通过 `profiles.app_role` 区分
- 会话通过 JWT 存储在 `qc_session` httpOnly cookie 中，有效期 7 天

## 页面路由

| 路由 | 说明 |
|------|------|
| `/` | 首页 |
| `/auth/login` | 普通用户登录 |
| `/auth/register` | 普通用户注册 |
| `/admin/login` | 管理员登录 |
| `/admin` | 管理员后台 |
| `/campus` | 校园服务首页 |
| `/campus/express` | 快递代取 |
| `/campus/books` | 旧书广场 |
| `/campus/orders` | 我的订单 |
| `/campus/wallet` | 校园钱包 |
| `/draw` | 晴窗 |
| `/ai-companion` | AI 陪伴 |
| `/ai-companion/characters/new` | 创建 AI 角色 |
| `/ai-companion/characters/[id]` | AI 角色详情 |
| `/ai-companion/conversations/[id]` | AI 对话 |
| `/profile` | 个人资料 |
| `/profile/setup` | 完善资料 |

## API 路由

| 路由 | 说明 |
|------|------|
| `GET /api/auth/me` | 获取当前登录用户 |
| `POST /api/auth/logout` | 退出登录 |
| `POST /api/campus/payments/notify` | 支付回调通知 |
| `/api/ai/*` | AI 陪伴相关接口 |

## 开发

```bash
npm install
npm run db:migrate   # 初始化 SQLite 数据库
npm run dev          # 启动开发服务器
```

## 构建

```bash
npm run build        # 生产构建 (使用 webpack)
npm run start        # 启动生产服务器
```

> 注意：由于项目目录路径包含中文字符，Turbopack 存在已知 bug，生产构建已配置为使用 webpack。开发模式下 Turbopack 仍可正常工作。

## 环境变量

| 变量 | 说明 |
|------|------|
| `AUTH_JWT_SECRET` | JWT 签名密钥 |
| `BREVO_SMTP_USER` | Brevo SMTP 用户名 |
| `BREVO_SMTP_PASS` | Brevo SMTP 密码 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile 站点密钥 |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile 服务端密钥 |
| `ZPAY_PID` | ZPay 商户 ID |
| `ZPAY_KEY` | ZPay 商户密钥 |
| `ZPAY_NOTIFY_URL` | ZPay 支付回调地址 |
| `ZPAY_RETURN_URL` | ZPay 支付返回地址 |

## 数据存储

- 数据库文件: `data/qingchuang.db`
- AI 数据: `data/ai-companion.json`
- 用户头像: `public/uploads/avatars/`
