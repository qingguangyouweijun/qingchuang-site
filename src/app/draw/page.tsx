import Link from 'next/link'
import { HeartHandshake, MessageCircleHeart, ShieldCheck, UserRound } from 'lucide-react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { Badge } from '@/components/UI/Badge'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'

const highlights = [
  {
    title: '完善个人资料',
    desc: '补充头像、昵称和基础信息后，晴窗里的展示会更完整，也更方便建立互动。',
    icon: UserRound,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    title: '同校互动交流',
    desc: '围绕校园生活、兴趣话题和日常状态展开交流，让互动更轻松自然。',
    icon: MessageCircleHeart,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: '友好与守护',
    desc: '统一沿用轻创账户体系和基础安全能力，减少重复注册和割裂体验。',
    icon: ShieldCheck,
    color: 'bg-sky-50 text-sky-600',
  },
]

export default function DrawPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-8 py-10">
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-none shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
            <CardContent className="space-y-6 p-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">轻创功能</Badge>
                <Badge variant="outline">晴窗</Badge>
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">晴窗</h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                  晴窗是轻创里的校园互动功能，适合完善资料、认识同校、寻找同频话题，也能和校园服务、AI 陪伴保持同一个使用入口。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/profile/setup">完善我的资料</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/campus">进入校园服务</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
            <CardHeader>
              <CardTitle>适合从这里开始</CardTitle>
              <CardDescription>如果你是第一次进入晴窗，先把资料补全，再慢慢展开互动会更顺手。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                先完善头像、昵称和基础信息，让其他人看到的是清晰、完整的个人展示。
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                再进入校园服务或继续使用 AI 陪伴，所有常用入口都共用同一套轻创账号。
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                晴窗会保持轻松自然的互动氛围，不需要你先读一大堆说明，直接进入使用即可。
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <Card key={item.title} className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-4 p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <CardTitle>与轻创其他功能一起使用</CardTitle>
            <CardDescription>你可以在晴窗之外继续使用校园服务和 AI 陪伴，不需要切换成另一套站点。</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-sm leading-7 text-slate-600 md:grid-cols-3">
            <div className="rounded-2xl bg-emerald-50 p-5">快递代取和旧书广场仍然放在校园服务里，适合从校园主线进入。</div>
            <div className="rounded-2xl bg-amber-50 p-5">如果你想先认识同校或完善个人展示，可以先从晴窗开始。</div>
            <div className="rounded-2xl bg-sky-50 p-5">需要陪聊、角色互动或长期聊天时，可以直接进入 AI 陪伴继续使用。</div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
