"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { NewTransactionModal } from "@/components/NewTransactionModal"

export function DashboardActions() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
                <Plus className="w-4 h-4" />
                Nueva Transacción
            </button>
            <NewTransactionModal isOpen={open} onClose={() => setOpen(false)} />
        </>
    )
}
