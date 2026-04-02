"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, LayoutDashboard, MessageSquare, Settings } from "lucide-react"

interface SidebarProps {
  hospital: { id: string; name: string; specialty: string } | null
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "대시보드" },
  { href: "/dashboard/reviews", icon: MessageSquare, label: "리뷰 관리" },
  { href: "/dashboard/settings", icon: Settings, label: "설정" },
]

export default function Sidebar({ hospital }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-40">
      {/* 로고 */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary-600" />
          <div>
            <div className="font-bold text-gray-900 text-sm">ReviewGuard Med</div>
            <div className="text-xs text-gray-400">평판 관리 플랫폼</div>
          </div>
        </Link>
      </div>

      {/* 병원 정보 */}
      {hospital && (
        <div className="px-4 py-3 mx-3 mt-4 bg-primary-50 rounded-xl">
          <p className="font-semibold text-primary-900 text-sm truncate">{hospital.name}</p>
          <p className="text-xs text-primary-600">{hospital.specialty}</p>
        </div>
      )}

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition font-medium text-sm ${
                isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* 버전 */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">v0.1.0 MVP</p>
      </div>
    </aside>
  )
}
