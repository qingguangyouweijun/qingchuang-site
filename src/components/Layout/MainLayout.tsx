import { Header } from "./Header"
import { Footer } from "./Footer"

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-200/30 blur-[100px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] rounded-full bg-amber-100/40 blur-[80px] animate-pulse-glow" />
      </div>
      
      <Header />
      <main className="flex-1 pt-20 pb-12 px-4 container mx-auto">
        {children}
      </main>
      <Footer />
    </div>
  )
}
