'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import {
  Users,
  TrendingUp,
  CalendarCheck,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Sparkles,
  Building2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CONTACT_TYPE_LABELS,
  LEASING_STAGE_LABELS,
  type ContactType,
  type LeasingPipelineStage,
} from '@/types'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatCard {
  label: string
  value: number
  icon: React.ElementType
  href: string
  color: string
}

interface RecentContact {
  id: string
  first_name: string
  last_name: string
  type: ContactType
  created_at: string
  contact_units?: { unit?: { address: string; unit_number?: string | null } | null }[]
}

interface RecentComm {
  id: string
  type: string
  direction: string
  subject: string | null
  body: string | null
  created_at: string
  contact?: { first_name: string; last_name: string } | null
}

interface PipelineStage {
  stage: LeasingPipelineStage
  count: number
  color: string
}

interface Props {
  userName: string
  stats: {
    total: number
    newThisWeek: number
    stageCounts: Record<LeasingPipelineStage, number>
  }
  recentContacts: RecentContact[]
  recentCommunications: RecentComm[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COMM_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  sms: MessageSquare,
  phone: Phone,
}

const COMM_COLORS: Record<string, string> = {
  email: 'text-blue-500',
  sms: 'text-purple-500',
  phone: 'text-green-500',
}

const TYPE_BADGE: Record<ContactType, string> = {
  prospect: 'bg-blue-100 text-blue-700',
  tenant: 'bg-slate-100 text-slate-700',
}

const PIPELINE_BAR_ORDER: LeasingPipelineStage[] = [
  'inquired',
  'qualified',
  'showing',
  'toured',
  'feedback',
  'applied',
]

const STAGE_COLORS: Record<LeasingPipelineStage, string> = {
  inquired: 'bg-slate-400',
  qualified: 'bg-purple-400',
  showing: 'bg-blue-400',
  toured: 'bg-cyan-400',
  feedback: 'bg-amber-400',
  applied: 'bg-green-400',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCardItem({ label, value, icon: Icon, href, color }: StatCard) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-5">
          <div
            className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', color)}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl leading-none font-bold">{value}</p>
            <p className="text-muted-foreground mt-1 text-xs">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function PipelineBar({ stages }: { stages: PipelineStage[] }) {
  const total = stages.reduce((sum, s) => sum + s.count, 0)
  if (total === 0)
    return <p className="text-muted-foreground py-4 text-sm">No contacts in pipeline.</p>

  return (
    <div className="space-y-3">
      {/* Bar */}
      <div className="flex h-3 overflow-hidden rounded-full">
        {stages
          .filter((s) => s.count > 0)
          .map((s) => (
            <div
              key={s.stage}
              className={cn('transition-all', s.color)}
              style={{ width: `${(s.count / total) * 100}%` }}
              title={`${LEASING_STAGE_LABELS[s.stage]}: ${s.count}`}
            />
          ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {stages.map((s) => (
          <div key={s.stage} className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span className={cn('h-2 w-2 rounded-full', s.color)} />
            <span>{LEASING_STAGE_LABELS[s.stage]}</span>
            <span className="text-foreground font-medium">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardShell({ userName, stats, recentContacts, recentCommunications }: Props) {
  const statCards: StatCard[] = [
    {
      label: 'Total Contacts',
      value: stats.total,
      icon: Users,
      href: '/contacts',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'New This Week',
      value: stats.newThisWeek,
      icon: TrendingUp,
      href: '/contacts',
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Showings Scheduled',
      value: stats.stageCounts.showing,
      icon: CalendarCheck,
      href: '/leasing-opportunities',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Applications In',
      value: stats.stageCounts.applied,
      icon: FileText,
      href: '/contacts',
      color: 'bg-orange-50 text-orange-600',
    },
  ]

  const pipelineStages: PipelineStage[] = PIPELINE_BAR_ORDER.map((stage) => ({
    stage,
    count: stats.stageCounts[stage],
    color: STAGE_COLORS[stage],
  }))

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = userName.split(' ')[0]

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="bg-card flex h-14 items-center justify-between border-b px-6">
        <div>
          <p className="text-sm font-semibold">
            {greeting}, {firstName}
          </p>
          <p className="text-muted-foreground text-xs">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/contacts">
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              View Contacts
            </Button>
          </Link>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {statCards.map((card) => (
              <StatCardItem key={card.label} {...card} />
            ))}
          </div>

          {/* Pipeline + Recent comms */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Pipeline overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold">Pipeline Overview</CardTitle>
                <Link
                  href="/contacts"
                  className="text-primary flex items-center gap-1 text-xs hover:underline"
                >
                  View contacts <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent>
                <PipelineBar stages={pipelineStages} />

                {/* Stage rows */}
                <div className="mt-4 divide-y">
                  {pipelineStages
                    .filter((s) => s.count > 0)
                    .map((s) => (
                      <div key={s.stage} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-muted-foreground">
                          {LEASING_STAGE_LABELS[s.stage]}
                        </span>
                        <span className="font-medium">{s.count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent communications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold">Recent Communications</CardTitle>
                <Link
                  href="/communications"
                  className="text-primary flex items-center gap-1 text-xs hover:underline"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {recentCommunications.length === 0 && (
                  <p className="text-muted-foreground px-6 py-4 text-sm">No communications yet.</p>
                )}
                <div className="divide-y">
                  {recentCommunications.map((comm) => {
                    const Icon = COMM_ICONS[comm.type] ?? Mail
                    return (
                      <div key={comm.id} className="flex items-start gap-3 px-6 py-3">
                        <div
                          className={cn(
                            'mt-0.5 shrink-0',
                            COMM_COLORS[comm.type] ?? 'text-muted-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {comm.contact && (
                              <span className="text-xs font-medium">
                                {comm.contact.first_name} {comm.contact.last_name}
                              </span>
                            )}
                            {comm.direction === 'inbound' ? (
                              <ArrowDownLeft className="h-3 w-3 text-blue-400" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3 text-green-400" />
                            )}
                            <span className="text-muted-foreground ml-auto text-xs">
                              {format(new Date(comm.created_at), 'MMM d')}
                            </span>
                          </div>
                          <p className="text-muted-foreground truncate text-xs">
                            {comm.subject ?? comm.body ?? '—'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent contacts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold">Recently Added Contacts</CardTitle>
              <Link
                href="/contacts"
                className="text-primary flex items-center gap-1 text-xs hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentContacts.length === 0 && (
                <p className="text-muted-foreground px-6 py-4 text-sm">
                  No contacts yet. Add one manually or set up your n8n webhook.
                </p>
              )}
              <div className="divide-y">
                {recentContacts.map((contact) => {
                  const unit = contact.contact_units?.[0]?.unit
                  return (
                    <Link
                      key={contact.id}
                      href="/contacts"
                      className="hover:bg-muted/40 flex items-center gap-4 px-6 py-3 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {contact.first_name[0]}
                        {contact.last_name[0]}
                      </div>

                      {/* Name + unit */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {contact.first_name} {contact.last_name}
                        </p>
                        {unit && (
                          <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                            <Building2 className="h-3 w-3" />
                            {unit.address}
                            {unit.unit_number ? ` #${unit.unit_number}` : ''}
                          </p>
                        )}
                      </div>

                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                          TYPE_BADGE[contact.type]
                        )}
                      >
                        {CONTACT_TYPE_LABELS[contact.type]}
                      </span>

                      {/* Date */}
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {format(new Date(contact.created_at), 'MMM d')}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI tip */}
          <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-lg border px-5 py-4">
            <Sparkles className="text-primary mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">AI Assistant is ready</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Select any contact and use the AI sidebar to get next-step recommendations, draft
                messages, or summarize their history.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
