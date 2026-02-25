import { createClient } from "@/utils/supabase/server"
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpRight,
    Plus
} from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Obtener transacciones del mes actual para el usuario
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, type")
        .gte("date", startOfMonth.toISOString())

    // Cálculos rápidos
    const creditosMes = transactions
        ?.filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    const cobranzaMes = transactions
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

    const stats = [
        {
            label: "Crédito Otorgado (Mes)",
            value: `$${creditosMes.toLocaleString("es-MX")}`,
            icon: TrendingUp,
            color: "text-orange-500",
            bg: "bg-orange-500/10"
        },
        {
            label: "Cobranza Efectiva (Mes)",
            value: `$${cobranzaMes.toLocaleString("es-MX")}`,
            icon: TrendingDown,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        {
            label: "Cartera Activa Total",
            value: `$${carteraActiva.toLocaleString("es-MX")}`,
            icon: Wallet,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
    ]

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="text-zinc-400 mt-1">Resumen de tu actividad financiera de este mes.</p>
                </div>
                <Link
                    href="/transactions"
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Transacción
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-white mt-1 tracking-tight">
                                {stat.value}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
                    <h2 className="text-xl font-bold text-white mb-6">Actividad Reciente</h2>
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
                        <p className="text-sm">No hay transacciones registradas este mes.</p>
                        <Link href="/transactions" className="mt-4 text-blue-500 text-sm hover:underline">
                            Registra tu primera venta a crédito
                        </Link>
                    </div>
                </div>
                <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
                    <h2 className="text-xl font-bold text-white mb-6">Atajos</h2>
                    <div className="space-y-4">
                        <Link href="/clients" className="block p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl transition-all">
                            <p className="font-semibold text-white">Gestionar Clientes</p>
                            <p className="text-xs text-zinc-400 mt-1">Ver saldos y estados de cuenta</p>
                        </Link>
                        <Link href="/transactions" className="block p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl transition-all">
                            <p className="font-semibold text-white">Registrar Cobro</p>
                            <p className="text-xs text-zinc-400 mt-1">Abono rápido a cuenta de cliente</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
