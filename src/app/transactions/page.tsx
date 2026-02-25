"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2 } from "lucide-react"

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
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nueva Transacción</h1>
                <p className="text-slate-500 text-sm mt-0.5">Registra una compra a crédito o un abono de cliente.</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
                {success ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in zoom-in">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="text-xl font-bold text-slate-900">¡Transacción Registrada!</p>
                        <p className="text-slate-500 text-sm">Los saldos han sido actualizados.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Toggle */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setType('credit')}
                                className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${type === 'credit'
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                Crédito
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('payment')}
                                className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${type === 'payment'
                                        ? "bg-white text-emerald-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                Abono
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Cliente</label>
                                <select
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none"
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
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Monto ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-300"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Descripción</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all h-24 resize-none"
                                    placeholder="¿De qué trata esta transacción?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !clientId || !amount}
                            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-sm ${loading ? "opacity-50 cursor-not-allowed bg-slate-400" :
                                    type === 'credit' ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                                }`}
                        >
                            {loading ? "Procesando..." : (
                                <>
                                    Confirmar {type === 'credit' ? "Crédito" : "Abono"}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
