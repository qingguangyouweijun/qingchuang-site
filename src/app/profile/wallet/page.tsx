import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MainLayout } from "@/components/Layout/MainLayout"
import ProfileWalletClient, { type WalletData } from "@/components/profile/ProfileWalletClient"
import { Button } from "@/components/UI/Button"
import { Card, CardContent } from "@/components/UI/Card"
import { getCurrentUser } from "@/lib/actions/auth"
import { getCampusWalletData } from "@/lib/actions/campus"

export default async function ProfileWalletPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl py-20">
          <Card>
            <CardContent className="space-y-4 p-10 text-center">
              <h1 className="text-3xl font-bold text-slate-900">请先登录后查看校园钱包</h1>
              <p className="text-slate-600">校园钱包会展示代取与旧书收入、结算申请和余额流水。</p>
              <Link href="/auth/login">
                <Button>去邮箱登录</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  let data: WalletData | null = null
  let loadError = ""

  try {
    data = (await getCampusWalletData()) as WalletData
  } catch (error) {
    loadError = error instanceof Error ? error.message : "校园钱包数据读取失败，请稍后重试。"
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl py-20">
          <Card>
            <CardContent className="space-y-4 p-10 text-center">
              <h1 className="text-3xl font-bold text-slate-900">校园钱包暂时不可用</h1>
              <p className="text-slate-600">{loadError || "校园钱包数据读取失败，请稍后重试。"}</p>
              <Link href="/profile">
                <Button variant="outline">返回我的</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-8 py-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回我的
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-slate-900">校园钱包</h1>
          <p className="mt-3 max-w-3xl text-slate-600 leading-7">
            这里统一管理快递代取收入、旧书成交收入、结算申请和余额流水。提交结算时请附带收款码，管理员处理后状态会同步更新。
          </p>
        </div>

        <ProfileWalletClient initialData={data} />
      </div>
    </MainLayout>
  )
}
