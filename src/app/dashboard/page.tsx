import { createClient } from "@/utils/supabase/server"
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, CreditCard, Banknote, Wallet, Filter, Download } from "lucide-react"
import Link from "next/link"
import { DashboardTrends } from "@/components/DashboardTrends"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
    const supabase = await createClient()

    // Obtener transacciones de los últimos 6 meses
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const { data: allTransactions } = await supabase
        .from("transactions")
        .select("amount, type, date")
        .gte("date", sixMonthsAgo.toISOString())

    // Chart data
    const months = []
    for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        months.push({ key: d.toISOString().substring(0, 7), label: d.toLocaleDateString("es-MX", { month: "short" }) })
    }
    const chartData = months.map((m: any) => {
        const mt = allTransactions?.filter((t: any) => t.date.startsWith(m.key)) || []
        return {
            month: m.label,
            credito: mt.filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + Number(t.amount), 0),
            cobranza: mt.filter((t: any) => t.type === 'payment').reduce((s: number, t: any) => s + Number(t.amount), 0),
        }
    })

    // Mes actual vs mes anterior
    const currentMonthKey = new Date().toISOString().substring(0, 7)
    const prevDate = new Date(); prevDate.setMonth(prevDate.getMonth() - 1)
    const prevMonthKey = prevDate.toISOString().substring(0, 7)

    const thisMonth = allTransactions?.filter((t: any) => t.date.startsWith(currentMonthKey)) || []
    const prevMonth = allTransactions?.filter((t: any) => t.date.startsWith(prevMonthKey)) || []

    const creditosMes = thisMonth.filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + Number(t.amount), 0)
    const cobranzaMes = thisMonth.filter((t: any) => t.type === 'payment').reduce((s: number, t: any) => s + Number(t.amount), 0)
    const prevCreditosMes = prevMonth.filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + Number(t.amount), 0)
    const prevCobranzaMes = prevMonth.filter((t: any) => t.type === 'payment').reduce((s: number, t: any) => s + Number(t.amount), 0)

    const { data: totals } = await supabase.from("transactions").select("amount, type")
    const totalCreditos = totals?.filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + Number(t.amount), 0) || 0
    const totalPagos = totals?.filter((t: any) => t.type === 'payment').reduce((s: number, t: any) => s + Number(t.amount), 0) || 0
    const carteraActiva = totalCreditos - totalPagos

    const pctCredito = prevCreditosMes ? ((creditosMes - prevCreditosMes) / prevCreditosMes * 100) : 0
    const pctCobranza = prevCobranzaMes ? ((cobranzaMes - prevCobranzaMes) / prevCobranzaMes * 100) : 0

    const { data: recentTransactions } = await supabase
        .from("transactions")
        .select("*, clients(name)")
        .order("date", { ascending: false })
        .limit(8)

    const mesLabel = new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" })

    const statCards = [
        {
            label: "CRÉDITO MENSUAL",
            value: creditosMes,
            pct: pctCredito,
            icon: CreditCard,
            iconBg: "#fef2f2",
            iconColor: "#ef4444",
            svgPaths: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 6h16",
        },
        {
            label: "COBRANZA MENSUAL",
            value: cobranzaMes,
            pct: pctCobranza,
            icon: Banknote,
            iconBg: "#f0fdf4",
            iconColor: "#22c55e",
            svgPaths: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H9l3-3 3 3h-2v4z",
        },
        {
            label: "CARTERA ACTIVA TOTAL",
            value: carteraActiva,
            pct: null,
            icon: Wallet,
            iconBg: "#eff6ff",
            iconColor: "#3b82f6",
            svgPaths: "M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z",
        },
    ]

    return (
        <div className="space-y-6 max-w-[1200px]">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Resumen General</h1>
                <p className="text-slate-500 text-sm mt-1 capitalize">Estado financiero — {mesLabel}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-5">
                {statCards.map((card) => (
                    <div key={card.label} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                        {/* Big background icon */}
                        <div className="absolute right-4 top-4 opacity-[0.07]">
                            <svg className="w-28 h-28" viewBox="0 0 24 24" fill={card.iconColor}>
                                <path d={card.svgPaths} />
                            </svg>
                        </div>

                        <div className="flex items-start gap-3 mb-4 relative">
                            <div className="p-2 rounded-lg" style={{ background: card.iconBg }}>
                                <card.icon className="w-4 h-4" style={{ color: card.iconColor }} />
                            </div>
                            <span className="text-[10px] font-black tracking-widest pt-2" style={{ color: "#94a3b8" }}>
                                {card.label}
                            </span>
                        </div>

                        <p className="text-3xl font-black text-slate-900 relative">
                            ${card.value.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                        </p>

                        {card.pct !== null && (
                            <div className="flex items-center gap-1.5 mt-2 relative">
                                {card.pct >= 0 ? (
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                    <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                                )}
                                <span className={`text-xs font-bold ${card.pct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                    {card.pct >= 0 ? "+" : ""}{card.pct.toFixed(1)}%
                                </span>
                                <span className="text-xs text-slate-400">vs mes anterior</span>
                            </div>
                        )}
                        {card.pct === null && (
                            <p className="text-xs text-slate-400 mt-2">Saldo acumulado histórico</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Trends Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-base font-black text-slate-900">Tendencias Financieras</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Crédito vs Cobranza — últimos 6 meses</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Crédito
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Cobranza
                        </span>
                    </div>
                </div>
                <DashboardTrends data={chartData} />
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <h2 className="text-base font-black text-slate-900">Transacciones Recientes</h2>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold transition-colors">
                            <Filter className="w-3.5 h-3.5" /> Filtrar
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold transition-colors">
                            <Download className="w-3.5 h-3.5" /> Exportar
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: "#f8faff" }}>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Entidad</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(!recentTransactions || recentTransactions.length === 0) ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                                                <TrendingUp className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="text-sm text-slate-400">No hay transacciones aún.</p>
                                            <Link href="/transactions" className="text-sm text-emerald-600 font-semibold hover:underline">
                                                Registra tu primera →
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : recentTransactions.map((t: any) => {
                                const name = t.clients?.name || "Sin cliente"
                                const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                                const colors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6", "#06b6d4", "#f97316", "#84cc16"]
                                const colorIdx = name.charCodeAt(0) % colors.length
                                const trxRef = `#TRX-${String(t.id).substring(0, 6).toUpperCase()}`

                                return (
                                    <tr key={t.id} className="group hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                            {new Date(t.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                                    style={{ background: colors[colorIdx] }}>
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{name}</p>
                                                    <p className="text-[11px] text-slate-400">{trxRef}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {t.type === 'credit' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-600 border border-red-100">
                                                    <ArrowUpRight className="w-3 h-3" /> Crédito
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
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

                {recentTransactions && recentTransactions.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                            Mostrando <span className="font-semibold text-slate-600">1–{recentTransactions.length}</span> transacciones recientes
                        </p>
                        <Link href="/transactions" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                            Ver todas →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
