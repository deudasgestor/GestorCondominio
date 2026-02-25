import { createClient } from "@/utils/supabase/server"
import {
    ArrowLeft,
    Printer,
    TrendingUp,
    TrendingDown,
    Calendar,
    Phone,
    Mail,
    Search,
    Filter,
    FileText,
    CheckCircle,
    CalendarDays,
    ChevronLeft,
    AlertCircle,
    Clock,
    Users
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/utils/cn"
import { ClientActions } from "@/components/ClientActions"
import { notFound } from "next/navigation"

export default async function ClientDetailPage({
    params
}: {
    params: { id: string }
}) {
    const { id } = params
    const supabase = await createClient()

    const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*, transactions(*)")
        .eq("id", id)
        .single()

    if (clientError || !client) {
        return <div className="p-8 text-center">Cliente no encontrado</div>
    }

    const { data: { user } } = await supabase.auth.getUser()

    const sortedTransactions = [...(client.transactions || [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const balance = (client.transactions || []).reduce((acc: number, t: any) => {
        return t.type === 'credit' ? acc + Number(t.amount) : acc - Number(t.amount)
    }, 0)

    // Cálculo de Días de Atraso
    let daysOfArrear = 0
    if (balance > 0) {
        const lastCredit = (client.transactions || [])
            .filter((t: any) => t.type === 'credit')
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

        if (lastCredit) {
            const lastPayment = (client.transactions || [])
                .filter((t: any) => t.type === 'payment')
                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

            const baseDate = lastPayment ? new Date(lastPayment.date) : new Date(lastCredit.date)
            const diffTime = Math.abs(new Date().getTime() - baseDate.getTime())
            daysOfArrear = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }
    }

    const totalTransactions = client.transactions?.length || 0
    const initials = client.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()

    return (
        <div className="space-y-6 max-w-[1200px] pb-20">
            {/* Breadcrumb & Header */}
            <div className="flex items-center justify-between no-print">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/clients" className="hover:text-blue-600 transition-colors">Clientes</Link>
                        <span>›</span>
                        <span className="text-slate-600">{client.name}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Perfil de Cliente y Estado de Cuenta</h1>
                </div>
                <ClientActions
                    clientName={client.name}
                    clientPhone={client.phone || ""}
                    balance={balance}
                    transactions={client.transactions || []}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column — Client Profile */}
                <div className="space-y-5">
                    {/* Profile Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl font-bold text-white mb-4">
                            {initials}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{client.name}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">ID: #{id.substring(0, 8)}</p>

                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Cliente Activo
                        </div>

                        <div className="mt-6 space-y-4 text-left">
                            <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Teléfono</p>
                                    <p className="text-sm font-medium text-slate-700">{client.phone || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CalendarDays className="w-4 h-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Miembro desde</p>
                                    <p className="text-sm font-medium text-slate-700">{new Date(client.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Balance Card */}
                    <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] rounded-2xl p-6 text-white shadow-lg">
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-blue-200 font-bold mb-1">Saldo Deudor Actual</p>
                            <h2 className="text-3xl font-black tracking-tight">${balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</h2>
                            {client.credit_limit > 0 && (
                                <p className="text-[10px] text-blue-200 mt-1 uppercase font-bold tracking-widest">
                                    Límite: ${Number(client.credit_limit).toLocaleString("es-MX")}
                                </p>
                            )}
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Transacciones</span>
                                </div>
                                <p className="text-xl font-bold text-slate-900">{client.transactions?.length || 0}</p>
                            </div>
                            <div className={cn(
                                "rounded-xl p-4 border",
                                daysOfArrear > 30 ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"
                            )}>
                                <div className="flex items-center gap-2 mb-1">
                                    {daysOfArrear > 30 ? (
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                    ) : (
                                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                                    )}
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase",
                                        daysOfArrear > 30 ? "text-rose-600" : "text-emerald-600"
                                    )}>
                                        {daysOfArrear > 30 ? "Atraso Crítico" : "Días de Atraso"}
                                    </span>
                                </div>
                                <p className={cn(
                                    "text-xl font-bold",
                                    daysOfArrear > 30 ? "text-rose-700" : "text-emerald-700"
                                )}>
                                    {daysOfArrear} <span className="text-xs font-normal">días</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column — Transaction History */}
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900">Historial de Transacciones</h2>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar transacciones..."
                                    className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                    <th className="px-6 py-3 text-left">Fecha</th>
                                    <th className="px-6 py-3 text-left">Descripción</th>
                                    <th className="px-6 py-3 text-left">Tipo</th>
                                    <th className="px-6 py-3 text-right">Monto</th>
                                    <th className="px-6 py-3 text-center">Recibo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {sortedTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">
                                            No hay movimientos registrados.
                                        </td>
                                    </tr>
                                ) : sortedTransactions.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-blue-50/20 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(t.date).toLocaleDateString("es-MX", { month: "short", day: "2-digit", year: "numeric" })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-800">{t.description || "Consumo General"}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-3 py-1 rounded-md text-xs font-semibold ${t.type === 'credit'
                                                ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                }`}>
                                                {t.type === 'credit' ? 'Compra' : 'Abono'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-bold ${t.type === 'credit' ? 'text-slate-900' : 'text-emerald-600'
                                                }`}>
                                                {t.type === 'credit' ? '-' : '+'}${Number(t.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="p-1.5 text-slate-300 hover:text-blue-600 transition-colors">
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {sortedTransactions.length > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-sm text-slate-400">
                            <span>Mostrando 1 a {sortedTransactions.length} de {sortedTransactions.length} transacciones</span>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 border border-slate-200 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-50">Anterior</button>
                                <button className="px-3 py-1 border border-slate-200 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-50">Siguiente</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
