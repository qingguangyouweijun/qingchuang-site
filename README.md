# 轻创 Qintra

品牌信息：

- 中文名：轻创
- 英文名：Qintra
- 品牌标语：让便捷融入生活

这个项目现在已经把以下模块整合进同一套 Next.js + Supabase 应用：

- 校园快递代取
- 旧书广场
- 校园钱包与结算申请
- 晴窗功能页
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
晴窗入口：`/draw`
AI 陪伴入口：`/ai-companion`
管理员网站：`/admin`

## 本次新增页面

- `/campus`
- `/campus/express`
- `/campus/books`
- `/campus/orders`
- `/campus/wallet`
- `/draw`
- `/ai-companion`
- `/ai-companion/characters/new`
- `/ai-companion/characters/[id]`
- `/ai-companion/conversations/[id]`
- `/admin`
- `/api/campus/payments/notify`
- `/api/ai/characters`
