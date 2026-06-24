'use client'

import { useRef, useEffect, useState, FormEvent } from 'react'
import { Bot, Send, X, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUIStore } from '@/stores/useUIStore'
import { useContactStore } from '@/stores/useContactStore'
import type { AIMessage } from '@/types'
import { cn } from '@/lib/utils'

export function AISidebar() {
  const { aiSidebarOpen, toggleAISidebar, selectedContactId } = useUIStore()
  const { contacts } = useContactStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const selectedContact = selectedContactId
    ? contacts.find((c) => c.id === selectedContactId)
    : null

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: AIMessage = { role: 'user', content: input.trim() }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          contactContext: selectedContact ?? null,
        }),
      })

      if (!res.ok) throw new Error('Request failed')
      const text = await res.text()
      setMessages([...nextMessages, { role: 'assistant', content: text }])
    } catch {
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (!aiSidebarOpen) {
    return (
      <div className="bg-card flex w-10 flex-col items-center border-l py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleAISidebar}>
          <Bot className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <aside className="bg-card flex w-72 flex-col border-l">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Bot className="text-primary h-4 w-4" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleAISidebar}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Context chip */}
      {selectedContact && (
        <div className="border-b px-4 py-2">
          <p className="text-muted-foreground text-xs">
            Context:{' '}
            <span className="text-foreground font-medium">
              {selectedContact.first_name} {selectedContact.last_name}
            </span>
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <Bot className="text-muted-foreground/50 mb-3 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              Ask anything about your contacts, deals, or next steps.
            </p>
          </div>
        )}
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                {m.role === 'user' ? (
                  m.content
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      ul: ({ children }) => (
                        <ul className="mb-1 ml-4 list-disc space-y-0.5">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-1 ml-4 list-decimal space-y-0.5">{children}</ol>
                      ),
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => (
                        <strong className="font-semibold">{children}</strong>
                      ),
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => (
                        <code className="bg-background/50 rounded px-1 py-0.5 font-mono text-xs">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-background/50 mb-1 overflow-x-auto rounded p-2 font-mono text-xs">
                          {children}
                        </pre>
                      ),
                      h1: ({ children }) => <h1 className="mb-1 text-sm font-bold">{children}</h1>,
                      h2: ({ children }) => (
                        <h2 className="mb-1 text-sm font-semibold">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-1 text-sm font-medium">{children}</h3>
                      ),
                      table: ({ children }) => (
                        <div className="mb-1 overflow-x-auto">
                          <table className="w-full border-collapse text-xs">{children}</table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border-muted-foreground/30 border px-2 py-1 text-left font-semibold">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border-muted-foreground/30 border px-2 py-1">{children}</td>
                      ),
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="h-8 text-sm"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={isLoading || !input.trim()}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </aside>
  )
}
