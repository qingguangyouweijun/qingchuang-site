import { Header } from './Header'
import { Footer } from './Footer'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-8%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/28 blur-[110px] animate-float" />
        <div className="absolute bottom-[-12%] right-[-8%] w-[40%] h-[40%] rounded-full bg-sky-200/28 blur-[110px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[42%] left-[42%] w-[18%] h-[18%] rounded-full bg-amber-100/45 blur-[90px] animate-pulse-glow" />
      </div>

      <Header />
      <main className="flex-1 pt-20 pb-12 px-4 container mx-auto">
        {children}
      </main>
      <Footer />
    </div>
  )
}