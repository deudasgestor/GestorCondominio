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
    Download,
    CheckCircle,
    CalendarDays
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ClientDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: client } = await supabase
        .from("clients")
        .select(`
      *,
      transactions (
        *
      )
    `)
        .eq("id", id)
        .single()

    if (!client) notFound()

    const sortedTransactions = client.transactions.sort((a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const balance = client.transactions.reduce((acc: number, t: any) => {
        return t.type === 'credit' ? acc + Number(t.amount) : acc - Number(t.amount)
    }, 0)

    const totalTransactions = client.transactions.length
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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Profile & Statement</h1>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/clients"
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>
                    <button
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm"
                        onClick={undefined}
                    >
                        <Download className="w-4 h-4" />
                        Generate Receipt (PDF)
                    </button>
                </div>
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
                            Active Client
                        </div>

                        <div className="mt-6 space-y-4 text-left">
                            <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Phone</p>
                                    <p className="text-sm font-medium text-slate-700">{client.phone || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CalendarDays className="w-4 h-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Member Since</p>
                                    <p className="text-sm font-medium text-slate-700">{new Date(client.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Balance Card */}
                    <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] rounded-2xl p-6 text-white shadow-lg">
                        <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider mb-1">Current Debt Balance</p>
                        <div className="flex items-baseline gap-2 mb-4">
                            <h3 className="text-3xl font-black tracking-tight">${balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</h3>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm text-center">
                            <div className="w-9 h-9 mx-auto bg-blue-50 rounded-lg flex items-center justify-center mb-2">
                                <CalendarDays className="w-4 h-4 text-blue-600" />
                            </div>
                            <h4 className="text-2xl font-bold text-slate-900">{totalTransactions}</h4>
                            <p className="text-[11px] text-slate-400">Total Transactions</p>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm text-center">
                            <div className="w-9 h-9 mx-auto bg-emerald-50 rounded-lg flex items-center justify-center mb-2">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                            </div>
                            <h4 className="text-2xl font-bold text-slate-900">100%</h4>
                            <p className="text-[11px] text-slate-400">Active Status</p>
                        </div>
                    </div>
                </div>

                {/* Right Column — Transaction History */}
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900">Transaction History</h2>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
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
                                    <th className="px-6 py-3 text-left">Date</th>
                                    <th className="px-6 py-3 text-left">Description</th>
                                    <th className="px-6 py-3 text-left">Type</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3 text-center">Receipt</th>
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
                                            {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-800">{t.description || "Consumo General"}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-3 py-1 rounded-md text-xs font-semibold ${t.type === 'credit'
                                                    ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                }`}>
                                                {t.type === 'credit' ? 'Purchase' : 'Payment'}
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
                            <span>Showing 1 to {sortedTransactions.length} of {sortedTransactions.length} transactions</span>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 border border-slate-200 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-50">Previous</button>
                                <button className="px-3 py-1 border border-slate-200 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-50">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
