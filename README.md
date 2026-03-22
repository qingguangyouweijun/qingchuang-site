# Qingchuang Campus Integration

这个项目现在已经把以下模块整合进同一套 Next.js + Supabase 应用：

- 校园快递代取
- 旧书广场
- 校园钱包与结算申请
- AI 陪伴模块
- 独立管理员网站
- 统一注册 / 登录

## 统一注册方式

沿用原项目的注册方式：

- 使用 11 位数字账号注册
- 登录时自动映射为 `${account}@qingchuang.local`
- 普通用户默认 `app_role = 'user'`
- 管理员与普通用户通过 `profiles.app_role` 区分

管理员登录入口：`/admin/login`
普通用户登录入口：`/auth/login`
普通用户首页：`/campus`
AI 陪伴入口：`/ai-companion`
管理员网站：`/admin`

## 本次新增页面

- `/campus`
- `/campus/express`
- `/campus/books`
- `/campus/orders`
- `/campus/wallet`
- `/ai-companion`
- `/ai-companion/characters/new`
- `/ai-companion/characters/[id]`
- `/ai-companion/conversations/[id]`
- `/admin`
- `/api/campus/payments/notify`
- `/api/ai/characters`
- `/api/ai/conversations`
- `/api/ai/memories/[characterId]`

## AI 陪伴说明

AI 陪伴模块已经融进当前站点，不再使用原来那套独立 JWT 注册登录。

当前实现方式：

- 直接复用当前 Supabase 登录态
- 每个普通用户都可以创建自己的角色和会话
- 角色支持模板、头像、关系、性格、说话风格、背景、边界、开场白
- 每个角色支持多条历史会话
- 发送消息后会自动更新长期记忆摘要
- AI 数据暂时存放在服务端本地文件：`data/ai-companion.json`

运行前需要保证服务端有可访问的 Ollama：

- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`

默认模型示例：

- `qwen3:1.7b`
- `qwen3:4b`

## 支付接入

已接入兼容易支付的 ZPay 逻辑：

- 下单接口：`/mapi.php`
- 订单查询：`/api.php?act=order`
- 支付回调：`/api/campus/payments/notify`

支持支付方式：

- `wxpay`
- `alipay`

## 必要环境变量

复制 `.env.example` 为 `.env.local`，至少补齐：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_BASE_URL`
- `ZPAY_PID`
- `ZPAY_PKEY`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`

说明：

- `SUPABASE_SERVICE_ROLE_KEY` 是必须的，因为管理员后台、跨用户余额变动、支付回调都依赖它。
- `ZPAY_PKEY` 只能放后端环境变量，不要暴露到前端。
- AI 陪伴模块虽然复用了 Supabase 登录，但角色、会话、记忆当前仍保存在本地 JSON 文件里，适合单机部署 MVP。

## 数据库变更

需要把最新的 [supabase/schema.sql](./supabase/schema.sql) 执行到 Supabase。

本次新增内容包括：

- `profiles.app_role`
- 校园钱包余额字段
- `campus_express_orders`
- `campus_book_posts`
- `campus_book_orders`
- `campus_payment_records`
- `campus_settlement_applications`
- `campus_balance_logs`

## 启动

```bash
npm install
npm run dev
```

如果要用 AI 陪伴，请额外保证本机或服务器 Ollama 已启动，并拉取好对应模型。

打开：

- [https://qingchuang.site](https://qingchuang.site)
- [https://qingchuang.site/campus](https://qingchuang.site/campus)
- [https://qingchuang.site/ai-companion](https://qingchuang.site/ai-companion)
- [https://qingchuang.site/admin](https://qingchuang.site/admin)

## 管理员账号说明

注册接口默认创建普通用户。

如果你要把某个账号设成管理员，有两种方式：

1. 先用普通注册创建账号，再在数据库里把 `profiles.app_role` 改成 `admin`
2. 使用现有管理员登录后台，在 `/admin` 页面把用户切换为管理员

## 已验证

完成 `next build` 构建验证后，这套新增页面和服务端逻辑即可直接部署。
