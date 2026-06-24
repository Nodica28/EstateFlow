'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useContactStore } from '@/stores/useContactStore'
import { CONTACT_TYPE_LABELS } from '@/types'
import { AddContactDialog } from './AddContactDialog'

export function ContactFiltersBar() {
  const { filters, setFilters } = useContactStore()

  return (
    <div className="flex items-center gap-2 border-b px-4 py-2.5">
      <div className="relative max-w-xs flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
        <Input
          placeholder="Search contacts..."
          className="h-8 pl-8 text-sm"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
        />
      </div>

      <Select
        value={filters.type}
        onValueChange={(v) => setFilters({ type: v as typeof filters.type })}
      >
        <SelectTrigger className="h-8 w-44 text-sm">
          <SelectValue>
            {filters.type === 'all' ? 'All types' : CONTACT_TYPE_LABELS[filters.type]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {(Object.entries(CONTACT_TYPE_LABELS) as [string, string][]).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto">
        <AddContactDialog />
      </div>
    </div>
  )
}
