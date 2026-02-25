import { createClient } from "@/utils/supabase/server"
import {
    ArrowLeft,
    Printer,
    TrendingUp,
    TrendingDown,
    Calendar,
    Contact
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

    // Obtener datos del cliente y sus transacciones
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

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <div className="flex items-center justify-between no-print">
                <Link
                    href="/clients"
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Volver a Clientes
                </Link>
                <button
                    onClick={{ "/* client-side hack in server component */": "window.print()" } as any}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all"
                >
                    <Printer className="w-5 h-5" />
                    Imprimir Estado de Cuenta
                </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 print:border-none print:shadow-none print:bg-white print:text-black">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold uppercase print:hidden">
                            Estado de Cuenta
                        </div>
                        <h1 className="text-4xl font-black text-white print:text-black tracking-tight">{client.name}</h1>
                        <div className="flex items-center gap-4 text-zinc-400 print:text-zinc-600">
                            <div className="flex items-center gap-1.5 capitalize">
                                <Contact className="w-4 h-4" />
                                {client.phone || "Sin teléfono"}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                Miembro desde: {new Date(client.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <div className="text-right p-6 bg-zinc-800/50 rounded-2xl border border-zinc-700 print:bg-zinc-100 print:border-zinc-200">
                        <p className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-1">Saldo Actual</p>
                        <h2 className={`text-4xl font-black ${balance > 0 ? "text-orange-500" : "text-emerald-500"}`}>
                            ${balance.toLocaleString("es-MX")}
                        </h2>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white print:text-black flex items-center gap-2">
                        Historial de Movimientos
                    </h3>
                    <div className="border border-zinc-800 rounded-xl overflow-hidden print:border-zinc-200">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-800 text-zinc-400 print:bg-zinc-100 print:text-zinc-600">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 print:divide-zinc-200 uppercase text-xs">
                                {sortedTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">No hay movimientos registrados.</td>
                                    </tr>
                                ) : sortedTransactions.map((t: any) => (
                                    <tr key={t.id} className="print:bg-white">
                                        <td className="px-6 py-4 text-zinc-300 print:text-black">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-zinc-400 print:text-zinc-700">{t.description || "Consumo General"}</td>
                                        <td className="px-6 py-4">
                                            {t.type === 'credit' ? (
                                                <span className="flex items-center gap-1.5 text-orange-500 font-bold">
                                                    <TrendingUp className="w-3 h-3" />
                                                    CRÉDITO
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                                                    <TrendingDown className="w-3 h-3" />
                                                    ABONO
                                                </span>
                                            )}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-black ${t.type === 'credit' ? "text-white print:text-black" : "text-emerald-500"}`}>
                                            {t.type === 'credit' ? "" : "-"}${Number(t.amount).toLocaleString("es-MX")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          * { -webkit-print-color-adjust: exact !important; }
        }
      `}} />
        </div>
    )
}
