"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    Receipt,
    LogOut,
    CreditCard,
    Settings,
    ShieldCheck
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/utils/cn"
import { useEffect, useState } from "react"

const mainMenu = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clientes", href: "/clients", icon: Users },
    { name: "Transacciones", href: "/transactions", icon: Receipt },
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

    return (
        <aside className="flex flex-col h-screen w-[240px] bg-[#0f172a] fixed left-0 top-0 z-40">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                    <span className="text-white font-bold text-base tracking-tight">FinanzasPro</span>
                    <p className="text-[11px] text-slate-400">Admin Portal</p>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {mainMenu.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-150",
                                isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className="w-[18px] h-[18px]" />
                            {item.name}
                        </Link>
                    )
                })}

                <div className="pt-6 pb-2 px-3">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold">Configuración</p>
                </div>
                <Link
                    href="#"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    <Settings className="w-[18px] h-[18px]" />
                    Preferencias
                </Link>
                <Link
                    href="#"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    <ShieldCheck className="w-[18px] h-[18px]" />
                    Seguridad
                </Link>
            </nav>

            {/* User section */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {userEmail?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-medium text-white truncate">{userEmail || "Usuario"}</p>
                        <p className="text-[10px] text-slate-500">Cerrar Sesión</p>
                    </div>
                    <LogOut className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
            </div>
        </aside>
    )
}
