import { ShieldCheck, ShieldX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Props = {
  verified: boolean
  className?: string
}

export function IdVerificationBadge({ verified, className }: Props) {
  if (verified) {
    return (
      <Badge
        variant="outline"
        className={cn('gap-1 border-green-200 text-green-700 dark:text-green-600', className)}
      >
        <ShieldCheck className="h-3 w-3" />
        Verified
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 border-amber-200/90 text-amber-900 dark:border-amber-800/80 dark:text-amber-500',
        className
      )}
    >
      <ShieldX className="h-3 w-3" />
      Unverified
    </Badge>
  )
}
