"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    Receipt,
    LogOut,
    CreditCard,
    BarChart3,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/utils/cn"
import { useEffect, useState } from "react"

const mainMenu = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clientes", href: "/clients", icon: Users },
    { name: "Transacciones", href: "/transactions", icon: Receipt },
    { name: "Reportes", href: "#", icon: BarChart3 },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [userEmail, setUserEmail] = useState<string>("")

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserEmail(user.email || "")
        }
        getUser()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push("/login")
        router.refresh()
    }

    const initials = userEmail?.split("@")[0]?.substring(0, 2).toUpperCase() || "U"

    return (
        <aside className="flex flex-col h-screen w-[240px] fixed left-0 top-0 z-40" style={{ background: "#131c2e" }}>
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                    <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div>
                    <span className="text-white font-bold text-[15px] tracking-tight">FinanzasPro</span>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#4b5e7a" }}>Executive Suite</p>
                </div>
            </div>

            {/* User Profile Card */}
            <div className="mx-3 mb-4 p-3 rounded-xl" style={{ background: "#1a2640" }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">
                            {userEmail?.split("@")[0] || "Usuario"}
                        </p>
                        <p className="text-[10px] truncate" style={{ color: "#4b5e7a" }}>
                            {userEmail || "admin@finanzaspro.com"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                <p className="px-3 pb-2 text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#3a4d68" }}>
                    Menú Principal
                </p>
                {mainMenu.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "#" && pathname.startsWith(item.href + "/"))
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200",
                                isActive
                                    ? "text-white"
                                    : "hover:bg-white/5"
                            )}
                            style={isActive ? {
                                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)"
                            } : { color: "#6b7f99" }}
                        >
                            <item.icon className="w-[18px] h-[18px] shrink-0" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Logout */}
            <div className="p-3 mt-2" style={{ borderTop: "1px solid #1e2e45" }}>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 group hover:bg-red-500/10"
                    style={{ color: "#6b7f99" }}
                >
                    <LogOut className="w-[18px] h-[18px] group-hover:text-red-400 transition-colors shrink-0" />
                    <span className="group-hover:text-red-400 transition-colors">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    )
}
