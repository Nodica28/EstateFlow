'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Mail, MessageSquare, Phone, ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import type { Communication, CommunicationType } from '@/types'
import { cn } from '@/lib/utils'

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

const supabase = createClient()

export function CommunicationFeed({ contactId }: { contactId: string }) {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [filter, setFilter] = useState<'all' | CommunicationType>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCommunications() {
      setIsLoading(true)
      const { data } = await supabase
        .from('communications')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
      setCommunications(data ?? [])
      setIsLoading(false)
    }
    fetchCommunications()

    // Realtime
    const channel = supabase
      .channel(`communications-${contactId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communications',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => setCommunications((prev) => [payload.new as Communication, ...prev])
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [contactId])

  const filtered =
    filter === 'all' ? communications : communications.filter((c) => c.type === filter)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="h-6 px-2 text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="email" className="h-6 px-2 text-xs">
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="h-6 px-2 text-xs">
              SMS
            </TabsTrigger>
            <TabsTrigger value="phone" className="h-6 px-2 text-xs">
              Phone
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
          <Plus className="h-3 w-3" />
          Log
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading && <p className="text-muted-foreground py-8 text-center text-sm">Loading...</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">No communications yet.</p>
        )}
        <div className="divide-y">
          {filtered.map((comm) => {
            const Icon = TYPE_ICONS[comm.type]
            return (
              <div key={comm.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className={cn('mt-0.5 shrink-0', TYPE_COLORS[comm.type])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium capitalize">{comm.type}</span>
                      <span className="text-muted-foreground">
                        {comm.direction === 'inbound' ? (
                          <ArrowDownLeft className="h-3 w-3 text-blue-400" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3 text-green-400" />
                        )}
                      </span>
                      <span className="text-muted-foreground ml-auto text-xs">
                        {format(new Date(comm.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    {comm.subject && <p className="mt-0.5 text-sm font-medium">{comm.subject}</p>}
                    {comm.body && (
                      <p className="text-muted-foreground mt-1 line-clamp-3 text-sm">{comm.body}</p>
                    )}
                    {comm.type === 'phone' && comm.duration_sec && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Duration: {Math.floor(comm.duration_sec / 60)}m {comm.duration_sec % 60}s
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
