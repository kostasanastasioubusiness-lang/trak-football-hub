import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { MobileShell, NavBar, MetadataLabel } from '@/components/trak'

type Msg = { role: 'user' | 'assistant'; content: string }

const PROMPTS = [
  'Plan a 60-min session focused on first touch under pressure',
  'Suggest 3 rondo variations for U14',
  'Drills to improve tactical awareness for my weakest players',
  'Pre-match warm-up for a Saturday cup tie',
]

export default function CoachAssistant() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [useSquad, setUseSquad] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  const send = async (textRaw?: string) => {
    const text = (textRaw ?? input).trim()
    if (!text || isLoading) return
    const userMsg: Msg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    let acc = ''
    const upsert = (chunk: string) => {
      acc += chunk
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m))
        }
        return [...prev, { role: 'assistant', content: acc }]
      })
    }

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          includeSquadContext: useSquad,
        }),
      })

      if (!resp.ok) {
        if (resp.status === 429) toast.error('Rate limit reached, try again shortly.')
        else if (resp.status === 402) toast.error('AI credits exhausted. Add credits in workspace settings.')
        else toast.error('Assistant unavailable')
        setIsLoading(false)
        return
      }
      if (!resp.body) throw new Error('No stream')

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let done = false
      while (!done) {
        const { done: rd, value } = await reader.read()
        if (rd) break
        buffer += decoder.decode(value, { stream: true })
        let nl: number
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl)
          buffer = buffer.slice(nl + 1)
          if (line.endsWith('\r')) line = line.slice(0, -1)
          if (line.startsWith(':') || line.trim() === '') continue
          if (!line.startsWith('data: ')) continue
          const json = line.slice(6).trim()
          if (json === '[DONE]') { done = true; break }
          try {
            const parsed = JSON.parse(json)
            const content = parsed.choices?.[0]?.delta?.content as string | undefined
            if (content) upsert(content)
          } catch {
            buffer = line + '\n' + buffer
            break
          }
        }
      }
    } catch (e: any) {
      console.error(e)
      toast.error('Assistant error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MobileShell>
      <div className="pt-3 pb-32 flex flex-col" style={{ minHeight: '100vh' }}>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 999, background: '#101012', border: '1px solid rgba(255,255,255,0.07)' }}
            aria-label="Back"
          >
            <ArrowLeft size={16} color="rgba(255,255,255,0.6)" />
          </button>
          <div>
            <p className="text-[9px] tracking-[0.12em] uppercase" style={{ fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.35)' }}>
              Coach
            </p>
            <h1 className="text-[22px] leading-tight" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: 'rgba(255,255,255,0.88)' }}>
              Assistant
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Use my squad data
          </span>
          <button
            role="switch"
            aria-checked={useSquad}
            onClick={() => setUseSquad(v => !v)}
            style={{
              position: 'relative', width: 38, height: 22, borderRadius: 999,
              background: useSquad ? '#C8F25A' : 'rgba(255,255,255,0.1)',
              transition: 'background 150ms ease',
            }}
          >
            <span style={{
              position: 'absolute', top: 2, left: useSquad ? 18 : 2,
              width: 18, height: 18, borderRadius: 999,
              background: useSquad ? '#000' : '#0A0A0B',
              transition: 'left 150ms ease',
            }} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <div className="rounded-[18px] border border-white/[0.07] p-5" style={{ background: '#101012' }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} color="#C8F25A" />
                <MetadataLabel text="TRY ASKING" />
              </div>
              <div className="space-y-2 mt-3">
                {PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => send(p)}
                    className="w-full text-left rounded-[12px] p-3 transition"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.78)' }}>{p}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className="rounded-[14px] p-3.5"
              style={{
                background: m.role === 'user' ? 'rgba(200,242,90,0.06)' : '#101012',
                border: m.role === 'user' ? '1px solid rgba(200,242,90,0.18)' : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p className="text-[8px] tracking-[0.12em] uppercase mb-2" style={{ fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.3)' }}>
                {m.role === 'user' ? 'You' : 'Trak AI'}
              </p>
              <div
                className="prose prose-sm max-w-none"
                style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif" }}
              >
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 12, marginBottom: 6, color: 'rgba(255,255,255,0.95)' }} {...props} />,
                    h2: ({ node, ...props }) => <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 12, marginBottom: 6, color: 'rgba(255,255,255,0.95)' }} {...props} />,
                    h3: ({ node, ...props }) => <h4 style={{ fontSize: 13, fontWeight: 600, marginTop: 10, marginBottom: 4, color: 'rgba(255,255,255,0.92)' }} {...props} />,
                    p: ({ node, ...props }) => <p style={{ margin: '6px 0' }} {...props} />,
                    ul: ({ node, ...props }) => <ul style={{ margin: '6px 0', paddingLeft: 18 }} {...props} />,
                    ol: ({ node, ...props }) => <ol style={{ margin: '6px 0', paddingLeft: 18 }} {...props} />,
                    li: ({ node, ...props }) => <li style={{ margin: '2px 0' }} {...props} />,
                    strong: ({ node, ...props }) => <strong style={{ color: 'rgba(255,255,255,0.95)' }} {...props} />,
                    code: ({ node, ...props }) => <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }} {...props} />,
                  }}
                >
                  {m.content}
                </ReactMarkdown>
                {m.role === 'assistant' && isLoading && i === messages.length - 1 && (
                  <span style={{ opacity: 0.4 }}>▍</span>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="rounded-[14px] border border-white/[0.07] p-4" style={{ background: '#101012' }}>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Thinking…</p>
            </div>
          )}
        </div>

        <div
          className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-2"
          style={{ background: 'linear-gradient(to top, rgba(10,10,11,1) 60%, rgba(10,10,11,0))' }}
        >
          <div className="flex items-end gap-2 rounded-[14px] p-2" style={{ background: '#101012', border: '1px solid rgba(255,255,255,0.07)' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask for a drill, session plan, or idea…"
              rows={1}
              className="flex-1 outline-none resize-none p-2 text-[13px]"
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.88)', maxHeight: 120 }}
            />
            <button
              onClick={() => send()}
              disabled={isLoading || !input.trim()}
              className="rounded-full flex items-center justify-center"
              style={{
                width: 36, height: 36,
                background: input.trim() && !isLoading ? '#C8F25A' : 'rgba(255,255,255,0.06)',
                color: '#000',
              }}
              aria-label="Send"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
      <NavBar role="coach" activeTab="/coach/home" onNavigate={p => navigate(p)} />
    </MobileShell>
  )
}