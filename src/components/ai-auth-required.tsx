import Link from 'next/link'
import { Button } from '@/components/UI/Button'
import { Card, CardContent } from '@/components/UI/Card'

export function AiAuthRequired() {
  return (
    <div className="mx-auto max-w-3xl py-20">
      <Card>
        <CardContent className="space-y-5 p-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">先登录，再进入 AI 陪伴</h1>
          <p className="leading-7 text-slate-600">
            登录后就可以创建角色、继续聊天，并把会话内容保留在自己的轻创账号里。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild>
              <Link href="/auth/login">邮箱登录</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/register">邮箱注册</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
