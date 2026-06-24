import { Sidebar } from '@/components/layout/Sidebar'
import { AISidebar } from '@/components/layout/AISidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      <AISidebar />
    </div>
  )
}
