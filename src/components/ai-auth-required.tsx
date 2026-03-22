import Link from 'next/link'
import { Button } from '@/components/UI/Button'
import { Card, CardContent } from '@/components/UI/Card'

export function AiAuthRequired() {
  return (
    <div className="max-w-3xl mx-auto py-20">
      <Card>
        <CardContent className="p-10 text-center space-y-5">
          <h1 className="text-3xl font-bold text-gray-900">请先登录 AI 陪伴模块</h1>
          <p className="text-gray-600 leading-7">
            这个模块复用当前 11 位数字账号体系。普通用户登录后可直接创建角色和聊天，管理员仍走独立后台。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/login"><Button>普通用户登录</Button></Link>
            <Link href="/auth/register"><Button variant="outline">注册账号</Button></Link>
            <Link href="/admin/login"><Button variant="secondary">管理员登录</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
