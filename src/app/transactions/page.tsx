"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Plus, History, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { NewTransactionModal } from "@/components/NewTransactionModal"
import { DataActions } from "@/components/DataActions"

export const dynamic = "force-dynamic"

export default function TransactionsPage() {
    const supabase = createClient()
    const [allTransactions, setAllTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)

    const fetchTransactions = async () => {
        setLoading(true)
        const { data } = await supabase
            .from("transactions")
            .select("*, clients(name)")
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(50)
        if (data) setAllTransactions(data)
        setLoading(false)
    }

    useEffect(() => { fetchTransactions() }, [])

    const totalCredito = allTransactions.filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + Number(t.amount), 0)
    const totalAbono = allTransactions.filter((t: any) => t.type === 'payment').reduce((s: number, t: any) => s + Number(t.amount), 0)

    const avatarColors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6", "#06b6d4", "#f97316", "#84cc16"]

    return (
        <div className="space-y-6 max-w-[1100px]">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Transacciones</h1>
                    <p className="text-slate-500 text-sm mt-1">Historial de compras a crédito y abonos de clientes.</p>
                </div>
                <div className="flex items-center gap-4">
                    <DataActions type="transactions" data={allTransactions} onImportSuccess={fetchTransactions} />
                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 text-white text-sm font-bold rounded-xl transition-all"
                        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 4px 15px rgba(34,197,94,0.35)" }}
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Transacción
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-5">
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute right-4 top-4 opacity-[0.06]">
                        <ArrowUpRight className="w-24 h-24 text-red-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <ArrowUpRight className="w-4 h-4 text-red-500" />
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Total Crédito</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">
                        ${totalCredito.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">{allTransactions.filter(t => t.type === 'credit').length} operaciones</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute right-4 top-4 opacity-[0.06]">
                        <ArrowDownLeft className="w-24 h-24 text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Total Cobrado</span>
                    </div>
                    <p className="text-3xl font-black text-emerald-700">
                        ${totalAbono.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">{allTransactions.filter(t => t.type === 'payment').length} pagos</p>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-base font-black text-slate-900">Historial Reciente</h2>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: "#f8faff" }}>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Entidad</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Notas</th>
                                <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-16 text-center">
                                    <div className="flex items-center justify-center gap-2 text-slate-400">
                                        <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                                        <span className="text-sm">Cargando...</span>
                                    </div>
                                </td></tr>
                            ) : allTransactions.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">
                                    No hay transacciones registradas aún.
                                </td></tr>
                            ) : allTransactions.map((t) => {
                                const name = t.clients?.name || "Sin cliente"
                                const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                                const color = avatarColors[name.charCodeAt(0) % avatarColors.length]
                                const trxRef = `#TRX-${String(t.id).substring(0, 6).toUpperCase()}`

                                return (
                                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                            {new Date(t.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                                                    style={{ background: color }}>
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{name}</p>
                                                    <p className="text-[10px] text-slate-400">{trxRef}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400 max-w-[180px] truncate">
                                            {t.description || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {t.type === 'credit' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-600 border border-red-100">
                                                    <ArrowUpRight className="w-3 h-3" /> Crédito
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    <ArrowDownLeft className="w-3 h-3" /> Cobranza
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-black ${t.type === 'credit' ? 'text-slate-800' : 'text-emerald-600'}`}>
                                                {t.type === 'credit' ? '' : '+'}${Number(t.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {allTransactions.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400">
                            Mostrando <span className="font-semibold text-slate-600">1–{allTransactions.length}</span> resultados
                        </p>
                    </div>
                )}
            </div>

            <NewTransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchTransactions} />
        </div>
    )
}
