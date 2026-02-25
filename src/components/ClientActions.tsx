"use client"

import { MessageCircle, FileText, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import jsPDF from "jspdf"
import "jspdf-autotable"

interface ClientActionsProps {
    clientName: string
    clientPhone: string
    balance: number
    transactions: any[]
}

export function ClientActions({ clientName, clientPhone, balance, transactions }: ClientActionsProps) {
    const router = useRouter()

    const handleWhatsApp = () => {
        const message = encodeURIComponent(
            `Hola ${clientName}, te saludamos de FinanzasPro. Te recordamos que tu saldo deudor actual es de $${balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}. ¿Podríamos coordinar tu próximo abono?`
        )
        const cleanPhone = clientPhone.replace(/\D/g, "")
        window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank")
    }

    const generatePDF = () => {
        const doc = new jsPDF() as any

        // Header
        doc.setFontSize(22)
        doc.setTextColor(30, 41, 59)
        doc.text("Estado de Cuenta", 14, 22)

        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString("es-MX")}`, 14, 30)

        // Client Info
        doc.setFontSize(12)
        doc.setTextColor(30, 41, 59)
        doc.text("CLIENTE:", 14, 45)
        doc.setFont(undefined, 'bold')
        doc.text(clientName.toUpperCase(), 40, 45)

        doc.setFont(undefined, 'normal')
        doc.text("SALDO ACTUAL:", 14, 52)
        doc.setTextColor(234, 88, 12) // orange-600
        doc.text(`$${balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, 50, 52)

        // Table
        const tableData = transactions.map(t => [
            new Date(t.date).toLocaleDateString("es-MX"),
            t.description || "Consumo General",
            t.type === 'credit' ? 'Compra' : 'Abono',
            `${t.type === 'credit' ? '-' : '+'}$${Number(t.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
        ])

        doc.autoTable({
            startY: 65,
            head: [['Fecha', 'Descripción', 'Tipo', 'Monto']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillStyle: [37, 99, 235], fontSize: 10 },
            styles: { fontSize: 9 }
        })

        doc.save(`Estado_Cuenta_${clientName.replace(/\s+/g, '_')}.pdf`)
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all shadow-sm"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver
            </button>

            <button
                onClick={handleWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
                <MessageCircle className="w-4 h-4" />
                Recordatorio WhatsApp
            </button>

            <button
                onClick={generatePDF}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
                <FileText className="w-4 h-4" />
                Generar PDF
            </button>
        </div>
    )
}
