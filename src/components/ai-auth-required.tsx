import Link from 'next/link'
import { Button } from '@/components/UI/Button'
import { Card, CardContent } from '@/components/UI/Card'

export function AiAuthRequired() {
  return (
    <div className="mx-auto max-w-3xl py-20">
      <Card>
        <CardContent className="space-y-5 p-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">请先登录后再进入 AI 陪伴</h1>
          <p className="leading-7 text-slate-600">
            AI 陪伴继续使用轻创统一账号。登录后即可创建角色、开始聊天并保存会话内容。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/login"><Button>邮箱登录</Button></Link>
            <Link href="/auth/register"><Button variant="outline">邮箱注册</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}