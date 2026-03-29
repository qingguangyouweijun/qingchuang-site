import { ReactNode } from 'react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { CampusSubnav } from '@/components/campus/CampusSubnav'
import { ExpressSubnav } from '@/components/campus/ExpressSubnav'

export default function CampusExpressLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <CampusSubnav />
        <ExpressSubnav />
        {children}
      </div>
    </MainLayout>
  )
}
