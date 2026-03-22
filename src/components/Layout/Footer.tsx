import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full py-8 mt-auto glass border-t border-white/20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-gray-800">轻创 Qintra</h3>
            <p className="text-sm text-gray-500 mt-1">让便捷融入生活</p>
          </div>

          <div className="flex space-x-6 text-sm text-gray-600">
            <Link href="#" className="hover:text-emerald-600 transition-colors">关于我们</Link>
            <Link href="#" className="hover:text-emerald-600 transition-colors">隐私政策</Link>
            <Link href="#" className="hover:text-emerald-600 transition-colors">联系客服</Link>
          </div>

          <div className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} 轻创 Qintra. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
