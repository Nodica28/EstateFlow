import { TopBar } from '@/components/layout/TopBar'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Settings" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-lg space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your agent account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input defaultValue={profile?.full_name ?? ''} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input defaultValue={user?.email ?? ''} disabled />
              </div>
            </CardContent>
          </Card>
          <ChangePasswordForm email={user?.email ?? ''} />
        </div>
      </div>
    </div>
  )
}
