import { useNavigate, useLocation } from 'react-router-dom'
import { MobileShell, NavBar } from '@/components/trak'
import { ChevronLeft } from 'lucide-react'
import { IconMatch } from '@/components/icons/TrakIcons'

export default function PlayerLogChoose() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <MobileShell>
      {/* Topbar */}
      <div className="flex items-center justify-between pt-3 pb-2 border-b border-white/[0.07]">
        <button onClick={() => navigate('/player/home')}
          className="w-[34px] h-[34px] bg-[#17171A] border border-white/[0.11] rounded-[10px] flex items-center justify-center">
          <ChevronLeft size={14} className="text-white/88" />
        </button>
        <span className="text-[16px] font-medium text-white/88 tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          What are you logging?
        </span>
        <div className="w-[34px]" />
      </div>

      {/* Centered content */}
      <div className="flex-1 flex flex-col justify-center py-6 gap-4">
        <button onClick={() => navigate('/player/log')}
          className="w-full bg-[#101012] border border-[rgba(200,242,90,0.18)] rounded-[24px] p-7 text-left active:scale-[0.98] transition-transform">
          <div className="mb-3"><IconMatch size={32} color="#C8F25A" /></div>
          <span className="text-[9px] font-medium tracking-[0.14em] uppercase text-[#C8F25A] block mb-3"
            style={{ fontFamily: "'DM Mono', monospace" }}>
            Match
          </span>
          <span className="text-[42px] font-light text-white/88 leading-none tracking-tight block mb-3"
            style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.03em' }}>
            Log a<br/>match.
          </span>
          <span className="text-xs text-white/22 leading-relaxed block">
            See your performance band instantly. Every match builds your record.
          </span>
        </button>
      </div>

      <NavBar role="player" activeTab="/player/logchoose" onNavigate={navigate} />
    </MobileShell>
  )
}
