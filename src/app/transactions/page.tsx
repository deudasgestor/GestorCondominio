"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Receipt, ArrowRight, CheckCircle2 } from "lucide-react"

export default function TransactionsPage() {
    const [clients, setClients] = useState<any[]>([])
    const [clientId, setClientId] = useState("")
    const [type, setType] = useState<'credit' | 'payment'>('credit')
    const [amount, setAmount] = useState("")
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function fetchClients() {
            const { data } = await supabase.from("clients").select("id, name").order("name")
            if (data) setClients(data)
        }
        fetchClients()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.from("transactions").insert([
            {
                client_id: clientId,
                type,
                amount: parseFloat(amount),
                description,
                date: new Date().toISOString().split('T')[0]
            }
        ])

        if (!error) {
            setSuccess(true)
            setAmount("")
            setDescription("")
            setTimeout(() => {
                setSuccess(false)
                router.refresh()
            }, 3000)
        } else {
            alert("Error al registrar: " + error.message)
        }
        setLoading(false)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Nueva Transacción</h1>
                <p className="text-zinc-400 mt-1">Registra una compra a crédito o un abono de cliente.</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
                {success ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-emerald-500 animate-in fade-in zoom-in">
                        <CheckCircle2 className="w-16 h-16" />
                        <p className="text-xl font-bold text-white">¡Transacción Registrada!</p>
                        <p className="text-zinc-400">Los saldos han sido actualizados.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 p-1 bg-zinc-800/50 rounded-xl mb-6">
                            <button
                                type="button"
                                onClick={() => setType('credit')}
                                className={`py-2 px-4 rounded-lg font-semibold transition-all ${type === 'credit'
                                        ? "bg-blue-600 text-white shadow-lg"
                                        : "text-zinc-400 hover:text-zinc-200"
                                    }`}
                            >
                                Crédito
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('payment')}
                                className={`py-2 px-4 rounded-lg font-semibold transition-all ${type === 'payment'
                                        ? "bg-emerald-600 text-white shadow-lg"
                                        : "text-zinc-400 hover:text-zinc-200"
                                    }`}
                            >
                                Abono
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Cliente</label>
                                <select
                                    required
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                >
                                    <option value="">Selecciona un cliente</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Monto ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Descripción</label>
                                <textarea
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all h-24 resize-none"
                                    placeholder="¿De qué trata esta transacción?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !clientId || !amount}
                            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all shadow-lg ${loading ? "opacity-50 cursor-not-allowed" :
                                    type === 'credit' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                }`}
                        >
                            {loading ? "Procesando..." : (
                                <>
                                    Confirmar {type === 'credit' ? "Crédito" : "Abono"}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-zinc-800 rounded-xl">
                        <Receipt className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-400">¿Necesitas un nuevo cliente?</p>
                        <p className="text-zinc-200">Agrégalo antes de la transacción.</p>
                    </div>
                </div>
                <button
                    onClick={() => router.push("/clients")}
                    className="text-blue-500 font-semibold hover:underline"
                >
                    Gestionar Clientes
                </button>
            </div>
        </div>
    )
}
