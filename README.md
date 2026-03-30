# 轻创 Qintra

轻创是一个面向校园生活的综合站点，当前包含校园服务、晴窗、AI 陪伴、账户中心和管理员后台。

## 当前功能

- 校园服务
  - 快递代取
  - 旧书广场
- 晴窗
  - 资料完善
  - 条件设置
  - 随机抽取与历史记录
- AI 陪伴
  - 角色创建
  - 对话与长期记忆
- 我的
  - 账户基础资料
  - 校园钱包
  - 订单中心
- 管理员后台
  - 用户与订单查看
  - 结算申请处理

## 技术栈

- Next.js 16（App Router）
- React 19
- Tailwind CSS 4
- MySQL + Drizzle ORM
- JWT + httpOnly Cookie 会话
- Brevo 邮件发送
- BigModel `glm-4.7-flash`
- ZPay 支付

## 认证方式

- 普通用户
  - 邮箱验证码注册并设置密码
  - 邮箱 + 密码登录
- 管理员
  - 独立管理员入口登录
- 会话
  - 登录状态保存在 `qc_session` cookie 中

## 主要页面

| 路径 | 说明 |
| --- | --- |
| `/` | 首页 |
| `/auth/login` | 用户登录 |
| `/auth/register` | 用户注册 |
| `/admin/login` | 管理员登录 |
| `/admin` | 管理员后台 |
| `/campus` | 校园服务首页 |
| `/campus/express` | 快递代取概览 |
| `/campus/express/order` | 快递代取下单 |
| `/campus/express/runner` | 快递代取接单 |
| `/campus/books` | 旧书广场 |
| `/draw` | 晴窗首页 |
| `/draw/start` | 晴窗抽取 |
| `/draw/history` | 晴窗抽取历史 |
| `/ai-companion` | AI 陪伴首页 |
| `/ai-companion/characters/new` | 新建 AI 角色 |
| `/ai-companion/characters/[id]` | AI 角色详情 |
| `/ai-companion/conversations/[id]` | AI 对话 |
| `/profile` | 我的 |
| `/profile/setup` | 资料完善 |
| `/profile/wallet` | 校园钱包 |
| `/profile/orders` | 订单中心 |

## 本地开发

安装依赖：

```bash
npm install
```

准备 MySQL 数据库后初始化 schema：

```bash
npm run db:migrate
```

启动开发环境：

```bash
npm run dev
```

生产构建：

```bash
npm run build
npm run start
```

## 环境变量

至少需要以下环境变量：

```env
AUTH_JWT_SECRET=
APP_BASE_URL=
NEXT_PUBLIC_APP_URL=

DATABASE_URL=mysql://user:password@127.0.0.1:3306/qingchuang
# 或拆分写法
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=qingchuang

BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=

BIGMODEL_API_KEY=
BIGMODEL_BASE_URL=https://open.bigmodel.cn/api/paas/v4
BIGMODEL_MODEL=glm-4.7-flash

ZPAY_PID=
ZPAY_PKEY=
ZPAY_CID=
ZPAY_GATEWAY_BASE_URL=https://zpayz.cn

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

如果你仍然保留 Turnstile，也可以继续配置：

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

## 数据与上传目录

- AI 数据：`data/ai-companion.json`
- 用户头像：`public/uploads/avatars/`
- 结算收款码：`public/uploads/qr-codes/`

## 当前约定

- 校园钱包和订单中心已经统一收入口径到“我的”页面。
- 结算申请必须附带收款码。
- 管理员处理结算后，用户状态会从“结算申请中”变为“已结算”。
- 数据库已切换为 MySQL；如果你此前在旧 SQLite 文件里有数据，需要自行导出并导入 MySQL。

## 部署建议

服务器部署推荐流程：

```bash
git fetch origin
git checkout main
git reset --hard origin/main
npm install
npm run db:migrate
rm -rf .next
npm run build
pm2 restart qingchuang --update-env || pm2 start npm --name qingchuang --cwd /opt/qingchuang -- start
pm2 save
```
