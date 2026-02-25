import { createClient } from "@/utils/supabase/server"
import {
    TrendingUp,
    ArrowUpRight,
    Plus,
    CreditCard,
    Banknote,
    Wallet,
    Search,
    Bell,
    Download,
    Filter,
} from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Obtener transacciones del mes actual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const { data: monthTransactions } = await supabase
        .from("transactions")
        .select("amount, type")
        .gte("date", startOfMonth.toISOString().split('T')[0])

    const creditosMes = monthTransactions
        ?.filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    const cobranzaMes = monthTransactions
        ?.filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    // Histórico total para cartera activa
    const { data: allTransactions } = await supabase
        .from("transactions")
        .select("amount, type")

    const totalCreditos = allTransactions
        ?.filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    const totalPagos = allTransactions
        ?.filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    const carteraActiva = totalCreditos - totalPagos

    // Obtener las últimas 5 transacciones con datos de clientes
    const { data: recentTransactions } = await supabase
        .from("transactions")
        .select(`
      *,
      clients (name)
    `)
        .order("date", { ascending: false })
        .limit(5)

    const stats = [
        {
            label: "Monthly Credit",
            value: creditosMes,
            icon: CreditCard,
            color: "text-orange-500",
            bgIcon: "bg-orange-50",
            barColor: "bg-orange-500",
            barBg: "bg-orange-100",
        },
        {
            label: "Monthly Collections",
            value: cobranzaMes,
            icon: Banknote,
            color: "text-emerald-500",
            bgIcon: "bg-emerald-50",
            barColor: "bg-emerald-500",
            barBg: "bg-emerald-100",
        },
        {
            label: "Total Active Portfolio",
            value: carteraActiva,
            icon: Wallet,
            color: "text-blue-500",
            bgIcon: "bg-blue-50",
            barColor: "bg-blue-500",
            barBg: "bg-blue-100",
        },
    ]

    return (
        <div className="space-y-8 max-w-[1200px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Bienvenido, aquí está lo que sucede hoy.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar transacciones, clientes..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 w-[280px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                    </div>
                    <button className="relative p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        <Bell className="w-4 h-4 text-slate-500" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
                    </button>
                    <Link
                        href="/transactions"
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Transaction
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-[13px] font-medium text-slate-500">{stat.label}</p>
                                <h3 className="text-[28px] font-bold text-slate-900 mt-1 tracking-tight">
                                    ${stat.value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className={`${stat.bgIcon} p-2.5 rounded-xl`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-500">vs last month</span>
                        </div>
                        <div className={`h-1.5 ${stat.barBg} rounded-full overflow-hidden`}>
                            <div className={`h-full ${stat.barColor} rounded-full`} style={{ width: '65%' }}></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                            <Filter className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                <th className="px-6 py-3 text-left">Date</th>
                                <th className="px-6 py-3 text-left">Client</th>
                                <th className="px-6 py-3 text-left">Type</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-right">Remaining Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(!recentTransactions || recentTransactions.length === 0) ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                                <Receipt className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="text-sm text-slate-400">No hay transacciones registradas.</p>
                                            <Link href="/transactions" className="text-sm text-blue-600 font-medium hover:underline">
                                                Registra tu primera transacción →
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : recentTransactions.map((t: any) => {
                                const initials = t.clients?.name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "?"
                                const colors = ["bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-teal-100 text-teal-700"]
                                const colorIdx = t.clients?.name?.charCodeAt(0) % colors.length || 0

                                return (
                                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${colors[colorIdx]}`}>
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{t.clients?.name || "N/A"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${t.type === 'credit' ? 'text-orange-600' : 'text-emerald-600'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${t.type === 'credit' ? 'bg-orange-500' : 'bg-emerald-500'
                                                    }`}></span>
                                                {t.type === 'credit' ? 'Purchase' : 'Payment'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-semibold ${t.type === 'credit' ? 'text-slate-900' : 'text-emerald-600'
                                                }`}>
                                                {t.type === 'payment' ? '+' : ''}${Number(t.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-500 font-medium">
                                            —
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function Receipt({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
            <path d="M12 17.5v-11" />
        </svg>
    )
}
