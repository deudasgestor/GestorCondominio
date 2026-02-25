"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { UserPlus, Search, ChevronRight, Users, AlertTriangle, CheckCircle } from "lucide-react"
import { DataActions } from "@/components/DataActions"

export const dynamic = "force-dynamic"

export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState<"all" | "alDia" | "morosos">("all")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newName, setNewName] = useState("")
    const [newPhone, setNewPhone] = useState("")
    const [newLimit, setNewLimit] = useState("0")
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => { fetchClients() }, [])

    async function fetchClients() {
        setLoading(true)
        const { data } = await supabase
            .from("clients")
            .select("*, transactions(amount, type, date)")
            .order("name")

        if (data) {
            const processed = data.map((c: any) => {
                const balance = c.transactions.reduce((acc: number, t: any) => {
                    return t.type === 'credit' ? acc + Number(t.amount) : acc - Number(t.amount)
                }, 0)

                // Days of arrear
                let daysArrear = 0
                if (balance > 0) {
                    const sorted = [...c.transactions].filter((t: any) => t.type === 'credit').sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    if (sorted[0]) {
                        const lastPmt = [...c.transactions].filter((t: any) => t.type === 'payment').sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                        const base = lastPmt ? new Date(lastPmt.date) : new Date(sorted[0].date)
                        daysArrear = Math.floor((new Date().getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
                    }
                }

                return { ...c, balance, daysArrear }
            })
            setClients(processed)
        }
        setLoading(false)
    }

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase.from("clients").insert([
            { name: newName, phone: newPhone, credit_limit: parseFloat(newLimit) || 0, user_id: user.id }
        ])
        if (!error) {
            setIsModalOpen(false)
            setNewName(""); setNewPhone(""); setNewLimit("0")
            fetchClients()
        } else {
            alert("Error: " + error.message)
        }
    }

    const filteredClients = clients
        .filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()))
        .filter((c: any) => {
            if (filter === "alDia") return c.balance <= 0 || c.daysArrear <= 5
            if (filter === "morosos") return c.balance > 0 && c.daysArrear > 5
            return true
        })

    const morosos = clients.filter((c: any) => c.balance > 0 && c.daysArrear > 5).length

    const avatarColors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6", "#06b6d4", "#f97316", "#84cc16", "#22c55e"]

    return (
        <div className="space-y-6 max-w-[1100px]">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Directorio de Clientes</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestiona tu cartera, monitorea saldos y estado de cobro.</p>
                </div>
                <div className="flex items-center gap-4">
                    <DataActions type="clients" data={clients} onImportSuccess={fetchClients} />
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 text-white text-sm font-bold rounded-xl transition-all"
                        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 4px 15px rgba(34,197,94,0.35)" }}
                    >
                        <UserPlus className="w-4 h-4" />
                        Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* Filters + Search */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                    {[
                        { key: "all", label: "Todos", count: clients.length },
                        { key: "alDia", label: "Al Día" },
                        { key: "morosos", label: "En Mora", count: morosos, alert: true },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === f.key ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            {f.label}
                            {f.count !== undefined && f.count > 0 && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${f.alert ? "bg-red-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                                    {f.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all shadow-sm w-[260px]"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr style={{ background: "#f8faff" }}>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Uso de Crédito</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-16 text-center">
                                <div className="flex items-center justify-center gap-2 text-slate-400">
                                    <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                                    <span className="text-sm">Cargando clientes...</span>
                                </div>
                            </td></tr>
                        ) : filteredClients.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-16 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                        <Users className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-sm text-slate-400">No se encontraron clientes.</p>
                                </div>
                            </td></tr>
                        ) : filteredClients.map((client) => {
                            const initials = client.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                            const color = avatarColors[client.name.charCodeAt(0) % avatarColors.length]
                            const usePct = client.credit_limit > 0 ? Math.min(100, (client.balance / client.credit_limit) * 100) : 0
                            const isOverdue = client.balance > 0 && client.daysArrear > 5
                            const isAlDia = client.balance <= 0

                            return (
                                <tr key={client.id} className="hover:bg-slate-50/60 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                                style={{ background: color }}>
                                                {initials}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{client.name}</p>
                                                <p className="text-[11px] text-slate-400">{client.phone || "—"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {client.credit_limit > 0 ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${usePct}%`,
                                                            background: usePct > 90 ? "#ef4444" : usePct > 70 ? "#f97316" : "#22c55e"
                                                        }} />
                                                </div>
                                                <span className={`text-xs font-semibold ${usePct > 90 ? "text-red-500" : usePct > 70 ? "text-orange-500" : "text-emerald-600"}`}>
                                                    {usePct.toFixed(0)}%
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm font-black ${isAlDia ? "text-emerald-600" : "text-slate-900"}`}>
                                            ${client.balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {isAlDia ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                <CheckCircle className="w-3 h-3" /> Al Día
                                            </span>
                                        ) : isOverdue ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-600 border border-red-100">
                                                <AlertTriangle className="w-3 h-3" /> Mora ({client.daysArrear}d)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                Activo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => router.push(`/clients/${client.id}`)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            Ver Detalle <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                <div className="px-6 py-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                        Mostrando <span className="font-semibold text-slate-600">{filteredClients.length}</span> de <span className="font-semibold text-slate-600">{clients.length}</span> clientes
                    </p>
                </div>
            </div>

            {/* Create Client Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 p-6 border-b border-slate-100">
                            <div className="p-2 rounded-xl" style={{ background: "#f0fdf4" }}>
                                <UserPlus className="w-5 h-5" style={{ color: "#22c55e" }} />
                            </div>
                            <h2 className="text-lg font-black text-slate-900">Nuevo Cliente</h2>
                        </div>
                        <form onSubmit={handleCreateClient} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre Completo</label>
                                <input required type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-400 transition-all"
                                    value={newName} onChange={e => setNewName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Teléfono / WhatsApp</label>
                                <input type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-400 transition-all"
                                    value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Límite de Crédito ($)</label>
                                <input type="number" step="0.01"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-400 transition-all"
                                    placeholder="0.00" value={newLimit} onChange={e => setNewLimit(e.target.value)} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all">
                                    Cancelar
                                </button>
                                <button type="submit"
                                    className="flex-1 py-3 text-sm text-white font-bold rounded-xl shadow-sm transition-all"
                                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
