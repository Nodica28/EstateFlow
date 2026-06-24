import { CheckCircle2 } from 'lucide-react'

export function IdUploadAlreadyComplete({ contactName }: { contactName: string }) {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="px-5 pt-10 pb-6 text-center">
        <h1 className="text-xl font-semibold">ID Verification</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold">We already have your documents</h2>
        <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed">
          Hi {contactName}, your front ID, back ID, and selfie with ID are already on file. You do
          not need to upload them again through this link.
        </p>
        <p className="text-muted-foreground mt-4 max-w-md text-xs leading-relaxed">
          If you were sent this link again by mistake, or you need to replace a document, please
          reach out to the person who invited you so they can send a new upload link if needed.
        </p>
      </div>
    </div>
  )
}
