'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BadgeCheck,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/useUIStore'
import { useCommunicationsStore } from '@/stores/useCommunicationsStore'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/license-review', label: 'License review', icon: BadgeCheck },
  { href: '/units', label: 'Units', icon: Building2 },
  { href: '/leasing-opportunities', label: 'Leasing', icon: FileText },
  { href: '/communications', label: 'Communications', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const [licensePendingCount, setLicensePendingCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch('/api/contacts/license-pending-count')
      .then((r) => r.json())
      .then((j: { count?: number; readyToVerify?: number }) => {
        const n =
          typeof j.count === 'number'
            ? j.count
            : typeof j.readyToVerify === 'number'
              ? j.readyToVerify
              : 0
        if (!cancelled) setLicensePendingCount(n)
      })
      .catch(() => {
        if (!cancelled) setLicensePendingCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const unreadCount = useCommunicationsStore(
    (s) => s.communications.filter((c) => !c.is_read && !c.is_archived).length
  )

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'bg-card relative flex h-full flex-col border-r transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-3">
        {!sidebarCollapsed && (
          <span className="text-primary text-sm font-semibold tracking-tight">RealEstate CRM</span>
        )}
        {sidebarCollapsed && <Building2 className="text-primary mx-auto h-5 w-5" />}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
          const isComms = href === '/communications'
          const isLicenseReview = href === '/license-review'
          const showCommsBadge = isComms && unreadCount > 0 && !active
          const showLicenseBadge =
            isLicenseReview && licensePendingCount > 0 && !sidebarCollapsed && !active
          const cornerBadge =
            (showCommsBadge && sidebarCollapsed) ||
            (isLicenseReview && licensePendingCount > 0 && sidebarCollapsed && !active)
              ? showCommsBadge && sidebarCollapsed
                ? { value: unreadCount, className: 'bg-blue-500' }
                : { value: licensePendingCount, className: 'bg-amber-500' }
              : null

          const linkEl = (
            <Link
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <div className="relative shrink-0">
                <Icon className="h-4 w-4" />
                {cornerBadge && (
                  <span
                    className={cn(
                      'absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold text-white',
                      cornerBadge.className
                    )}
                  >
                    {cornerBadge.value > 9 ? '9+' : cornerBadge.value}
                  </span>
                )}
              </div>
              {!sidebarCollapsed && (
                <span className="flex flex-1 items-center justify-between">
                  {label}
                  {showCommsBadge && (
                    <span className="ml-auto rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {showLicenseBadge && (
                    <span className="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {licensePendingCount > 99 ? '99+' : licensePendingCount}
                    </span>
                  )}
                </span>
              )}
            </Link>
          )

          if (!sidebarCollapsed) return <div key={href}>{linkEl}</div>

          return (
            <Tooltip key={href}>
              <TooltipTrigger render={<span />}>{linkEl}</TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t p-2">
        {sidebarCollapsed ? (
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground w-full justify-center"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground w-full justify-start gap-3"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign out</span>
          </Button>
        )}
      </div>

      {/* Collapse toggle */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-16 -right-3 z-10 h-6 w-6 rounded-full"
        onClick={toggleSidebar}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </aside>
  )
}
