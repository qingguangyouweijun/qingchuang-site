import Link from 'next/link'
import { Button } from '@/components/UI/Button'
import { Card, CardContent } from '@/components/UI/Card'

export function AiAuthRequired() {
  return (
    <div className="max-w-3xl mx-auto py-20">
      <Card>
        <CardContent className="p-10 text-center space-y-5">
          <h1 className="text-3xl font-bold text-slate-900">请先登录 AI 陪伴模块</h1>
          <p className="text-slate-600 leading-7">
            这个模块现在复用邮箱验证码登录。普通用户登录后可以直接创建角色和聊天，管理员仍然走独立后台。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/login"><Button>邮箱登录</Button></Link>
            <Link href="/auth/register"><Button variant="outline">邮箱注册</Button></Link>
            <Link href="/admin/login"><Button variant="secondary">管理员登录</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}