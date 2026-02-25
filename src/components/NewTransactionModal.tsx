"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { X, ShoppingCart, CreditCard, Search, ChevronDown, AlertCircle } from "lucide-react"
import { cn } from "@/utils/cn"

interface NewTransactionModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
    preselectedClientId?: string
}

export function NewTransactionModal({ isOpen, onClose, onSuccess, preselectedClientId }: NewTransactionModalProps) {
    const supabase = createClient()
    const [clients, setClients] = useState<any[]>([])
    const [type, setType] = useState<'credit' | 'payment'>('credit')
    const [amount, setAmount] = useState("")
    const [clientId, setClientId] = useState(preselectedClientId || "")
    const [clientSearch, setClientSearch] = useState("")
    const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)
    const [warning, setWarning] = useState("")
    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedClient = clients.find(c => c.id === clientId)

    useEffect(() => {
        if (preselectedClientId) setClientId(preselectedClientId)
    }, [preselectedClientId])

    useEffect(() => {
        async function fetchClients() {
            const { data } = await supabase.from("clients").select("id, name, credit_limit").order("name")
            if (data) setClients(data)
        }
        fetchClients()
    }, [])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setClientDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase())
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setWarning("")

        const m = parseFloat(amount)
        if (isNaN(m) || m <= 0) {
            setWarning("Ingresa un monto válido.")
            setLoading(false)
            return
        }
        if (!clientId) {
            setWarning("Selecciona un cliente.")
            setLoading(false)
            return
        }

        // Validación de Límite de Crédito
        if (type === 'credit' && selectedClient?.credit_limit > 0) {
            const { data: txs } = await supabase
                .from("transactions").select("amount, type").eq("client_id", clientId)
            const balance = (txs || []).reduce((acc: number, t: any) => {
                return t.type === 'credit' ? acc + Number(t.amount) : acc - Number(t.amount)
            }, 0)
            if (balance + m > selectedClient.credit_limit) {
                const ok = confirm(`El saldo ($${(balance + m).toLocaleString()}) excederá el límite de crédito ($${selectedClient.credit_limit.toLocaleString()}). ¿Continuar?`)
                if (!ok) { setLoading(false); return }
            }
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase.from("transactions").insert([{
            client_id: clientId,
            user_id: user.id,
            type,
            amount: m,
            description: notes,
            date,
        }])

        if (!error) {
            // Reset
            setAmount("")
            setNotes("")
            setClientId(preselectedClientId || "")
            setClientSearch("")
            setType('credit')
            setDate(new Date().toISOString().split('T')[0])
            onSuccess?.()
            onClose()
        } else {
            setWarning("Error al registrar: " + error.message)
        }
        setLoading(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] md:max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-7 pt-7 pb-4 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Nueva Transacción</h2>
                        <p className="text-sm text-slate-400 mt-0.5">Registra una compra a crédito o un pago.</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-7 pb-7 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                    {/* Type Toggle */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setType('credit')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
                                type === 'credit'
                                    ? "bg-white text-red-600 shadow-sm border border-slate-100"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Compra / Crédito
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('payment')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
                                type === 'payment'
                                    ? "bg-white text-emerald-600 shadow-sm border border-slate-100"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <CreditCard className="w-4 h-4" />
                            Pago / Abono
                        </button>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Monto</label>
                        <div className={cn(
                            "flex items-center border-2 rounded-xl px-4 transition-all",
                            "focus-within:border-blue-500 border-slate-200"
                        )}>
                            <span className="text-slate-400 text-lg font-medium mr-1">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="flex-1 py-3.5 text-2xl font-bold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-200"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Client Dropdown */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Cliente</label>
                        <div ref={dropdownRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setClientDropdownOpen(p => !p)}
                                className="w-full flex items-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 focus:border-blue-500 rounded-xl text-left transition-all"
                            >
                                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className={cn("flex-1 text-sm truncate", !selectedClient && "text-slate-400")}>
                                    {selectedClient ? selectedClient.name : "Seleccionar cliente..."}
                                </span>
                                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", clientDropdownOpen && "rotate-180")} />
                            </button>

                            {clientDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="p-2 border-b border-slate-100">
                                        <div className="flex items-center gap-2 px-2">
                                            <Search className="w-3.5 h-3.5 text-slate-400" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Buscar..."
                                                className="flex-1 text-sm py-1 focus:outline-none text-slate-700"
                                                value={clientSearch}
                                                onChange={e => setClientSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-[180px] overflow-y-auto">
                                        {filteredClients.length === 0 ? (
                                            <p className="px-4 py-3 text-sm text-slate-400 text-center">Sin resultados</p>
                                        ) : filteredClients.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => { setClientId(c.id); setClientDropdownOpen(false); setClientSearch("") }}
                                                className={cn(
                                                    "w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-blue-50 transition-colors",
                                                    clientId === c.id ? "text-blue-600 font-semibold bg-blue-50/50" : "text-slate-700"
                                                )}
                                            >
                                                <span>{c.name}</span>
                                                {c.credit_limit > 0 && (
                                                    <span className="text-[10px] text-slate-400 font-medium">Lím. ${Number(c.credit_limit).toLocaleString()}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha</label>
                        <input
                            type="date"
                            className="w-full border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none transition-all"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Notas <span className="font-normal text-slate-400">(Opcional)</span></label>
                        <textarea
                            placeholder="Agrega detalles sobre esta transacción..."
                            className="w-full border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none h-20 resize-none transition-all"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Warning */}
                    {warning && (
                        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {warning}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 4px 15px rgba(34,197,94,0.3)" }}
                        >
                            {loading ? "Procesando..." : "Confirmar Transacción"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
