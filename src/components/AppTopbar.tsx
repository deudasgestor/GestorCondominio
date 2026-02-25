"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Search, AlertCircle, TrendingUp, User, X } from "lucide-react"
import { NewTransactionModal } from "@/components/NewTransactionModal"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"

interface Notification {
    id: string
    clientId: string
    clientName: string
    type: "mora" | "limite"
    message: string
    date: Date
}

export function AppTopbar() {
    const [openModal, setOpenModal] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchAlerts()

        // Clic fuera para cerrar
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowNotifications(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    async function fetchAlerts() {
        setLoading(true)
        const { data: clients } = await supabase
            .from("clients")
            .select("*, transactions(amount, type, date)")

        if (clients) {
            const alerts: Notification[] = []
            clients.forEach((c: any) => {
                const balance = c.transactions.reduce((acc: number, t: any) => {
                    return t.type === 'credit' ? acc + Number(t.amount) : acc - Number(t.amount)
                }, 0)

                if (balance <= 0) return

                // Alerta de Límite (>90%)
                if (c.credit_limit > 0) {
                    const usage = (balance / c.credit_limit) * 100
                    if (usage >= 90) {
                        alerts.push({
                            id: `limite-${c.id}`,
                            clientId: c.id,
                            clientName: c.name,
                            type: "limite",
                            message: `Ha usado el ${usage.toFixed(0)}% de su límite de crédito.`,
                            date: new Date()
                        })
                    }
                }

                // Alerta de Mora (>30 días de inactividad con saldo)
                const lastTx = [...c.transactions].sort((a: any, b: any) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )[0]

                if (lastTx) {
                    const daysDiff = Math.floor((new Date().getTime() - new Date(lastTx.date).getTime()) / (1000 * 60 * 60 * 24))
                    if (daysDiff > 30) {
                        alerts.push({
                            id: `mora-${c.id}`,
                            clientId: c.id,
                            clientName: c.name,
                            type: "mora",
                            message: `Sin movimientos hace ${daysDiff} días con saldo pendiente.`,
                            date: new Date()
                        })
                    }
                }
            })
            setNotifications(alerts)
        }
        setLoading(false)
    }

    return (
        <>
            <div className="sticky top-0 z-30 flex items-center gap-4 px-8 py-4 bg-[#f0f2f5] border-b border-slate-200/60">
                {/* Search */}
                <div className="relative flex-1 max-w-[460px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar transacciones, clientes..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    {/* Notifications */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <Bell className="w-4 h-4 text-slate-500" />
                            {notifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                        </button>

                        {/* Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                    <h3 className="text-sm font-black text-slate-900">Notificaciones</h3>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                        {notifications.length} Alertas
                                    </span>
                                </div>
                                <div className="max-h-[360px] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                            <p className="text-xs text-slate-400">No hay alertas activas en este momento.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">
                                            {notifications.map(n => (
                                                <Link
                                                    key={n.id}
                                                    href={`/clients/${n.clientId}`}
                                                    onClick={() => setShowNotifications(false)}
                                                    className="block p-4 hover:bg-slate-50 transition-colors group"
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'mora' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'
                                                            }`}>
                                                            {n.type === 'mora' ? <AlertCircle className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                                                                {n.clientName}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                                                                {n.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-slate-50/50 border-t border-slate-50">
                                    <Link
                                        href="/clients"
                                        onClick={() => setShowNotifications(false)}
                                        className="block w-full py-2 text-center text-[11px] font-bold text-slate-500 hover:text-emerald-600 transition-colors"
                                    >
                                        Ver Directorio Completo
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* New Transaction CTA */}
                    <button
                        onClick={() => setOpenModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-all"
                        style={{
                            background: "linear-gradient(135deg, #22c55e, #16a34a)",
                            boxShadow: "0 4px 15px rgba(34,197,94,0.35)"
                        }}
                    >
                        <span className="text-lg leading-none">+</span>
                        Nuevo Movimiento
                    </button>
                </div>
            </div>

            <NewTransactionModal isOpen={openModal} onClose={() => setOpenModal(false)} />
        </>
    )
}
