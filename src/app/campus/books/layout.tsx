import { ReactNode } from 'react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { CampusSubnav } from '@/components/campus/CampusSubnav'
import { BooksSubnav } from '@/components/campus/BooksSubnav'

export default function CampusBooksLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <CampusSubnav />
        <BooksSubnav />
        {children}
      </div>
    </MainLayout>
  )
}
