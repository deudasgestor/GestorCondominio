"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import {
    Users,
    Plus,
    Search,
    ChevronRight,
    Phone,
    UserPlus
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
        // Obtener clientes y sus transacciones para calcular saldo
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
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Clientes</h1>
                    <p className="text-zinc-400 mt-1">Administra tu base de clientes y consulta sus saldos.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20"
                >
                    <UserPlus className="w-5 h-5" />
                    Nuevo Cliente
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Buscar cliente por nombre..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Cliente</th>
                            <th className="px-6 py-4 font-semibold">Contacto</th>
                            <th className="px-6 py-4 font-semibold">Saldo Deudor</th>
                            <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">Cargando clientes...</td>
                            </tr>
                        ) : filteredClients.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">No se encontraron clientes.</td>
                            </tr>
                        ) : filteredClients.map((client) => (
                            <tr
                                key={client.id}
                                onClick={() => router.push(`/clients/${client.id}`)}
                                className="hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                            >
                                <td className="px-6 py-5 text-white font-medium">{client.name}</td>
                                <td className="px-6 py-5 text-zinc-400 flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {client.phone || "N/A"}
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`font-bold ${client.balance > 0 ? "text-orange-500" : "text-emerald-500"}`}>
                                        ${client.balance.toLocaleString("es-MX")}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button className="p-2 text-zinc-500 group-hover:text-blue-500 transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal para Nuevo Cliente */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-600/10 rounded-lg">
                                <Users className="w-6 h-6 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Nuevo Cliente</h2>
                        </div>
                        <form onSubmit={handleCreateClient} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nombre Completo</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Teléfono / WhatsApp</label>
                                <input
                                    type="text"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 text-zinc-400 font-semibold hover:bg-zinc-800 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
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
