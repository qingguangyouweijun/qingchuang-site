import { MainLayout } from "@/components/Layout/MainLayout"
import { Button } from "@/components/UI/Button"
import { Card, CardContent } from "@/components/UI/Card"
import { ArrowRight, Heart, Shield, Sparkles } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-8 py-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-rose-200/40 to-purple-200/40 rounded-full blur-[120px] -z-10" />
        
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/50 backdrop-blur-sm border border-white/60 text-rose-600 text-sm font-medium animate-fade-in mb-4">
          <Sparkles className="w-4 h-4 mr-2" />
          大学生专属实名交友平台
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <span className="text-gray-800">晴窗</span>
          <span className="text-gradient">葳蕤</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto font-light animate-slide-up" style={{ animationDelay: "0.2s" }}>
          在繁花似锦的年华里，遇见那个让你怦然心动的人。
          <br className="hidden md:block" />
          真实、安全、浪漫的校园社交体验。
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 pt-8 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <Link href="/draw">
            <Button size="lg" className="rounded-full px-10 text-lg h-14 shadow-rose-300/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
              开始邂逅 <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="glass" size="lg" className="rounded-full px-10 text-lg h-14">
              了解更多
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 w-full max-w-4xl animate-fade-in mx-auto" style={{ animationDelay: "0.5s" }}>
          {[
            { label: "注册用户", value: "10,000+" },
            { label: "成功匹配", value: "5,200+" },
            { label: "覆盖高校", value: "100+" },
            { label: "好评率", value: "99%" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-3xl font-bold text-rose-600">{stat.value}</span>
              <span className="text-sm text-gray-500 mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800">
          为什么选择<span className="text-rose-600">晴窗葳蕤</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Sparkles,
              title: "随机邂逅",
              desc: "打破固有的社交圈子，通过智能算法为您匹配最契合的灵魂。",
              color: "text-amber-500",
              bg: "bg-amber-50"
            },
            {
              icon: Shield,
              title: "真实可信",
              desc: "严格的学生身份认证机制，确保每一位用户都是真实的在校大学生。",
              color: "text-rose-500",
              bg: "bg-rose-50"
            },
            {
              icon: Heart,
              title: "隐私保护",
              desc: "多重隐私设置，您可以完全掌控自己的信息展示范围和联系方式。",
              color: "text-purple-500",
              bg: "bg-purple-50"
            }
          ].map((feature, i) => (
            <Card key={i} className="border-none hover:bg-white/80 transition-all duration-500">
              <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-2 rotate-3 hover:rotate-6 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 mb-20">
        <div className="glass rounded-3xl p-10 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-100 rounded-full blur-3xl -z-10 opacity-50" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 rounded-full blur-3xl -z-10 opacity-50" />
          
          <h2 className="text-3xl font-bold text-center mb-12">心动故事</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/60 p-6 rounded-2xl shadow-sm">
              <p className="text-gray-600 italic mb-4">"本来只是抱着试一试的心态，没想到真的遇到了和我一样喜欢摄影的她。感谢晴窗葳蕤！"</p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">L</div>
                <div>
                  <p className="text-sm font-bold text-gray-800">李同学</p>
                  <p className="text-xs text-gray-500">浙江大学 · 大三</p>
                </div>
              </div>
            </div>
            <div className="bg-white/60 p-6 rounded-2xl shadow-sm">
              <p className="text-gray-600 italic mb-4">"界面的设计真的太美了，完全符合我的审美。在这里交友感觉很放心，也很浪漫。"</p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">W</div>
                <div>
                  <p className="text-sm font-bold text-gray-800">王同学</p>
                  <p className="text-xs text-gray-500">复旦大学 · 研一</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
