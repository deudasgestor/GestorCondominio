import { Sidebar } from "@/components/sidebar"
import { AppTopbar } from "@/components/AppTopbar"

export default function ClientsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen" style={{ background: "#f0f2f5" }}>
            <Sidebar />
            <main className="flex-1 ml-[240px] flex flex-col min-h-screen">
                <AppTopbar />
                <div className="p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    )
}
