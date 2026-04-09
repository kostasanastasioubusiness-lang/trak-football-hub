import type { ReactNode } from 'react'

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[430px] min-h-screen bg-[#0A0A0B] px-5 pb-24">
      {children}
    </div>
  )
}
