"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import {
    UserPlus,
    Search,
    ChevronRight,
    Phone,
    Users
} from "lucide-react"

export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newName, setNewName] = useState("")
    const [newPhone, setNewPhone] = useState("")
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        fetchClients()
    }, [])

    async function fetchClients() {
        setLoading(true)
        const { data: clientsData } = await supabase
            .from("clients")
            .select(`
        *,
        transactions (
          amount,
          type
        )
      `)
            .order("name")

        if (clientsData) {
            const processed = clientsData.map(c => {
                const balance = c.transactions.reduce((acc: number, t: any) => {
                    return t.type === 'credit' ? acc + Number(t.amount) : acc - Number(t.amount)
                }, 0)
                return { ...c, balance }
            })
            setClients(processed)
        }
        setLoading(false)
    }

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase.from("clients").insert([
            { name: newName, phone: newPhone }
        ])

        if (!error) {
            setIsModalOpen(false)
            setNewName("")
            setNewPhone("")
            fetchClients()
        } else {
            alert("Error: " + error.message)
        }
    }

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 max-w-[1200px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clientes</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Administra tu base de clientes y consulta sus saldos.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                >
                    <UserPlus className="w-4 h-4" />
                    Nuevo Cliente
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar cliente por nombre..."
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs font-semibold text-blue-600 uppercase tracking-wider border-b border-slate-100">
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Contacto</th>
                            <th className="px-6 py-4">Saldo Deudor</th>
                            <th className="px-6 py-4 text-right">Detalle</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-16 text-center">
                                    <div className="flex items-center justify-center gap-2 text-slate-400">
                                        <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                                        <span className="text-sm">Cargando clientes...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredClients.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                            <Users className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-sm text-slate-400">No se encontraron clientes.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredClients.map((client) => {
                            const initials = client.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                            const colors = ["bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-teal-100 text-teal-700"]
                            const colorIdx = client.name.charCodeAt(0) % colors.length

                            return (
                                <tr
                                    key={client.id}
                                    onClick={() => router.push(`/clients/${client.id}`)}
                                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${colors[colorIdx]}`}>
                                                {initials}
                                            </div>
                                            <span className="text-sm font-medium text-slate-800">{client.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5" />
                                            {client.phone || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm font-bold ${client.balance > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                                            ${client.balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors inline-block" />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <UserPlus className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Nuevo Cliente</h2>
                        </div>
                        <form onSubmit={handleCreateClient} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Nombre Completo</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Teléfono / WhatsApp</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all"
                                >
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
