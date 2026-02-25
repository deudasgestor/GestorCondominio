"use client"

import { useState, useRef } from "react"
import { Download, Upload, FileText, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import * as XLSX from "xlsx-js-style"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/utils/cn"

interface DataActionsProps {
    type: "clients" | "transactions"
    data: any[]
    onImportSuccess?: () => void
    filename?: string
}

export function DataActions({ type, data, onImportSuccess, filename }: DataActionsProps) {
    const [isImporting, setIsImporting] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const exportToExcel = () => {
        const title = type === "clients" ? "Directorio de Clientes" : "Historial de Transacciones"
        let headers: string[] = []
        let rows: any[][] = []

        if (type === "clients") {
            headers = ["Nombre Completo", "Teléfono", "Límite de Crédito", "Saldo Actual", "Estado"]
            rows = data.map(c => [
                c.name,
                c.phone || "—",
                Number(c.credit_limit),
                Number(c.balance || 0),
                (c.balance || 0) <= 0 ? "Al Día" : "Con Saldo"
            ])
        } else {
            headers = ["Fecha", "Cliente", "Tipo", "Monto", "Referencia", "Descripción"]
            rows = data.map(t => [
                new Date(t.date).toLocaleDateString("es-MX"),
                t.clients?.name || "—",
                t.type === 'credit' ? 'Compra/Crédito' : 'Pago/Abono',
                Number(t.amount),
                `#TRX-${String(t.id).substring(0, 6).toUpperCase()}`,
                t.description || ""
            ])
        }

        // Si no hay datos, crear una fila vacía para mantener el formato
        if (rows.length === 0) {
            rows = [new Array(headers.length).fill("")]
        }

        // Crear worksheet usando Array of Arrays para control total
        const wsData = [headers, ...rows]
        const ws = XLSX.utils.aoa_to_sheet(wsData)

        // --- ESTILIZACIÓN PREMIUM (Estilo Excel de la imagen) ---
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = XLSX.utils.encode_cell({ r: R, c: C })
                if (!ws[cell_address]) continue

                // Estilo base
                ws[cell_address].s = {
                    font: { name: "Arial", sz: 10 },
                    alignment: { vertical: "center", horizontal: "left", indent: 1 },
                    border: {
                        top: { style: "thin", color: { rgb: "E2E8F0" } },
                        bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                        left: { style: "thin", color: { rgb: "E2E8F0" } },
                        right: { style: "thin", color: { rgb: "E2E8F0" } }
                    }
                }

                // Header (Fila 0): Fondo verde, texto blanco, negrita, centrado
                if (R === 0) {
                    ws[cell_address].s = {
                        ...ws[cell_address].s,
                        fill: { fgColor: { rgb: "22C55E" } }, // Verde Esmeralda 500
                        font: { color: { rgb: "FFFFFF" }, bold: true, name: "Arial", sz: 11 },
                        alignment: { vertical: "center", horizontal: "center" }
                    }
                }
                // Zebra Striping: Filas pares (0-indexed, así que fila 2, 4, etc. de datos)
                else if (R % 2 !== 0) {
                    ws[cell_address].s.fill = { fgColor: { rgb: "F0F9FF" } } // Azul muy claro/Celeste para zebra
                }
            }
        }

        // Activar Auto-filtros en el Header
        ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: range.s, e: { r: 0, c: range.e.c } }) }

        // Anchos de columna optimizados
        const wscols = type === "clients"
            ? [{ wch: 35 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 18 }]
            : [{ wch: 18 }, { wch: 35 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 45 }]
        ws['!cols'] = wscols

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Reporte")
        XLSX.writeFile(wb, filename || `${title.replace(/\s+/g, '_')}.xlsx`)
    }

    const exportToPDF = () => {
        const doc = new jsPDF() as any
        const title = type === "clients" ? "Directorio de Clientes" : "Historial de Transacciones"

        // Header Estético Industrial
        doc.setFillColor(31, 41, 55) // Slate 800
        doc.rect(0, 0, 210, 45, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(24)
        doc.setFont(undefined, 'bold')
        doc.text("FinanzasPro", 15, 22)

        doc.setFontSize(10)
        doc.setFont(undefined, 'normal')
        doc.setTextColor(255, 255, 255, 0.8)
        doc.text("SOLUCIONES DE CRÉDITO Y COBRANZA", 15, 30)

        doc.setFillColor(34, 197, 94) // Emerald 500 decorative line
        doc.rect(15, 35, 60, 1.5, 'F')

        doc.setFontSize(9)
        doc.text(`Generado: ${new Date().toLocaleString("es-MX")}`, 145, 30)

        // Título de cuerpo
        doc.setTextColor(31, 41, 55)
        doc.setFontSize(18)
        doc.setFont(undefined, 'bold')
        doc.text(title, 15, 62)

        const tableHeaders = type === "clients"
            ? [['NOMBRE DEL CLIENTE', 'TELÉFONO', 'LÍMITE ASIGNADO', 'SALDO AL DÍA']]
            : [['FECHA', 'CLIENTE/ENTIDAD', 'TIPO OPERACIÓN', 'MONTO']]

        let tableData = []
        if (data.length > 0) {
            tableData = type === "clients"
                ? data.map(c => [c.name, c.phone || "—", `$${Number(c.credit_limit).toLocaleString()}`, `$${Number(c.balance || 0).toLocaleString()}`])
                : data.map(t => [new Date(t.date).toLocaleDateString("es-MX"), t.clients?.name || "—", t.type === 'credit' ? 'Crédito' : 'Abono', `$${Number(t.amount).toLocaleString()}`])
        } else {
            tableData = [["No hay datos para mostrar", "", "", ""]]
        }

        doc.autoTable({
            startY: 70,
            head: tableHeaders,
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94], fontSize: 10, fontStyle: 'bold', textColor: [255, 255, 255] },
            styles: { fontSize: 9, cellPadding: 5, font: 'helvetica' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 15, right: 15 }
        })

        // Footer
        const finalY = doc.lastAutoTable.finalY || 80
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text("Este documento es un reporte generado por el sistema y no tiene validez legal sin firma.", 15, finalY + 15)

        doc.save(`${title.replace(/\s+/g, '_')}.pdf`)
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        setStatus(null)

        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const rawData = XLSX.utils.sheet_to_json(ws) as any[]

                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error("No hay sesión activa")

                if (type === "clients") {
                    const toInsert = rawData.map(row => ({
                        user_id: user.id,
                        name: row.Nombre || row.name || row["Nombre Completo"] || "Sin nombre",
                        phone: String(row.Telefono || row.phone || row["Teléfono"] || ""),
                        credit_limit: parseFloat(row.Limite || row.limit || row["Límite de Crédito"] || "0")
                    }))

                    const { error } = await supabase.from("clients").insert(toInsert)
                    if (error) throw error
                } else {
                    throw new Error("La importación de transacciones requiere configuración manual de IDs de cliente.")
                }

                setStatus({ type: 'success', msg: `¡Éxito! Se importaron ${rawData.length} registros.` })
                onImportSuccess?.()
            } catch (err: any) {
                setStatus({ type: 'error', msg: err.message || "Error al procesar el archivo." })
            } finally {
                setIsImporting(false)
                if (fileInputRef.current) fileInputRef.current.value = ""
            }
        }
        reader.readAsBinaryString(file)
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                {/* Export Buttons */}
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm"
                >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Exportar Excel
                </button>
                <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                >
                    <FileText className="w-3.5 h-3.5" />
                    Exportar PDF
                </button>

                {/* Import Button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm",
                        isImporting ? "bg-slate-50 text-slate-400" : "bg-white text-slate-700 hover:bg-slate-50"
                    )}
                >
                    {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-emerald-500" />}
                    {isImporting ? "Importando..." : "Importar Excel"}
                </button>
            </div>

            {/* Status Feedback */}
            {status && (
                <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold animate-in fade-in slide-in-from-top-1",
                    status.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                )}>
                    {status.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {status.msg}
                    <button onClick={() => setStatus(null)} className="ml-auto hover:opacity-70"><X className="w-3 h-3" /></button>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx, .xls, .csv"
                onChange={handleImport}
            />
        </div>
    )
}

function X({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    )
}
