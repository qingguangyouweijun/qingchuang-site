# 轻创 Qintra

轻创是一个面向校园场景的轻量生活服务平台，当前主站以企业官网展示、服务结构说明和备案准备信息承接为主，后续再逐步接入正式业务入口与小程序能力。

## 当前定位

- 企业官网与品牌展示
- 校园服务能力说明
- 主站部署与备案承接
- 后续业务系统与小程序接入底座

## 当前服务方向

- 快递代取
- 旧书流转
- 零食快递

## 技术栈

- Next.js 16（App Router）
- React 19
- Tailwind CSS 4
- MySQL + Drizzle ORM
- JWT + httpOnly Cookie 会话
- Brevo 邮件发送
- ZPay 支付

## 主要页面

| 路径 | 说明 |
| --- | --- |
| `/` | 企业官网首页 |
| `/auth/login` | 用户登录 |
| `/auth/register` | 用户注册 |
| `/admin/login` | 管理员登录 |
| `/admin` | 管理员后台 |
| `/campus` | 校园服务总览 |
| `/campus/express/order` | 快递代取下单 |
| `/campus/express/runner` | 快递代取接单 |
| `/campus/books/sell` | 旧书售卖 |
| `/campus/books/order` | 旧书下单 |
| `/campus/snacks` | 零食快递 |
| `/profile` | 我的 |
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

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=qingchuang

# 或者改用单条连接串
DATABASE_URL=mysql://user:password@127.0.0.1:3306/qingchuang

BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=

ZPAY_PID=
ZPAY_PKEY=
ZPAY_CID=
ZPAY_GATEWAY_BASE_URL=https://zpayz.cn

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 数据与上传目录

- 用户头像：`public/uploads/avatars/`
- 结算收款码：`public/uploads/qr-codes/`

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

## 当前说明

- 官网首页优先服务于企业展示与备案准备，避免在首屏直接暴露过重的动态业务内容。
- 业务模块仍然保留在站内路由中，后续可按备案、部署与运营节奏继续开放。
- ICP 备案号、公安联网备案信息与正式客服信息，建议在备案通过后补充到首页与页脚。

