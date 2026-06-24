'use client'

import { Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/useUIStore'

export function TopBar({ title }: { title: string }) {
  const { aiSidebarOpen, toggleAISidebar } = useUIStore()

  return (
    <header className="bg-card flex h-14 items-center justify-between border-b px-4">
      <h1 className="text-sm font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        <Button
          variant={aiSidebarOpen ? 'default' : 'outline'}
          size="sm"
          className="h-8 gap-1.5"
          onClick={toggleAISidebar}
        >
          <Bot className="h-3.5 w-3.5" />
          <span className="text-xs">AI</span>
        </Button>
      </div>
    </header>
  )
}
