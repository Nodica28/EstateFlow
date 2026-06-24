'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  Mail,
  MessageSquare,
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  Star,
  Archive,
  ArchiveX,
  Trash2,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import type { CommunicationType } from '@/types'
import { cn } from '@/lib/utils'
import { useCommunicationsStore, type CommWithMeta } from '@/stores/useCommunicationsStore'

const TYPE_ICONS: Record<CommunicationType, React.ElementType> = {
  email: Mail,
  sms: MessageSquare,
  phone: Phone,
}

const TYPE_COLORS: Record<CommunicationType, string> = {
  email: 'text-blue-500',
  sms: 'text-purple-500',
  phone: 'text-green-500',
}

type ViewFilter = 'all' | 'unread' | 'favorites' | 'archived'
type TypeFilter = 'all' | CommunicationType

function CommRow({ comm }: { comm: CommWithMeta }) {
  const { markRead, markUnread, toggleFavorite, toggleArchive, remove } = useCommunicationsStore()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const Icon = TYPE_ICONS[comm.type]

  return (
    <div
      className={cn(
        'group hover:bg-muted/30 relative flex items-start gap-4 px-4 py-3 transition-colors',
        !comm.is_read && 'border-l-2 border-l-blue-400 bg-blue-50/30'
      )}
    >
      <div className={cn('mt-0.5 shrink-0', TYPE_COLORS[comm.type])}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {comm.contact && (
            <span className={cn('text-sm', !comm.is_read ? 'font-semibold' : 'font-medium')}>
              {comm.contact.first_name} {comm.contact.last_name}
            </span>
          )}
          <span className="text-muted-foreground flex items-center gap-0.5 text-xs">
            {comm.direction === 'inbound' ? (
              <ArrowDownLeft className="h-3 w-3 text-blue-400" />
            ) : (
              <ArrowUpRight className="h-3 w-3 text-green-400" />
            )}
            {comm.direction}
          </span>
          <span className="text-muted-foreground ml-auto text-xs">
            {format(new Date(comm.created_at), 'MMM d, h:mm a')}
          </span>
        </div>
        {comm.subject && (
          <p className={cn('mt-0.5 text-sm', !comm.is_read ? 'font-medium' : '')}>{comm.subject}</p>
        )}
        {comm.body && (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">{comm.body}</p>
        )}
        {comm.type === 'phone' && comm.duration_sec && (
          <p className="text-muted-foreground mt-0.5 text-xs">
            {Math.floor(comm.duration_sec / 60)}m {comm.duration_sec % 60}s
          </p>
        )}
      </div>

      {/* Action buttons — visible on hover */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Read/Unread */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={comm.is_read ? 'Mark unread' : 'Mark read'}
          onClick={() => (comm.is_read ? markUnread(comm.id) : markRead(comm.id))}
        >
          {comm.is_read ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>

        {/* Favorite */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={comm.is_favorite ? 'Unfavorite' : 'Favorite'}
          onClick={() => toggleFavorite(comm.id)}
        >
          <Star
            className={cn('h-3.5 w-3.5', comm.is_favorite && 'fill-yellow-400 text-yellow-400')}
          />
        </Button>

        {/* Archive */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={comm.is_archived ? 'Unarchive' : 'Archive'}
          onClick={() => toggleArchive(comm.id)}
        >
          {comm.is_archived ? (
            <ArchiveX className="h-3.5 w-3.5" />
          ) : (
            <Archive className="h-3.5 w-3.5" />
          )}
        </Button>

        {/* Delete */}
        {confirmDelete ? (
          <div className="bg-background flex items-center gap-1 rounded border px-1.5 py-0.5 shadow-sm">
            <span className="text-xs">Delete?</span>
            <Button
              variant="destructive"
              size="sm"
              className="h-5 px-1.5 text-xs"
              onClick={() => remove(comm.id)}
            >
              Yes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-xs"
              onClick={() => setConfirmDelete(false)}
            >
              No
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive h-7 w-7"
            title="Delete"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function AllCommunicationsView({
  initialCommunications,
}: {
  initialCommunications: CommWithMeta[]
}) {
  const { communications, setCommunications } = useCommunicationsStore()
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  useEffect(() => {
    setCommunications(initialCommunications)
  }, [initialCommunications, setCommunications])

  const filtered = communications.filter((c) => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false
    if (viewFilter === 'unread') return !c.is_read && !c.is_archived
    if (viewFilter === 'favorites') return c.is_favorite
    if (viewFilter === 'archived') return c.is_archived
    return !c.is_archived // 'all' tab hides archived
  })

  const unreadCount = communications.filter((c) => !c.is_read && !c.is_archived).length

  return (
    <div className="flex h-full flex-col">
      {/* Top filter bar */}
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2.5">
        <Tabs value={viewFilter} onValueChange={(v) => setViewFilter(v as ViewFilter)}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="h-7 px-3 text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="h-7 px-3 text-xs">
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="favorites" className="h-7 px-3 text-xs">
              Favorites
            </TabsTrigger>
            <TabsTrigger value="archived" className="h-7 px-3 text-xs">
              Archived
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as TypeFilter)}
          className="ml-auto"
        >
          <TabsList className="h-8">
            <TabsTrigger value="all" className="h-7 px-3 text-xs">
              All types
            </TabsTrigger>
            <TabsTrigger value="email" className="h-7 px-3 text-xs">
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="h-7 px-3 text-xs">
              SMS
            </TabsTrigger>
            <TabsTrigger value="phone" className="h-7 px-3 text-xs">
              Phone
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Mail className="text-muted-foreground/30 mb-3 h-10 w-10" />
          <p className="text-muted-foreground text-sm">No communications here.</p>
        </div>
      )}

      <div className="divide-y overflow-auto">
        {filtered.map((comm) => (
          <CommRow key={comm.id} comm={comm} />
        ))}
      </div>
    </div>
  )
}
