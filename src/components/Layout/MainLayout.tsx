import { Header } from './Header'
import { Footer } from './Footer'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#f6f8f6]">
      <Header />
      <main className="container mx-auto flex-1 px-4 pb-12 pt-24">
        {children}
      </main>
      <Footer />
    </div>
  )
}