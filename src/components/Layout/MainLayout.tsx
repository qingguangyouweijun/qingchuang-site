import { Header } from './Header'
import { Footer } from './Footer'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(220,237,223,0.55),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(254,243,199,0.45),transparent_22%),linear-gradient(180deg,#f8fbf7_0%,#fcfcf8_48%,#ffffff_100%)]" />
      <Header />
      <main className="container mx-auto flex-1 px-4 pb-12 pt-24">
        {children}
      </main>
      <Footer />
    </div>
  )
}